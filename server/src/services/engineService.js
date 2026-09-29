const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('../utils/logger');

const ENGINE_TIMEOUT_MS = 10000; // 10s per command

class EngineService {
  constructor() {
    this.proc = null;
    this.buffer = '';
    this.pending = new Map(); // id -> { resolve, reject, timer }
    this.reqId = 0;
    this.ready = false;
    this.starting = false;
  }

  _enginePath() {
    // On Render (Linux) the binary is optigrid_engine; on Windows .exe
    const base = process.env.ENGINE_PATH ||
      path.join(__dirname, '..', '..', '..', 'engine', 'build', 'optigrid_engine');
    // Append .exe on Windows
    if (process.platform === 'win32' && !base.endsWith('.exe')) {
      return base + '.exe';
    }
    return base;
  }

  start() {
    if (this.proc && !this.proc.killed) return;
    if (this.starting) return;
    this.starting = true;

    const enginePath = this._enginePath();
    logger.info(`Starting C++ engine: ${enginePath}`);

    this.proc = spawn(enginePath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    this.ready = true;
    this.starting = false;

    this.proc.stdout.on('data', (data) => {
      this.buffer += data.toString();
      let newlineIdx;
      while ((newlineIdx = this.buffer.indexOf('\n')) !== -1) {
        const line = this.buffer.slice(0, newlineIdx).trim();
        this.buffer = this.buffer.slice(newlineIdx + 1);
        if (line) this._handleResponse(line);
      }
    });

    this.proc.stderr.on('data', (data) => {
      logger.warn(`Engine stderr: ${data.toString().trim()}`);
    });

    this.proc.on('close', (code) => {
      logger.warn(`Engine process exited with code ${code}`);
      this.ready = false;
      this.proc = null;
      // Reject all pending
      this.pending.forEach(({ reject, timer }) => {
        clearTimeout(timer);
        reject(new Error(`Engine process exited with code ${code}`));
      });
      this.pending.clear();
    });

    this.proc.on('error', (err) => {
      logger.error(`Engine spawn error: ${err.message}`);
      this.ready = false;
      this.pending.forEach(({ reject, timer }) => {
        clearTimeout(timer);
        reject(err);
      });
      this.pending.clear();
    });
  }

  _handleResponse(line) {
    try {
      const msg = JSON.parse(line);
      const id = msg._reqId;
      const entry = this.pending.get(id);
      if (!entry) {
        logger.warn(`Engine response with unknown id: ${line}`);
        return;
      }
      clearTimeout(entry.timer);
      this.pending.delete(id);
      if (msg.type === 'error') {
        entry.reject(new Error(msg.message || 'Engine error'));
      } else {
        entry.resolve(msg);
      }
    } catch (e) {
      logger.error(`Failed to parse engine response: ${line}`);
    }
  }

  _send(payload) {
    if (!this.ready || !this.proc) {
      this.start();
    }
    return new Promise((resolve, reject) => {
      const id = ++this.reqId;
      payload._reqId = id;

      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Engine timeout after ${ENGINE_TIMEOUT_MS}ms`));
      }, ENGINE_TIMEOUT_MS);

      this.pending.set(id, { resolve, reject, timer });

      try {
        this.proc.stdin.write(JSON.stringify(payload) + '\n');
      } catch (e) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(e);
      }
    });
  }

  async ping() {
    return this._send({ type: 'ping' });
  }

  async dijkstra({ rows, cols, source, edgeWeights = [] }) {
    return this._send({ type: 'dijkstra', rows, cols, source, edgeWeights });
  }

  async allocate({ strategy, requestId, sourceNode, priority, rows, cols, edgeWeights = [], resources, weights }) {
    const w = weights || {};
    return this._send({
      type: 'allocate',
      strategy,
      requestId,
      sourceNode,
      priority,
      rows,
      cols,
      edgeWeights,
      resources,
      wD: w.wD || 0.4,
      wW: w.wW || 0.3,
      wP: w.wP || 0.2,
      wA: w.wA || 0.1
    });
  }

  async benchmark({ rows, cols, edgeWeights = [], numResources, numRequests, seed, weights }) {
    const w = weights || {};
    return this._send({
      type: 'benchmark',
      rows,
      cols,
      edgeWeights,
      numResources,
      numRequests,
      seed,
      wD: w.wD || 0.4,
      wW: w.wW || 0.3,
      wP: w.wP || 0.2,
      wA: w.wA || 0.1
    });
  }

  stop() {
    if (this.proc && !this.proc.killed) {
      this.proc.kill('SIGTERM');
    }
    this.ready = false;
  }
}

// Singleton instance
const engineService = new EngineService();
module.exports = engineService;

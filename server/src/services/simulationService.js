const SimulationRun = require('../models/SimulationRun');
const Request = require('../models/Request');
const Resource = require('../models/Resource');
const allocationService = require('./allocationService');
const { logger } = require('../utils/logger');

// In-memory simulation state keyed by simulationId
const activeSimulations = new Map();

const simulationService = {
  async start({ scenario, strategy, io }) {
    const sim = await SimulationRun.create({
      scenarioId: scenario._id,
      strategy,
      seed: scenario.seed,
      status: 'RUNNING',
      startedAt: new Date(),
      requestCount: scenario.requestCount
    });

    const state = {
      sim,
      scenario,
      strategy,
      io,
      paused: false,
      stopped: false,
      tick: 0,
      allocations: [],
      latencies: []
    };
    activeSimulations.set(String(sim._id), state);

    // Emit started event
    if (io) {
      io.to(`simulation:${sim._id}`).emit('simulation:started', { simulationId: sim._id, strategy });
    }

    // Run simulation asynchronously
    setImmediate(() => this._runLoop(String(sim._id)));

    return sim;
  },

  async pause(simulationId) {
    const state = activeSimulations.get(simulationId);
    if (!state) throw new Error('Simulation not found or not running');
    state.paused = true;
    await SimulationRun.findByIdAndUpdate(simulationId, { status: 'PAUSED' });
    if (state.io) state.io.to(`simulation:${simulationId}`).emit('simulation:paused', { simulationId });
    return SimulationRun.findById(simulationId);
  },

  async resume(simulationId) {
    const state = activeSimulations.get(simulationId);
    if (!state) throw new Error('Simulation not found or not running');
    state.paused = false;
    await SimulationRun.findByIdAndUpdate(simulationId, { status: 'RUNNING' });
    if (state.io) state.io.to(`simulation:${simulationId}`).emit('simulation:resumed', { simulationId });
    return SimulationRun.findById(simulationId);
  },

  async stop(simulationId) {
    const state = activeSimulations.get(simulationId);
    if (state) {
      state.stopped = true;
      state.paused = false;
    }
    const sim = await SimulationRun.findByIdAndUpdate(simulationId, {
      status: 'STOPPED',
      completedAt: new Date()
    }, { new: true });
    activeSimulations.delete(simulationId);
    return sim;
  },

  async getById(id) {
    return SimulationRun.findById(id).populate('scenarioId');
  },

  async _runLoop(simulationId) {
    const state = activeSimulations.get(simulationId);
    if (!state) return;

    const { scenario, strategy, io } = state;

    // Get resources for this scenario
    const resources = await Resource.find({ scenarioId: scenario._id });
    if (resources.length === 0) {
      logger.warn(`No resources found for scenario ${scenario._id}`);
    }

    // Get waiting requests
    const requests = await Request.find({
      scenarioId: scenario._id,
      status: 'WAITING'
    }).sort({ arrivalTime: 1 });

    let completedCount = 0;
    let failedCount = 0;
    const latencies = [];

    for (const req of requests) {
      if (state.stopped) break;

      // Wait while paused
      while (state.paused && !state.stopped) {
        await new Promise(r => setTimeout(r, 200));
      }
      if (state.stopped) break;

      // Emit tick
      state.tick++;
      if (io) {
        io.to(`simulation:${simulationId}`).emit('simulation:tick', {
          simulationId,
          tick: state.tick,
          progress: Math.round((state.tick / requests.length) * 100)
        });
      }

      try {
        // Re-fetch resources for current status
        const currentResources = await Resource.find({ scenarioId: scenario._id });

        const { decision, engineResult } = await allocationService.allocate({
          simulationId,
          scenario,
          request: req,
          resources: currentResources,
          strategy,
          io
        });

        latencies.push(engineResult.latencyNs / 1e6);

        if (engineResult.selectedResourceId !== -1) {
          completedCount++;
          // Free resource after serviceDuration
          setTimeout(async () => {
            const res = currentResources.find(r => String(r.resourceId) === String(engineResult.selectedResourceId));
            if (res) {
              await Resource.findByIdAndUpdate(res._id, {
                status: 'AVAILABLE',
                currentLoad: Math.max(0, res.currentLoad - 0.2),
                lastStateChange: new Date()
              });
              if (io) {
                io.to(`simulation:${simulationId}`).emit('resource:updated', {
                  resourceId: res._id,
                  status: 'AVAILABLE'
                });
              }
            }
          }, req.serviceDuration || 1000);
        } else {
          failedCount++;
        }

        // Small delay between requests to allow real-time observation
        await new Promise(r => setTimeout(r, 50));

      } catch (err) {
        logger.error(`Allocation error for request ${req.requestId}:`, err.message);
        failedCount++;
      }
    }

    if (state.stopped) return;

    // Calculate final metrics
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    const sortedLat = [...latencies].sort((a, b) => a - b);
    const p95Idx = Math.ceil(0.95 * sortedLat.length) - 1;
    const p95Latency = sortedLat.length > 0 ? sortedLat[Math.max(0, p95Idx)] : 0;

    const updatedSim = await SimulationRun.findByIdAndUpdate(simulationId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      allocationCount: completedCount + failedCount,
      completedRequests: completedCount,
      failedRequests: failedCount,
      averageLatencyMs: avgLatency,
      p95LatencyMs: p95Latency
    }, { new: true });

    activeSimulations.delete(simulationId);

    if (io) {
      io.to(`simulation:${simulationId}`).emit('simulation:completed', {
        simulationId,
        metrics: {
          completedRequests: completedCount,
          failedRequests: failedCount,
          averageLatencyMs: avgLatency,
          p95LatencyMs: p95Latency
        }
      });
    }

    logger.info(`Simulation ${simulationId} completed: ${completedCount} allocated, ${failedCount} failed`);
  }
};

module.exports = simulationService;

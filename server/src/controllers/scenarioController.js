const scenarioService = require('../services/scenarioService');
const resourceService = require('../services/resourceService');

const scenarioController = {
  async create(req, res, next) {
    try {
      const scenario = await scenarioService.create(req.body);
      res.status(201).json({ success: true, data: scenario });
    } catch (err) { next(err); }
  },

  async list(req, res, next) {
    try {
      const scenarios = await scenarioService.list();
      res.json({ success: true, data: scenarios });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const scenario = await scenarioService.getById(req.params.id);
      if (!scenario) return res.status(404).json({ success: false, message: 'Scenario not found' });
      res.json({ success: true, data: scenario });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const scenario = await scenarioService.update(req.params.id, req.body);
      if (!scenario) return res.status(404).json({ success: false, message: 'Scenario not found' });
      res.json({ success: true, data: scenario });
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await scenarioService.delete(req.params.id);
      res.json({ success: true, message: 'Scenario deleted' });
    } catch (err) { next(err); }
  },

  // Resources nested under scenario
  async createResource(req, res, next) {
    try {
      const resource = await resourceService.create(req.params.id, req.body);
      res.status(201).json({ success: true, data: resource });
    } catch (err) { next(err); }
  },

  async listResources(req, res, next) {
    try {
      const resources = await resourceService.listByScenario(req.params.id);
      res.json({ success: true, data: resources });
    } catch (err) { next(err); }
  },

  // Metrics for a scenario
  async getMetrics(req, res, next) {
    try {
      const SimulationRun = require('../models/SimulationRun');
      const sims = await SimulationRun.find({ scenarioId: req.params.id, status: 'COMPLETED' });
      const metrics = sims.map(s => ({
        simulationId: s._id,
        strategy: s.strategy,
        averageLatencyMs: s.averageLatencyMs,
        p95LatencyMs: s.p95LatencyMs,
        utilizationPercent: s.utilizationPercent,
        throughput: s.throughput,
        completedRequests: s.completedRequests
      }));
      res.json({ success: true, data: metrics });
    } catch (err) { next(err); }
  },

  // CSV export
  async exportData(req, res, next) {
    try {
      const BenchmarkRun = require('../models/BenchmarkRun');
      const benchmarks = await BenchmarkRun.find({ scenarioId: req.params.id, status: 'COMPLETED' });
      const rows = ['benchmarkId,strategy,avgLatencyMs,p95LatencyMs,utilization,throughput,totalDistance'];
      benchmarks.forEach(b => {
        ['fifoMetrics','nearestMetrics','optigridMetrics'].forEach(key => {
          const m = b[key];
          if (m) rows.push(`${b._id},${m.strategy},${m.averageLatencyMs},${m.p95LatencyMs},${m.utilizationPercent},${m.throughput},${m.totalDistance}`);
        });
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=optigrid_benchmark_${req.params.id}.csv`);
      res.send(rows.join('\n'));
    } catch (err) { next(err); }
  }
};

module.exports = scenarioController;

const benchmarkService = require('../services/benchmarkService');
const scenarioService = require('../services/scenarioService');

const benchmarkController = {
  async run(req, res, next) {
    try {
      const { scenarioId } = req.body;
      if (!scenarioId) return res.status(400).json({ success: false, message: 'scenarioId is required' });

      const scenario = await scenarioService.getById(scenarioId);
      if (!scenario) return res.status(404).json({ success: false, message: 'Scenario not found' });

      // Run async but respond immediately with the benchmark doc ID
      // The benchmark result is stored and can be fetched via GET /benchmarks/:id
      const benchmark = await benchmarkService.run(scenario);
      res.status(201).json({ success: true, data: benchmark });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const benchmark = await benchmarkService.getById(req.params.id);
      if (!benchmark) return res.status(404).json({ success: false, message: 'Benchmark not found' });
      res.json({ success: true, data: benchmark });
    } catch (err) { next(err); }
  }
};

module.exports = benchmarkController;

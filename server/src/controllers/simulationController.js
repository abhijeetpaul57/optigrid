const simulationService = require('../services/simulationService');
const scenarioService = require('../services/scenarioService');
const allocationService = require('../services/allocationService');
const AllocationDecision = require('../models/AllocationDecision');

const simulationController = {
  async start(req, res, next) {
    try {
      const { scenarioId, strategy } = req.body;
      if (!scenarioId) return res.status(400).json({ success: false, message: 'scenarioId is required' });

      const scenario = await scenarioService.getById(scenarioId);
      if (!scenario) return res.status(404).json({ success: false, message: 'Scenario not found' });

      const strat = strategy || scenario.strategy || 'OPTIGRID';
      const sim = await simulationService.start({ scenario, strategy: strat, io: req.io });
      res.status(201).json({ success: true, data: sim });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const sim = await simulationService.getById(req.params.id);
      if (!sim) return res.status(404).json({ success: false, message: 'Simulation not found' });
      res.json({ success: true, data: sim });
    } catch (err) { next(err); }
  },

  async pause(req, res, next) {
    try {
      const sim = await simulationService.pause(req.params.id);
      res.json({ success: true, data: sim });
    } catch (err) { next(err); }
  },

  async resume(req, res, next) {
    try {
      const sim = await simulationService.resume(req.params.id);
      res.json({ success: true, data: sim });
    } catch (err) { next(err); }
  },

  async stop(req, res, next) {
    try {
      const sim = await simulationService.stop(req.params.id);
      res.json({ success: true, data: sim });
    } catch (err) { next(err); }
  },

  async getAllocations(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const decisions = await allocationService.getHistory(req.params.id, limit);
      res.json({ success: true, data: decisions });
    } catch (err) { next(err); }
  }
};

module.exports = simulationController;

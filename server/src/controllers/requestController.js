const requestService = require('../services/requestService');

const requestController = {
  async create(req, res, next) {
    try {
      const request = await requestService.create(req.params.id, req.body);
      // Emit socket event if io is attached to req
      if (req.io) {
        req.io.emit('request:created', { request });
      }
      res.status(201).json({ success: true, data: request });
    } catch (err) { next(err); }
  },

  async list(req, res, next) {
    try {
      const requests = await requestService.listByScenario(req.params.id);
      res.json({ success: true, data: requests });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const request = await requestService.getById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      res.json({ success: true, data: request });
    } catch (err) { next(err); }
  }
};

module.exports = requestController;

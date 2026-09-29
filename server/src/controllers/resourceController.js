const resourceService = require('../services/resourceService');

const resourceController = {
  async update(req, res, next) {
    try {
      const resource = await resourceService.update(req.params.id, req.body);
      if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
      res.json({ success: true, data: resource });
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await resourceService.delete(req.params.id);
      res.json({ success: true, message: 'Resource deleted' });
    } catch (err) { next(err); }
  }
};

module.exports = resourceController;

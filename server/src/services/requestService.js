const Request = require('../models/Request');

const requestService = {
  async create(scenarioId, data) {
    const request = new Request({ ...data, scenarioId });
    return request.save();
  },

  async listByScenario(scenarioId) {
    return Request.find({ scenarioId }).sort({ arrivalTime: 1 });
  },

  async getById(id) {
    return Request.findById(id);
  },

  async assign(requestId, resourceId, routeDistance, allocationScore) {
    return Request.findByIdAndUpdate(requestId, {
      status: 'ASSIGNED',
      assignedResourceId: resourceId,
      assignedAt: new Date(),
      routeDistance,
      allocationScore
    }, { new: true });
  },

  async complete(requestId) {
    const req = await Request.findById(requestId);
    if (!req) return null;
    const now = new Date();
    req.status = 'COMPLETED';
    req.completedAt = now;
    req.waitingTimeMs = req.assignedAt ? now - req.arrivalTime : 0;
    return req.save();
  },

  async cancel(requestId) {
    return Request.findByIdAndUpdate(requestId, { status: 'CANCELLED' }, { new: true });
  }
};

module.exports = requestService;

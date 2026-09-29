const Resource = require('../models/Resource');

const resourceService = {
  async create(scenarioId, data) {
    const resource = new Resource({ ...data, scenarioId });
    return resource.save();
  },

  async listByScenario(scenarioId) {
    return Resource.find({ scenarioId }).sort({ resourceId: 1 });
  },

  async getById(id) {
    return Resource.findById(id);
  },

  async update(id, data) {
    return Resource.findByIdAndUpdate(id, { ...data, lastStateChange: Date.now() }, { new: true, runValidators: true });
  },

  async delete(id) {
    return Resource.findByIdAndDelete(id);
  },

  async setStatus(id, status, load) {
    const update = { status, lastStateChange: Date.now() };
    if (load !== undefined) update.currentLoad = load;
    return Resource.findByIdAndUpdate(id, update, { new: true });
  },

  async incrementAssigned(id, busyTimeMs) {
    return Resource.findByIdAndUpdate(id, {
      $inc: { totalAssigned: 1, totalBusyTime: busyTimeMs || 0 },
      lastStateChange: Date.now()
    }, { new: true });
  }
};

module.exports = resourceService;

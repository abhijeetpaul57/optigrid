const Scenario = require('../models/Scenario');

const scenarioService = {
  async create(data) {
    const scenario = new Scenario(data);
    return scenario.save();
  },

  async list() {
    return Scenario.find().sort({ createdAt: -1 });
  },

  async getById(id) {
    return Scenario.findById(id);
  },

  async update(id, data) {
    return Scenario.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  async delete(id) {
    return Scenario.findByIdAndDelete(id);
  }
};

module.exports = scenarioService;

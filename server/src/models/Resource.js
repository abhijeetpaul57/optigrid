const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  resourceId:    { type: String, required: true },
  scenarioId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario', required: true },
  name:          { type: String, required: true },
  locationNode:  { type: Number, required: true },
  status:        { type: String, enum: ['AVAILABLE', 'BUSY', 'OFFLINE'], default: 'AVAILABLE' },
  capacity:      { type: Number, default: 1 },
  currentLoad:   { type: Number, default: 0, min: 0, max: 1 },
  totalAssigned: { type: Number, default: 0 },
  totalBusyTime: { type: Number, default: 0 }, // ms
  lastStateChange: { type: Date, default: Date.now },
  metadata:      { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

resourceSchema.index({ scenarioId: 1, status: 1 });

module.exports = mongoose.model('Resource', resourceSchema);

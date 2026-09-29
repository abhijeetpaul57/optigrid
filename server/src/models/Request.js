const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestId:          { type: String, required: true },
  scenarioId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario', required: true },
  simulationId:       { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationRun' },
  sourceNode:         { type: Number, required: true },
  priority:           { type: Number, default: 0.5, min: 0, max: 1 },
  arrivalTime:        { type: Date, default: Date.now },
  serviceDuration:    { type: Number, default: 1000 }, // ms
  status:             { type: String, enum: ['WAITING','ASSIGNED','COMPLETED','CANCELLED'], default: 'WAITING' },
  assignedResourceId: { type: String },
  assignedAt:         { type: Date },
  completedAt:        { type: Date },
  waitingTimeMs:      { type: Number },
  routeDistance:      { type: Number },
  allocationScore:    { type: Number }
}, { timestamps: true });

requestSchema.index({ scenarioId: 1, status: 1 });
requestSchema.index({ simulationId: 1, arrivalTime: 1 });

module.exports = mongoose.model('Request', requestSchema);

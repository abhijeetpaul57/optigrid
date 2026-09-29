const mongoose = require('mongoose');

const simulationRunSchema = new mongoose.Schema({
  scenarioId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario', required: true },
  strategy:           { type: String, enum: ['FIFO','NEAREST','OPTIGRID'], required: true },
  status:             { type: String, enum: ['PENDING','RUNNING','PAUSED','COMPLETED','FAILED','STOPPED'], default: 'PENDING' },
  seed:               { type: Number, required: true },
  startedAt:          { type: Date },
  completedAt:        { type: Date },
  requestCount:       { type: Number, default: 0 },
  allocationCount:    { type: Number, default: 0 },
  averageLatencyMs:   { type: Number },
  p95LatencyMs:       { type: Number },
  averageWaitTimeMs:  { type: Number },
  utilizationPercent: { type: Number },
  throughput:         { type: Number },
  totalDistance:      { type: Number, default: 0 },
  completedRequests:  { type: Number, default: 0 },
  failedRequests:     { type: Number, default: 0 },
  // Live resource/request state snapshot for dashboard
  resourceStates:     { type: mongoose.Schema.Types.Mixed },
  currentTick:        { type: Number, default: 0 }
}, { timestamps: true });

simulationRunSchema.index({ scenarioId: 1, createdAt: -1 });
simulationRunSchema.index({ status: 1 });

module.exports = mongoose.model('SimulationRun', simulationRunSchema);

const mongoose = require('mongoose');

const allocationDecisionSchema = new mongoose.Schema({
  simulationId:       { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationRun', required: true },
  requestId:          { type: String, required: true },
  strategy:           { type: String, enum: ['FIFO','NEAREST','OPTIGRID'], required: true },
  selectedResourceId: { type: String },
  sourceNode:         { type: Number },
  resourceNode:       { type: Number },
  routeDistance:      { type: Number },
  distanceCost:       { type: Number },
  workloadPenalty:    { type: Number },
  priorityBenefit:    { type: Number },
  finalScore:         { type: Number },
  allocationLatencyMs:{ type: Number },
  candidates:         { type: mongoose.Schema.Types.Mixed } // array of candidate scores
}, { timestamps: true });

allocationDecisionSchema.index({ simulationId: 1, createdAt: 1 });
allocationDecisionSchema.index({ requestId: 1 });

module.exports = mongoose.model('AllocationDecision', allocationDecisionSchema);

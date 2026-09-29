const mongoose = require('mongoose');

const edgeSchema = new mongoose.Schema({
  from: { type: Number, required: true },
  to:   { type: Number, required: true },
  weight: { type: Number, default: 1 }
}, { _id: false });

const scoringWeightsSchema = new mongoose.Schema({
  wD: { type: Number, default: 0.4 }, // distance weight
  wW: { type: Number, default: 0.3 }, // workload weight
  wP: { type: Number, default: 0.2 }, // priority weight
  wA: { type: Number, default: 0.1 }  // availability weight
}, { _id: false });

const scenarioSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  rows:          { type: Number, required: true, min: 2, max: 20 },
  cols:          { type: Number, required: true, min: 2, max: 20 },
  edgeWeights:   { type: [Number], default: [] }, // flat array; empty = all weight 1
  strategy:      { type: String, enum: ['FIFO', 'NEAREST', 'OPTIGRID'], default: 'OPTIGRID' },
  scoringWeights: { type: scoringWeightsSchema, default: () => ({}) },
  resourceCount: { type: Number, required: true, min: 1 },
  requestCount:  { type: Number, required: true, min: 1 },
  seed:          { type: Number, default: 42 },
  status:        { type: String, enum: ['DRAFT', 'ACTIVE', 'COMPLETED'], default: 'DRAFT' }
}, { timestamps: true });

module.exports = mongoose.model('Scenario', scenarioSchema);

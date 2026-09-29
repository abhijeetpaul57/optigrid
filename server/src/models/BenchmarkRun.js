const mongoose = require('mongoose');

const metricsSchema = new mongoose.Schema({
  strategy:           String,
  completedRequests:  Number,
  failedRequests:     Number,
  averageLatencyMs:   Number,
  p95LatencyMs:       Number,
  averageWaitTimeMs:  Number,
  utilizationPercent: Number,
  throughput:         Number,
  totalDistance:      Number
}, { _id: false });

const improvementsSchema = new mongoose.Schema({
  latencyImprovementPct:     Number, // (baseline - optigrid) / baseline * 100
  waitTimeImprovementPct:    Number,
  utilizationChangePct:      Number, // absolute pp change
  throughputImprovementPct:  Number,
  distanceImprovementPct:    Number
}, { _id: false });

const benchmarkRunSchema = new mongoose.Schema({
  scenarioId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario', required: true },
  seed:              { type: Number, required: true },
  requestCount:      { type: Number, required: true },
  fifoMetrics:       { type: metricsSchema },
  nearestMetrics:    { type: metricsSchema },
  optigridMetrics:   { type: metricsSchema },
  // Improvements are FIFO vs OptiGrid
  improvements:      { type: improvementsSchema },
  environment:       { type: String },
  status:            { type: String, enum: ['RUNNING','COMPLETED','FAILED'], default: 'RUNNING' }
}, { timestamps: true });

benchmarkRunSchema.index({ scenarioId: 1, createdAt: -1 });

module.exports = mongoose.model('BenchmarkRun', benchmarkRunSchema);

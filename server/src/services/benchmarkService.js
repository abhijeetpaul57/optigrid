const BenchmarkRun = require('../models/BenchmarkRun');
const engineService = require('./engineService');
const { logger } = require('../utils/logger');

const benchmarkService = {
  /**
   * Run all three strategies on the same scenario config using the C++ engine.
   * Returns a persisted BenchmarkRun with calculated improvements.
   */
  async run(scenario) {
    const { rows, cols, edgeWeights, scoringWeights, resourceCount, requestCount, seed } = scenario;

    logger.info(`Starting benchmark for scenario ${scenario._id} seed=${seed}`);

    const benchmarkDoc = await BenchmarkRun.create({
      scenarioId: scenario._id,
      seed,
      requestCount,
      status: 'RUNNING'
    });

    try {
      const result = await engineService.benchmark({
        rows,
        cols,
        edgeWeights: edgeWeights || [],
        numResources: resourceCount,
        numRequests: requestCount,
        seed,
        weights: scoringWeights
      });

      const { fifo, nearest, optigrid } = result;

      // Calculate improvements (FIFO as baseline vs OptiGrid)
      const improvements = {
        latencyImprovementPct:    calcImprovement(fifo.averageLatencyMs, optigrid.averageLatencyMs),
        waitTimeImprovementPct:   calcImprovement(fifo.averageWaitTimeMs, optigrid.averageWaitTimeMs),
        utilizationChangePct:     (optigrid.utilizationPercent - fifo.utilizationPercent).toFixed(2),
        throughputImprovementPct: calcImprovement(fifo.throughput, optigrid.throughput, true), // higher is better
        distanceImprovementPct:   calcImprovement(fifo.totalDistance, optigrid.totalDistance)
      };

      const updated = await BenchmarkRun.findByIdAndUpdate(benchmarkDoc._id, {
        fifoMetrics:     fifo,
        nearestMetrics:  nearest,
        optigridMetrics: optigrid,
        improvements,
        status: 'COMPLETED',
        environment: `Node ${process.version}, ${process.platform}`
      }, { new: true });

      logger.info(`Benchmark ${benchmarkDoc._id} completed`);
      return updated;

    } catch (err) {
      await BenchmarkRun.findByIdAndUpdate(benchmarkDoc._id, { status: 'FAILED' });
      throw err;
    }
  },

  async getById(id) {
    return BenchmarkRun.findById(id).populate('scenarioId');
  }
};

// Improvement: (baseline - optimized) / baseline * 100 (positive = improvement)
// If higherIsBetter, reverse the formula
function calcImprovement(baseline, optimized, higherIsBetter = false) {
  if (!baseline || baseline === 0) return 0;
  if (higherIsBetter) {
    return (((optimized - baseline) / Math.abs(baseline)) * 100).toFixed(2);
  }
  return (((baseline - optimized) / Math.abs(baseline)) * 100).toFixed(2);
}

module.exports = benchmarkService;

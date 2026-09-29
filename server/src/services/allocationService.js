const AllocationDecision = require('../models/AllocationDecision');
const engineService = require('./engineService');
const resourceService = require('./resourceService');
const requestService = require('./requestService');
const { logger } = require('../utils/logger');

const allocationService = {
  /**
   * Perform a single allocation using the C++ engine.
   * Persists AllocationDecision and updates Resource/Request state.
   * Emits socket events via the provided io instance.
   */
  async allocate({ simulationId, scenario, request, resources, strategy, io }) {
    const { rows, cols, edgeWeights, scoringWeights } = scenario;

    // Build resource info for engine
    const resInfos = resources.map(r => ({
      id: r.resourceId,
      locationNode: r.locationNode,
      currentLoad: r.currentLoad,
      available: r.status === 'AVAILABLE' ? 1 : 0
    }));

    const startTime = Date.now();

    let engineResult;
    try {
      engineResult = await engineService.allocate({
        strategy,
        requestId: parseInt(request.requestId) || 1,
        sourceNode: request.sourceNode,
        priority: request.priority,
        rows,
        cols,
        edgeWeights: edgeWeights || [],
        resources: resInfos,
        weights: scoringWeights
      });
    } catch (err) {
      logger.error('Engine allocation failed:', err.message);
      throw err;
    }

    const latencyMs = Date.now() - startTime;

    // Find the selected resource document
    const selectedResource = resources.find(r => String(r.resourceId) === String(engineResult.selectedResourceId));

    // Persist allocation decision
    const decision = await AllocationDecision.create({
      simulationId,
      requestId: request.requestId,
      strategy,
      selectedResourceId: engineResult.selectedResourceId !== -1 ? String(engineResult.selectedResourceId) : null,
      sourceNode: request.sourceNode,
      resourceNode: selectedResource ? selectedResource.locationNode : null,
      routeDistance: engineResult.routeDistance,
      finalScore: engineResult.score,
      allocationLatencyMs: engineResult.latencyNs / 1e6
    });

    if (engineResult.selectedResourceId !== -1 && selectedResource) {
      // Update resource to BUSY
      await resourceService.update(selectedResource._id, {
        status: 'BUSY',
        currentLoad: Math.min(1, selectedResource.currentLoad + 0.2)
      });

      // Mark request as ASSIGNED
      await requestService.assign(
        request._id,
        String(engineResult.selectedResourceId),
        engineResult.routeDistance,
        engineResult.score
      );
    }

    // Emit socket events
    if (io) {
      const room = `simulation:${simulationId}`;
      io.to(room).emit('allocation:created', {
        decision,
        latencyMs,
        selectedResource: selectedResource || null
      });
      if (selectedResource) {
        io.to(room).emit('resource:updated', {
          resourceId: selectedResource._id,
          status: 'BUSY',
          currentLoad: Math.min(1, selectedResource.currentLoad + 0.2)
        });
      }
    }

    return { decision, engineResult };
  },

  async getHistory(simulationId, limit = 100) {
    return AllocationDecision.find({ simulationId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
};

module.exports = allocationService;

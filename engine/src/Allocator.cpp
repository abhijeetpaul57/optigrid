#include "Allocator.h"
#include "Dijkstra.h"
#include <chrono>
#include <climits>
#include <algorithm>
#include <stdexcept>

Allocator::Allocator(const Graph& graph, const ScoringWeights& weights)
    : graph_(graph), weights_(weights) {}

AllocationResult Allocator::allocate(
    const RequestInfo& req,
    const std::vector<ResourceInfo>& resources,
    Strategy strategy
) {
    switch (strategy) {
        case Strategy::FIFO:     return fifo(req, resources);
        case Strategy::NEAREST:  return nearest(req, resources);
        case Strategy::OPTIGRID: return optigrid(req, resources);
    }
    return {};
}

// FIFO: first available resource in order
AllocationResult Allocator::fifo(
    const RequestInfo& req,
    const std::vector<ResourceInfo>& resources
) {
    auto t0 = std::chrono::high_resolution_clock::now();
    AllocationResult result;

    auto dists = dijkstra(graph_, req.sourceNode);

    for (const auto& r : resources) {
        if (!r.available) continue;
        result.selectedResourceId = r.id;
        result.routeDistance      = dists[r.locationNode];
        result.score              = static_cast<double>(result.routeDistance);
        break;
    }

    auto t1 = std::chrono::high_resolution_clock::now();
    result.latencyNs = std::chrono::duration_cast<std::chrono::nanoseconds>(t1 - t0).count();
    return result;
}

// NEAREST: resource with minimum shortest-path distance
AllocationResult Allocator::nearest(
    const RequestInfo& req,
    const std::vector<ResourceInfo>& resources
) {
    auto t0 = std::chrono::high_resolution_clock::now();
    AllocationResult result;

    auto dists = dijkstra(graph_, req.sourceNode);

    int bestDist = INT_MAX;
    for (const auto& r : resources) {
        if (!r.available) continue;
        int d = dists[r.locationNode];
        if (d < bestDist) {
            bestDist = d;
            result.selectedResourceId = r.id;
            result.routeDistance      = d;
            result.score              = static_cast<double>(d);
        }
    }

    auto t1 = std::chrono::high_resolution_clock::now();
    result.latencyNs = std::chrono::duration_cast<std::chrono::nanoseconds>(t1 - t0).count();
    return result;
}

// OPTIGRID: multi-factor configurable score
AllocationResult Allocator::optigrid(
    const RequestInfo& req,
    const std::vector<ResourceInfo>& resources
) {
    auto t0 = std::chrono::high_resolution_clock::now();
    AllocationResult result;

    auto dists = dijkstra(graph_, req.sourceNode);

    // Find max distance among available resources for normalization
    int maxDist = 1;
    for (const auto& r : resources) {
        if (!r.available) continue;
        int d = dists[r.locationNode];
        if (d != INT_MAX && d > maxDist) maxDist = d;
    }

    double bestScore = 1e18;
    for (const auto& r : resources) {
        if (!r.available) continue;
        int d = dists[r.locationNode];
        if (d == INT_MAX) continue; // unreachable

        double score = computeScore(d, maxDist, r.currentLoad, req.priority, r.available);
        if (score < bestScore) {
            bestScore = score;
            result.selectedResourceId = r.id;
            result.routeDistance      = d;
            result.score              = score;
        }
    }

    auto t1 = std::chrono::high_resolution_clock::now();
    result.latencyNs = std::chrono::duration_cast<std::chrono::nanoseconds>(t1 - t0).count();
    return result;
}

double Allocator::computeScore(
    int distance, int maxDist,
    double load,
    double priority,
    bool available
) {
    // Normalize distance to [0, 1]
    double normDist = (maxDist > 0) ? static_cast<double>(distance) / maxDist : 0.0;

    // Workload penalty: load is already 0.0..1.0
    double workloadPenalty = load;

    // Priority benefit: higher priority = lower cost (reduce score)
    double priorityCost = 1.0 - priority;

    // Availability penalty: 0 if fully available, small penalty otherwise
    double availPenalty = available ? 0.0 : 1.0;

    return weights_.wD * normDist
         + weights_.wW * workloadPenalty
         + weights_.wP * priorityCost
         + weights_.wA * availPenalty;
}

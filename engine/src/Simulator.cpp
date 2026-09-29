#include "Simulator.h"
#include "Dijkstra.h"
#include <algorithm>
#include <cmath>
#include <numeric>
#include <stdexcept>

// Simple xorshift64 PRNG for deterministic generation
static uint64_t xorshift64(uint64_t& state) {
    state ^= state << 13;
    state ^= state >> 7;
    state ^= state << 17;
    return state;
}

static double randDouble(uint64_t& state, double lo, double hi) {
    double r = static_cast<double>(xorshift64(state)) / static_cast<double>(UINT64_MAX);
    return lo + r * (hi - lo);
}

static int randInt(uint64_t& state, int lo, int hi) { // [lo, hi)
    return lo + static_cast<int>(xorshift64(state) % static_cast<uint64_t>(hi - lo));
}

// ----------------------------------------------------------
Simulator::Simulator(int rows, int cols, const std::vector<int>& edgeWeights,
                     int numResources, int numRequests, uint64_t seed,
                     const ScoringWeights& weights)
    : graph_(Graph::buildGrid(rows, cols, edgeWeights)),
      numResources_(numResources),
      numRequests_(numRequests),
      seed_(seed),
      weights_(weights) {}

std::vector<SimRequest> Simulator::generateRequests(uint64_t seed) {
    std::vector<SimRequest> reqs;
    reqs.reserve(numRequests_);
    uint64_t state = seed ^ 0xDEADBEEF;
    int n = graph_.numNodes;
    for (int i = 0; i < numRequests_; ++i) {
        SimRequest r;
        r.id              = i + 1;
        r.sourceNode      = randInt(state, 0, n);
        r.priority        = randDouble(state, 0.0, 1.0);
        r.arrivalTick     = randInt(state, 0, numRequests_ * 2);
        r.serviceDuration = randInt(state, 1, 10);
        reqs.push_back(r);
    }
    // Sort by arrival time for ordered processing
    std::sort(reqs.begin(), reqs.end(), [](const SimRequest& a, const SimRequest& b){
        return a.arrivalTick < b.arrivalTick;
    });
    return reqs;
}

std::vector<SimResource> Simulator::generateResources(uint64_t seed) {
    std::vector<SimResource> res;
    res.reserve(numResources_);
    uint64_t state = seed ^ 0xCAFEBABE;
    int n = graph_.numNodes;
    for (int i = 0; i < numResources_; ++i) {
        SimResource r;
        r.id           = i + 1;
        r.locationNode = randInt(state, 0, n);
        r.available    = true;
        r.currentLoad  = randDouble(state, 0.0, 0.3); // start lightly loaded
        r.totalAssigned = 0;
        r.totalBusyTime = 0.0;
        res.push_back(r);
    }
    return res;
}

double Simulator::percentile(std::vector<double>& sorted, double p) {
    if (sorted.empty()) return 0.0;
    std::sort(sorted.begin(), sorted.end());
    size_t idx = static_cast<size_t>(std::ceil(p * sorted.size())) - 1;
    if (idx >= sorted.size()) idx = sorted.size() - 1;
    return sorted[idx];
}

SimMetrics Simulator::run(Strategy strategy) {
    auto requests  = generateRequests(seed_);
    auto resources = generateResources(seed_);

    Allocator allocator(graph_, weights_);

    SimMetrics metrics;
    metrics.strategy       = (strategy == Strategy::FIFO)    ? "FIFO" :
                             (strategy == Strategy::NEAREST)  ? "NEAREST" : "OPTIGRID";
    metrics.totalRequests  = numRequests_;
    metrics.completedRequests = 0;
    metrics.failedRequests    = 0;
    metrics.totalDistance     = 0;

    std::vector<double> latencies;
    std::vector<double> waitTimes;
    double totalBusyResourceTime = 0.0;

    // Track when each resource becomes free again (in ticks)
    std::vector<int> resourceFreeAt(resources.size(), 0);

    int maxTick = 0;
    for (const auto& req : requests) {
        if (req.arrivalTick > maxTick) maxTick = req.arrivalTick;
    }
    maxTick += 20; // allow tail completion

    // Simulate tick by tick for accurate utilization
    // For efficiency: process requests in arrival order
    for (auto& req : requests) {
        int tick = req.arrivalTick;

        // Update resource availability based on tick
        for (size_t ri = 0; ri < resources.size(); ++ri) {
            if (!resources[ri].available && resourceFreeAt[ri] <= tick) {
                resources[ri].available   = true;
                resources[ri].currentLoad = std::max(0.0, resources[ri].currentLoad - 0.15);
            }
        }

        // Build resource list for allocator
        std::vector<ResourceInfo> resInfos;
        for (const auto& r : resources) {
            ResourceInfo ri;
            ri.id           = r.id;
            ri.locationNode = r.locationNode;
            ri.currentLoad  = r.currentLoad;
            ri.available    = r.available;
            resInfos.push_back(ri);
        }

        RequestInfo reqInfo { req.id, req.sourceNode, req.priority };
        auto result = allocator.allocate(reqInfo, resInfos, strategy);

        if (result.selectedResourceId == -1) {
            metrics.failedRequests++;
            continue;
        }

        // Update the resource state
        for (size_t ri = 0; ri < resources.size(); ++ri) {
            if (resources[ri].id == result.selectedResourceId) {
                resources[ri].available    = false;
                resources[ri].currentLoad  = std::min(1.0, resources[ri].currentLoad + 0.2);
                resources[ri].totalAssigned++;
                resources[ri].totalBusyTime += req.serviceDuration;
                resourceFreeAt[ri]          = tick + req.serviceDuration;
                totalBusyResourceTime      += req.serviceDuration;
                break;
            }
        }

        // Record metrics
        metrics.completedRequests++;
        metrics.totalDistance += result.routeDistance;
        latencies.push_back(static_cast<double>(result.latencyNs) / 1e6); // ns -> ms

        double waitMs = static_cast<double>(result.routeDistance) * 0.5; // estimate
        waitTimes.push_back(waitMs);

        SimAllocation alloc;
        alloc.requestId    = req.id;
        alloc.resourceId   = result.selectedResourceId;
        alloc.routeDistance= result.routeDistance;
        alloc.score        = result.score;
        alloc.latencyNs    = result.latencyNs;
        alloc.tick         = tick;
        alloc.strategy     = metrics.strategy;
        metrics.allocations.push_back(alloc);
    }

    // Compute derived metrics
    if (!latencies.empty()) {
        double sum = std::accumulate(latencies.begin(), latencies.end(), 0.0);
        metrics.averageLatencyMs = sum / latencies.size();
        metrics.p95LatencyMs     = percentile(latencies, 0.95);
    }
    if (!waitTimes.empty()) {
        double sum = std::accumulate(waitTimes.begin(), waitTimes.end(), 0.0);
        metrics.averageWaitTimeMs = sum / waitTimes.size();
    }

    double totalAvailableTime = static_cast<double>(numResources_) * maxTick;
    metrics.utilizationPercent = totalAvailableTime > 0
        ? (totalBusyResourceTime / totalAvailableTime) * 100.0
        : 0.0;

    metrics.throughput = maxTick > 0
        ? static_cast<double>(metrics.completedRequests) / maxTick
        : 0.0;

    return metrics;
}

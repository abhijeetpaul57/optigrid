#pragma once
#include "Graph.h"
#include "Allocator.h"
#include <vector>
#include <string>
#include <cstdint>

struct SimRequest {
    int id;
    int sourceNode;
    double priority;
    int arrivalTick;       // simulation tick when request arrives
    int serviceDuration;   // in ticks
};

struct SimResource {
    int id;
    int locationNode;
    bool available;
    double currentLoad;
    int totalAssigned;
    double totalBusyTime;
};

struct SimAllocation {
    int requestId;
    int resourceId;
    int routeDistance;
    double score;
    long long latencyNs;
    int tick;
    std::string strategy;
};

struct SimMetrics {
    std::string strategy;
    int totalRequests;
    int completedRequests;
    int failedRequests;
    double averageLatencyMs;
    double p95LatencyMs;
    double averageWaitTimeMs;
    double utilizationPercent;
    double throughput;       // completed / total ticks
    int totalDistance;
    std::vector<SimAllocation> allocations;
};

class Simulator {
public:
    Simulator(int rows, int cols, const std::vector<int>& edgeWeights,
              int numResources, int numRequests, uint64_t seed,
              const ScoringWeights& weights);

    SimMetrics run(Strategy strategy);

private:
    Graph graph_;
    int numResources_;
    int numRequests_;
    uint64_t seed_;
    ScoringWeights weights_;

    // Generate deterministic workload
    std::vector<SimRequest>  generateRequests(uint64_t seed);
    std::vector<SimResource> generateResources(uint64_t seed);

    double percentile(std::vector<double>& sorted, double p);
};

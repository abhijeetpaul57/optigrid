#pragma once
#include "Graph.h"
#include <string>
#include <vector>

enum class Strategy { FIFO, NEAREST, OPTIGRID };

struct ResourceInfo {
    int id;
    int locationNode;
    double currentLoad;   // 0.0 to 1.0
    bool available;       // true = AVAILABLE
};

struct RequestInfo {
    int id;
    int sourceNode;
    double priority;  // 0.0 (low) to 1.0 (high)
};

struct ScoringWeights {
    double wD = 0.4;  // distance weight
    double wW = 0.3;  // workload weight
    double wP = 0.2;  // priority weight (benefit: higher priority -> lower penalty)
    double wA = 0.1;  // availability weight (penalty for marginal availability)
};

struct AllocationResult {
    int selectedResourceId = -1;  // -1 = no resource available
    int routeDistance      = -1;
    double score           = -1.0;
    long long latencyNs    = 0;
};

class Allocator {
public:
    Allocator(const Graph& graph, const ScoringWeights& weights);

    // Allocate using the given strategy. Returns AllocationResult.
    AllocationResult allocate(
        const RequestInfo& req,
        const std::vector<ResourceInfo>& resources,
        Strategy strategy
    );

private:
    const Graph& graph_;
    ScoringWeights weights_;

    AllocationResult fifo(const RequestInfo& req, const std::vector<ResourceInfo>& resources);
    AllocationResult nearest(const RequestInfo& req, const std::vector<ResourceInfo>& resources);
    AllocationResult optigrid(const RequestInfo& req, const std::vector<ResourceInfo>& resources);

    double computeScore(
        int distance, int maxDist,
        double load,
        double priority,
        bool available
    );
};

#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <stdexcept>
#include <climits>

// Minimal JSON parser / writer (no external deps)
// We use a simple hand-rolled approach for the protocol
#include "Graph.h"
#include "Dijkstra.h"
#include "Allocator.h"
#include "Simulator.h"

// ---- Tiny JSON helpers ----
static std::string jsonStr(const std::string& s) {
    return "\"" + s + "\"";
}
static std::string jsonField(const std::string& k, const std::string& v) {
    return "\"" + k + "\":" + v;
}
static std::string jsonFieldStr(const std::string& k, const std::string& v) {
    return "\"" + k + "\":\"" + v + "\"";
}
static std::string jsonFieldNum(const std::string& k, double v) {
    std::ostringstream oss;
    oss << "\"" << k << "\":" << v;
    return oss.str();
}
static std::string jsonFieldInt(const std::string& k, long long v) {
    return "\"" + k + "\":" + std::to_string(v);
}

// Very simple key extractor from flat JSON
static std::string extractStr(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":\"";
    auto pos = json.find(search);
    if (pos == std::string::npos) return "";
    pos += search.size();
    auto end = json.find("\"", pos);
    return json.substr(pos, end - pos);
}
static double extractNum(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":";
    auto pos = json.find(search);
    if (pos == std::string::npos) return 0.0;
    pos += search.size();
    // skip any quote (in case value is quoted number)
    if (json[pos] == '"') pos++;
    return std::stod(json.substr(pos));
}
static int extractInt(const std::string& json, const std::string& key) {
    return static_cast<int>(extractNum(json, key));
}

// Extract simple int array like [1,2,3]
static std::vector<int> extractIntArray(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":[";
    auto pos = json.find(search);
    if (pos == std::string::npos) return {};
    pos += search.size();
    auto end = json.find("]", pos);
    std::string inner = json.substr(pos, end - pos);
    std::vector<int> result;
    std::istringstream ss(inner);
    std::string token;
    while (std::getline(ss, token, ',')) {
        if (!token.empty()) result.push_back(std::stoi(token));
    }
    return result;
}

// ---- Handle "allocate" command ----
static std::string handleAllocate(const std::string& line) {
    // Parse fields
    std::string strategy = extractStr(line, "strategy");
    int sourceNode = extractInt(line, "sourceNode");
    int reqId      = extractInt(line, "requestId");
    double priority= extractNum(line, "priority");
    int rows       = extractInt(line, "rows");
    int cols       = extractInt(line, "cols");
    double wD      = extractNum(line, "wD");
    double wW      = extractNum(line, "wW");
    double wP      = extractNum(line, "wP");
    double wA      = extractNum(line, "wA");

    auto edgeWeights = extractIntArray(line, "edgeWeights");

    // Build graph
    Graph g = Graph::buildGrid(rows, cols, edgeWeights);

    ScoringWeights sw;
    if (wD > 0) sw.wD = wD;
    if (wW > 0) sw.wW = wW;
    if (wP > 0) sw.wP = wP;
    if (wA > 0) sw.wA = wA;

    Allocator alloc(g, sw);

    // Parse resources array: look for simple repeated pattern
    std::vector<ResourceInfo> resources;
    {
        std::string rsearch = "\"resources\":[";
        auto rpos = line.find(rsearch);
        if (rpos != std::string::npos) {
            rpos += rsearch.size();
            auto rend = line.find("]", rpos);
            std::string rinner = line.substr(rpos, rend - rpos);
            // Split by "},{" 
            size_t start = 0;
            while (true) {
                auto brace = rinner.find("{", start);
                if (brace == std::string::npos) break;
                auto ebrace = rinner.find("}", brace);
                std::string obj = rinner.substr(brace, ebrace - brace + 1);
                ResourceInfo ri;
                ri.id           = extractInt(obj, "id");
                ri.locationNode = extractInt(obj, "locationNode");
                ri.currentLoad  = extractNum(obj, "currentLoad");
                ri.available    = (extractStr(obj, "available") == "true") ||
                                  (extractInt(obj, "available") == 1);
                resources.push_back(ri);
                start = ebrace + 1;
            }
        }
    }

    Strategy strat = Strategy::OPTIGRID;
    if (strategy == "FIFO")    strat = Strategy::FIFO;
    if (strategy == "NEAREST") strat = Strategy::NEAREST;

    RequestInfo req { reqId, sourceNode, priority };
    auto result = alloc.allocate(req, resources, strat);

    std::ostringstream out;
    out << "{";
    out << jsonFieldStr("type", "allocationResult") << ",";
    out << jsonFieldInt("selectedResourceId", result.selectedResourceId) << ",";
    out << jsonFieldInt("routeDistance", result.routeDistance) << ",";
    out << jsonFieldNum("score", result.score) << ",";
    out << jsonFieldInt("latencyNs", result.latencyNs);
    out << "}";
    return out.str();
}

// ---- Handle "benchmark" command ----
static std::string handleBenchmark(const std::string& line) {
    int rows        = extractInt(line, "rows");
    int cols        = extractInt(line, "cols");
    int numResources= extractInt(line, "numResources");
    int numRequests = extractInt(line, "numRequests");
    uint64_t seed   = static_cast<uint64_t>(extractInt(line, "seed"));
    double wD       = extractNum(line, "wD");
    double wW       = extractNum(line, "wW");
    double wP       = extractNum(line, "wP");
    double wA       = extractNum(line, "wA");
    auto edgeWeights= extractIntArray(line, "edgeWeights");

    ScoringWeights sw;
    if (wD > 0) sw.wD = wD;
    if (wW > 0) sw.wW = wW;
    if (wP > 0) sw.wP = wP;
    if (wA > 0) sw.wA = wA;

    Simulator sim(rows, cols, edgeWeights, numResources, numRequests, seed, sw);

    auto fifoM    = sim.run(Strategy::FIFO);
    auto nearestM = sim.run(Strategy::NEAREST);
    auto optiM    = sim.run(Strategy::OPTIGRID);

    auto metricsJson = [](const SimMetrics& m, const std::string& name) -> std::string {
        std::ostringstream o;
        o << "\"" << name << "\":{";
        o << jsonFieldStr("strategy", m.strategy) << ",";
        o << jsonFieldInt("completedRequests", m.completedRequests) << ",";
        o << jsonFieldInt("failedRequests", m.failedRequests) << ",";
        o << jsonFieldNum("averageLatencyMs", m.averageLatencyMs) << ",";
        o << jsonFieldNum("p95LatencyMs", m.p95LatencyMs) << ",";
        o << jsonFieldNum("averageWaitTimeMs", m.averageWaitTimeMs) << ",";
        o << jsonFieldNum("utilizationPercent", m.utilizationPercent) << ",";
        o << jsonFieldNum("throughput", m.throughput) << ",";
        o << jsonFieldInt("totalDistance", m.totalDistance);
        o << "}";
        return o.str();
    };

    std::ostringstream out;
    out << "{";
    out << jsonFieldStr("type", "benchmarkResult") << ",";
    out << metricsJson(fifoM, "fifo") << ",";
    out << metricsJson(nearestM, "nearest") << ",";
    out << metricsJson(optiM, "optigrid");
    out << "}";
    return out.str();
}

// ---- Handle "dijkstra" command ----
static std::string handleDijkstra(const std::string& line) {
    int rows   = extractInt(line, "rows");
    int cols   = extractInt(line, "cols");
    int source = extractInt(line, "source");
    auto edgeWeights = extractIntArray(line, "edgeWeights");

    Graph g = Graph::buildGrid(rows, cols, edgeWeights);
    auto dists = dijkstra(g, source);

    std::ostringstream out;
    out << "{";
    out << jsonFieldStr("type", "dijkstraResult") << ",";
    out << "\"distances\":[";
    for (size_t i = 0; i < dists.size(); ++i) {
        if (i > 0) out << ",";
        if (dists[i] == INT_MAX) out << -1;
        else out << dists[i];
    }
    out << "]}";
    return out.str();
}

// ---- Main loop ----
int main() {
    // Disable sync for faster I/O
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;

        try {
            std::string type = extractStr(line, "type");
            std::string response;

            if (type == "allocate") {
                response = handleAllocate(line);
            } else if (type == "benchmark") {
                response = handleBenchmark(line);
            } else if (type == "dijkstra") {
                response = handleDijkstra(line);
            } else if (type == "ping") {
                response = "{\"type\":\"pong\"}";
            } else {
                response = "{\"type\":\"error\",\"message\":\"unknown command\"}";
            }

            std::cout << response << "\n";
            std::cout.flush();

        } catch (const std::exception& e) {
            std::cout << "{\"type\":\"error\",\"message\":\"" << e.what() << "\"}\n";
            std::cout.flush();
        }
    }

    return 0;
}

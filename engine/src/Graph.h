#pragma once
#include <vector>
#include <utility>

// Each edge: {neighborNode, weight}
using Edge = std::pair<int, int>;
using AdjList = std::vector<std::vector<Edge>>;

class Graph {
public:
    int numNodes;
    AdjList adj;

    explicit Graph(int n);

    // Add undirected weighted edge
    void addEdge(int u, int v, int weight);

    // Build a rows x cols grid graph; weights[i] = weight for edge i (row-major)
    // If weights is empty, all edges get weight 1
    static Graph buildGrid(int rows, int cols, const std::vector<int>& weights = {});
};

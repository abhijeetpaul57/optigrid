#include "Graph.h"
#include <stdexcept>

Graph::Graph(int n) : numNodes(n), adj(n) {}

void Graph::addEdge(int u, int v, int weight) {
    if (u < 0 || u >= numNodes || v < 0 || v >= numNodes)
        throw std::out_of_range("Node index out of range");
    adj[u].push_back({v, weight});
    adj[v].push_back({u, weight});
}

Graph Graph::buildGrid(int rows, int cols, const std::vector<int>& weights) {
    int n = rows * cols;
    Graph g(n);
    int edgeIdx = 0;

    auto w = [&]() -> int {
        if (weights.empty() || edgeIdx >= (int)weights.size()) return 1;
        return weights[edgeIdx++];
    };

    // Horizontal edges: node(r,c) -- node(r, c+1)
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols - 1; ++c) {
            int u = r * cols + c;
            int v = r * cols + (c + 1);
            g.addEdge(u, v, w());
        }
    }
    // Vertical edges: node(r,c) -- node(r+1, c)
    for (int r = 0; r < rows - 1; ++r) {
        for (int c = 0; c < cols; ++c) {
            int u = r * cols + c;
            int v = (r + 1) * cols + c;
            g.addEdge(u, v, w());
        }
    }
    return g;
}

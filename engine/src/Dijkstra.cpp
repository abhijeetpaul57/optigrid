#include "Dijkstra.h"
#include <queue>
#include <climits>
#include <utility>

std::vector<int> dijkstra(const Graph& g, int source) {
    std::vector<int> dist(g.numNodes, INT_MAX);
    // Min-heap: {distance, node}
    std::priority_queue<
        std::pair<int,int>,
        std::vector<std::pair<int,int>>,
        std::greater<std::pair<int,int>>
    > pq;

    dist[source] = 0;
    pq.push(std::make_pair(0, source));

    while (!pq.empty()) {
        int d = pq.top().first;
        int u = pq.top().second;
        pq.pop();

        if (d > dist[u]) continue; // stale entry

        for (int i = 0; i < (int)g.adj[u].size(); ++i) {
            int v = g.adj[u][i].first;
            int w = g.adj[u][i].second;
            if (dist[u] != INT_MAX && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push(std::make_pair(dist[v], v));
            }
        }
    }
    return dist;
}

int shortestDistance(const Graph& g, int source, int target) {
    auto dist = dijkstra(g, source);
    return dist[target];
}

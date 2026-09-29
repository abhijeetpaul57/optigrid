#pragma once
#include "Graph.h"
#include <vector>

// Returns shortest distances from 'source' to every node.
// dist[i] = INT_MAX means node i is unreachable.
std::vector<int> dijkstra(const Graph& g, int source);

// Returns the shortest-path distance from 'source' to 'target', or INT_MAX if unreachable.
int shortestDistance(const Graph& g, int source, int target);

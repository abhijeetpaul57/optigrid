// ============================================================
// OptiGrid — Central Mock Data File
// Replace service calls here when connecting to real backend
// ============================================================

export const mockScenario = {
  id: 'scenario-001',
  name: 'Peak Demand',
  gridRows: 10,
  gridCols: 10,
  totalRequests: 500,
  strategy: 'optigrid',
  weights: { distance: 0.4, workload: 0.4, priority: 0.2 },
  arrivalRate: 5,
  serviceDuration: { min: 2000, max: 8000 },
  priorityDistribution: { HIGH: 20, MEDIUM: 50, LOW: 30 },
  seed: 42,
  simulationDuration: 300,
};

export const mockResources = [
  { id: 'R1', location: 12, status: 'AVAILABLE', currentLoad: 0, assignments: 54, utilization: 87, lastUpdate: Date.now() },
  { id: 'R2', location: 35, status: 'AVAILABLE', currentLoad: 0, assignments: 41, utilization: 72, lastUpdate: Date.now() },
  { id: 'R3', location: 67, status: 'AVAILABLE', currentLoad: 0, assignments: 48, utilization: 81, lastUpdate: Date.now() },
  { id: 'R4', location: 8,  status: 'AVAILABLE', currentLoad: 0, assignments: 36, utilization: 65, lastUpdate: Date.now() },
  { id: 'R5', location: 91, status: 'AVAILABLE', currentLoad: 0, assignments: 29, utilization: 58, lastUpdate: Date.now() },
];

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
export const mockRequests = Array.from({ length: 30 }, (_, i) => ({
  id: `RQ-${String(i + 100).padStart(3, '0')}`,
  location: (i * 7 + 13) % 100,
  priority: PRIORITIES[i % 3],
  status: 'PENDING',
  arrivalTime: Date.now() - (30 - i) * 2000,
  assignedResource: null,
  waitingTime: null,
  routeDistance: null,
  allocationScore: null,
  completionTime: null,
}));

export const mockAllocations = [
  {
    id: 'alloc-001',
    requestId: 'RQ-124',
    resourceId: 'R2',
    requestLocation: 50,
    resourceLocation: 35,
    requestPriority: 'HIGH',
    routeDistance: 4,
    resourceWorkload: 30,
    finalScore: 4.6,
    latency: 12,
    status: 'ASSIGNED',
    timestamp: Date.now() - 60000,
    candidates: [
      { resourceId: 'R1', distance: 2, workload: 90, score: 9.2, selected: false },
      { resourceId: 'R2', distance: 4, workload: 30, score: 4.6, selected: true  },
      { resourceId: 'R3', distance: 3, workload: 70, score: 7.3, selected: false },
    ],
    explanation: 'R2 was selected because its lower workload (30%) compensated for the additional travel distance, yielding the best overall allocation score.',
  },
  {
    id: 'alloc-002',
    requestId: 'RQ-123',
    resourceId: 'R3',
    requestLocation: 43,
    resourceLocation: 67,
    requestPriority: 'MEDIUM',
    routeDistance: 3,
    resourceWorkload: 55,
    finalScore: 5.2,
    latency: 10,
    status: 'COMPLETED',
    timestamp: Date.now() - 120000,
    candidates: [
      { resourceId: 'R3', distance: 3, workload: 55, score: 5.2, selected: true  },
      { resourceId: 'R4', distance: 5, workload: 40, score: 6.0, selected: false },
      { resourceId: 'R5', distance: 7, workload: 20, score: 5.8, selected: false },
    ],
    explanation: 'R3 achieved the best score combining moderate distance and workload.',
  },
  {
    id: 'alloc-003',
    requestId: 'RQ-122',
    resourceId: 'R1',
    requestLocation: 18,
    resourceLocation: 12,
    requestPriority: 'LOW',
    routeDistance: 2,
    resourceWorkload: 45,
    finalScore: 3.8,
    latency: 8,
    status: 'COMPLETED',
    timestamp: Date.now() - 180000,
    candidates: [
      { resourceId: 'R1', distance: 2, workload: 45, score: 3.8, selected: true  },
      { resourceId: 'R2', distance: 6, workload: 25, score: 5.2, selected: false },
    ],
    explanation: 'R1 was nearest and had acceptable workload.',
  },
];

export const mockMetrics = {
  requestsProcessed: 0,
  totalRequests: 500,
  activeResources: 0,
  totalResources: 5,
  avgWaitingTime: 0,
  resourceUtilization: 0,
  allocationLatency: 0,
  throughput: 0,
  trend: {
    requestsProcessed: 0,
    avgWaitingTime: 0,
    resourceUtilization: 0,
    allocationLatency: 0,
    throughput: 0,
  },
};

export const mockBenchmark = {
  id: 'bench-001',
  scenarioId: 'scenario-001',
  note: 'Mock values — will be replaced by actual C++ engine results.',
  results: {
    fifo:     { avgLatency: 31, avgWaitTime: 8.2, utilization: 56, throughput: 28, completed: 420 },
    nearest:  { avgLatency: 22, avgWaitTime: 6.4, utilization: 69, throughput: 35, completed: 463 },
    optigrid: { avgLatency: 12, avgWaitTime: 5.1, utilization: 84, throughput: 42, completed: 496 },
  },
  improvements: {
    latency:     { value: 61, unit: '%',  label: 'lower',  direction: 'down' },
    waitTime:    { value: 38, unit: '%',  label: 'lower',  direction: 'down' },
    utilization: { value: 28, unit: 'pp', label: 'higher', direction: 'up'  },
    throughput:  { value: 50, unit: '%',  label: 'higher', direction: 'up'  },
  },
  history: Array.from({ length: 10 }, (_, i) => ({
    tick: i + 1,
    fifo:     { throughput: 24 + i * 0.4 },
    nearest:  { throughput: 31 + i * 0.4 },
    optigrid: { throughput: 38 + i * 0.4 },
  })),
};

export function buildGridNodes(rows = 10, cols = 10) {
  return Array.from({ length: rows * cols }, (_, i) => ({
    id: i, row: Math.floor(i / cols), col: i % cols,
  }));
}

export function getMockRoute(fromNode, toNode, cols = 10) {
  const path = [];
  let row = Math.floor(fromNode / cols);
  let col = fromNode % cols;
  const toRow = Math.floor(toNode / cols);
  const toCol = toNode % cols;
  path.push(row * cols + col);
  while (col !== toCol) { col += col < toCol ? 1 : -1; path.push(row * cols + col); }
  while (row !== toRow) { row += row < toRow ? 1 : -1; path.push(row * cols + col); }
  return path;
}

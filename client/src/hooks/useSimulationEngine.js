// ============================================================
// OptiGrid — Core Simulation Hook
// Drives the mock simulation tick engine
// ============================================================

import { useRef, useCallback } from 'react';
import { getMockRoute } from '../data/mockData';

const PRIORITY_WEIGHT = { HIGH: 0.2, MEDIUM: 0.1, LOW: 0.05 };
const COLS = 10;

function manhattanDistance(a, b) {
  return Math.abs(Math.floor(a / COLS) - Math.floor(b / COLS))
       + Math.abs((a % COLS) - (b % COLS));
}

function computeScore(distance, workload, priority, weights) {
  return (
    weights.distance * distance +
    weights.workload * (workload / 100) * 10 -
    (weights.priority || 0.2) * (priority === 'HIGH' ? 3 : priority === 'MEDIUM' ? 2 : 1)
  ).toFixed(2);
}

export function useSimulationEngine({ onAllocation, onResourceUpdate, onMetricUpdate, onRequestUpdate }) {
  const intervalRef = useRef(null);

  const runTick = useCallback((stateRef) => {
    const state = stateRef.current;
    if (!state) return;
    const { requests, resources, weights, strategy } = state;
    if (!requests || !resources) return;

    const pending = requests.find(r => r.status === 'PENDING');
    if (!pending) return;

    const available = resources.filter(r => r.status === 'AVAILABLE');
    if (available.length === 0) return;

    const start = performance.now();

    // Build candidates
    const candidates = available.map(res => {
      const distance = manhattanDistance(pending.location, res.location);
      const score = parseFloat(computeScore(distance, res.currentLoad, pending.priority, weights || { distance: 0.4, workload: 0.4, priority: 0.2 }));
      return { resourceId: res.id, distance, workload: res.currentLoad, score, selected: false };
    });

    // Select best
    let selected;
    if (strategy === 'fifo') {
      selected = candidates[0];
    } else if (strategy === 'nearest') {
      selected = candidates.reduce((a, b) => a.distance < b.distance ? a : b);
    } else {
      selected = candidates.reduce((a, b) => a.score < b.score ? a : b);
    }
    selected = { ...selected, selected: true };

    const latency = Math.max(1, Math.round(performance.now() - start) + Math.floor(Math.random() * 15));
    const selectedRes = resources.find(r => r.id === selected.resourceId);
    const route = getMockRoute(pending.location, selectedRes.location, COLS);

    const strat = strategy || 'optigrid';
    const explanation = strat === 'optigrid'
      ? `${selected.resourceId} was selected because its combination of distance (${selected.distance}) and workload (${selected.workload}%) achieved the best OptiGrid score of ${selected.score}.`
      : `${selected.resourceId} was selected by ${strat.toUpperCase()} strategy.`;

    const alloc = {
      id: `alloc-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      requestId: pending.id,
      resourceId: selected.resourceId,
      requestLocation: pending.location,
      resourceLocation: selectedRes.location,
      requestPriority: pending.priority,
      routeDistance: selected.distance,
      resourceWorkload: selected.workload,
      finalScore: selected.score,
      latency,
      status: 'ASSIGNED',
      timestamp: Date.now(),
      candidates: candidates.map(c => ({ ...c, selected: c.resourceId === selected.resourceId })),
      route,
      explanation,
    };

    onAllocation(alloc, pending.id, selected.resourceId);
  }, [onAllocation]);

  const start = useCallback((stateRef, speedMs) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => runTick(stateRef), speedMs);
  }, [runTick]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  return { start, stop };
}

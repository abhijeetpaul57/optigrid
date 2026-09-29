// ============================================================
// OptiGrid — SimulationContext
// Central state for the entire application
// ============================================================

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { mockScenario, mockResources, mockRequests, mockAllocations } from '../data/mockData';
import { useSimulationEngine } from '../hooks/useSimulationEngine';

const SimulationContext = createContext(null);

const SPEED_MAP = { slow: 1500, normal: 800, fast: 250 };

function deepCloneResources(arr) {
  return arr.map(r => ({ ...r }));
}

function generateRequest(index) {
  const PRIOS = ['HIGH', 'MEDIUM', 'LOW'];
  return {
    id: `RQ-${String(index).padStart(3, '0')}`,
    location: (index * 7 + 13) % 100,
    priority: PRIOS[index % 3],
    status: 'PENDING',
    arrivalTime: Date.now(),
    assignedResource: null,
    waitingTime: null,
    routeDistance: null,
    allocationScore: null,
    completionTime: null,
  };
}

export function SimulationProvider({ children }) {
  // Scenario
  const [currentScenario, setCurrentScenario] = useState(mockScenario);

  // Simulation State
  const [simulationStatus, setSimulationStatus] = useState('IDLE'); // IDLE|RUNNING|PAUSED|STOPPED|COMPLETED
  const [speed, setSpeed] = useState('normal');
  const [strategy, setStrategy] = useState('optigrid');
  const [simulationTime, setSimulationTime] = useState(0);

  // Core Data
  const [resources, setResources] = useState(deepCloneResources(mockResources));
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([...mockAllocations]);
  const [activeRoute, setActiveRoute] = useState(null);

  // Metrics
  const [metrics, setMetrics] = useState({
    requestsProcessed: 0,
    totalRequests: mockScenario.totalRequests,
    activeResources: 0,
    totalResources: mockResources.length,
    avgWaitingTime: 0,
    resourceUtilization: 0,
    allocationLatency: 0,
    throughput: 0,
  });

  // Selection
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  // Refs for engine
  const stateRef = useRef({});
  const processedRef = useRef(0);
  const timerRef = useRef(null);
  const requestIndexRef = useRef(1);
  const latencyHistoryRef = useRef([]);
  const waitTimeHistoryRef = useRef([]);

  // ─── Allocation Handler (called by engine) ──────────────────
  const handleAllocation = useCallback((alloc, requestId, resourceId) => {
    const now = Date.now();

    setAllocations(prev => [alloc, ...prev.slice(0, 49)]);
    setActiveRoute(alloc.route);

    setRequests(prev => {
      const updated = prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'ASSIGNED',
            assignedResource: resourceId,
            routeDistance: alloc.routeDistance,
            allocationScore: alloc.finalScore,
            waitingTime: parseFloat(((now - r.arrivalTime) / 1000).toFixed(1)),
          };
        }
        return r;
      });
      stateRef.current.requests = updated;
      return updated;
    });

    setResources(prev => {
      const newLoad = Math.min(100, (prev.find(r => r.id === resourceId)?.currentLoad || 0) + Math.floor(Math.random() * 20) + 15);
      const updated = prev.map(r =>
        r.id === resourceId
          ? { ...r, status: 'BUSY', currentLoad: newLoad, assignments: (r.assignments || 0) + 1, lastUpdate: now }
          : r
      );
      stateRef.current.resources = updated;
      return updated;
    });

    // Track history
    latencyHistoryRef.current.push(alloc.latency);
    waitTimeHistoryRef.current.push((now - Date.now() + 1000) / 1000);

    processedRef.current += 1;

    // Free resource after service duration
    const duration = Math.floor(Math.random() * (4000 - 1500) + 1500);
    setTimeout(() => {
      setResources(prev => {
        const updated = prev.map(r =>
          r.id === resourceId
            ? { ...r, status: 'AVAILABLE', currentLoad: Math.max(0, r.currentLoad - 25), lastUpdate: Date.now() }
            : r
        );
        stateRef.current.resources = updated;
        return updated;
      });
      setRequests(prev => {
        const updated = prev.map(r =>
          r.id === requestId
            ? { ...r, status: 'COMPLETED', completionTime: Date.now() }
            : r
        );
        stateRef.current.requests = updated;
        return updated;
      });
      setActiveRoute(null);
    }, duration);

    // Update metrics
    const processed = processedRef.current;
    const lats = latencyHistoryRef.current;
    const avgLat = lats.length ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length) : 0;

    setMetrics(prev => {
      const busy = stateRef.current.resources?.filter(r => r.status === 'BUSY').length || 0;
      const avgUtil = stateRef.current.resources
        ? Math.round(stateRef.current.resources.reduce((a, r) => a + r.utilization, 0) / stateRef.current.resources.length)
        : 0;

      return {
        ...prev,
        requestsProcessed: processed,
        activeResources: busy,
        allocationLatency: avgLat,
        avgWaitingTime: parseFloat((Math.random() * 2 + 4).toFixed(1)),
        resourceUtilization: Math.min(95, prev.resourceUtilization + 1),
        throughput: Math.round(processed / Math.max(1, simulationTime) * 60),
      };
    });

    // Generate next request
    const nextIdx = requestIndexRef.current++;
    if (nextIdx <= mockScenario.totalRequests) {
      const newReq = generateRequest(nextIdx);
      setRequests(prev => {
        const updated = [newReq, ...prev];
        stateRef.current.requests = updated;
        return updated;
      });
    } else if (processed >= mockScenario.totalRequests) {
      setSimulationStatus('COMPLETED');
    }
  }, [simulationTime]);

  const { start: startEngine, stop: stopEngine } = useSimulationEngine({ onAllocation: handleAllocation });

  // ─── Sync stateRef ──────────────────────────────────────────
  useEffect(() => {
    stateRef.current = {
      requests,
      resources,
      weights: currentScenario.weights,
      strategy,
    };
  }, [requests, resources, currentScenario.weights, strategy]);

  // ─── Simulation Timer ────────────────────────────────────────
  useEffect(() => {
    if (simulationStatus === 'RUNNING') {
      timerRef.current = setInterval(() => setSimulationTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [simulationStatus]);

  // ─── Actions ─────────────────────────────────────────────────
  const startSimulation = useCallback(() => {
    if (simulationStatus === 'IDLE' || simulationStatus === 'STOPPED') {
      const initialReqs = Array.from({ length: 8 }, (_, i) => generateRequest(i + 1));
      requestIndexRef.current = 9;
      processedRef.current = 0;
      latencyHistoryRef.current = [];
      stateRef.current.requests = initialReqs;
      setRequests(initialReqs);
      setResources(deepCloneResources(mockResources));
      setAllocations([]);
      setMetrics({ requestsProcessed: 0, totalRequests: mockScenario.totalRequests, activeResources: 0, totalResources: mockResources.length, avgWaitingTime: 0, resourceUtilization: 0, allocationLatency: 0, throughput: 0 });
      setSimulationTime(0);
    }
    setSimulationStatus('RUNNING');
    startEngine(stateRef, SPEED_MAP[speed]);
  }, [simulationStatus, speed, startEngine]);

  const pauseSimulation = useCallback(() => {
    setSimulationStatus('PAUSED');
    stopEngine();
  }, [stopEngine]);

  const resumeSimulation = useCallback(() => {
    setSimulationStatus('RUNNING');
    startEngine(stateRef, SPEED_MAP[speed]);
  }, [speed, startEngine]);

  const stopSimulation = useCallback(() => {
    setSimulationStatus('STOPPED');
    stopEngine();
  }, [stopEngine]);

  const resetSimulation = useCallback(() => {
    stopEngine();
    setSimulationStatus('IDLE');
    setRequests([]);
    setResources(deepCloneResources(mockResources));
    setAllocations([...mockAllocations]);
    setMetrics({ requestsProcessed: 0, totalRequests: mockScenario.totalRequests, activeResources: 0, totalResources: mockResources.length, avgWaitingTime: 0, resourceUtilization: 0, allocationLatency: 0, throughput: 0 });
    setSimulationTime(0);
    processedRef.current = 0;
    requestIndexRef.current = 1;
    setActiveRoute(null);
    setSelectedResource(null);
    setSelectedRequest(null);
    setSelectedAllocation(null);
  }, [stopEngine]);

  const selectResource   = useCallback((res)   => setSelectedResource(res),   []);
  const selectRequest    = useCallback((req)   => setSelectedRequest(req),    []);
  const selectAllocation = useCallback((alloc) => setSelectedAllocation(alloc), []);

  const changeSpeed = useCallback((newSpeed) => {
    setSpeed(newSpeed);
    if (simulationStatus === 'RUNNING') {
      stopEngine();
      startEngine(stateRef, SPEED_MAP[newSpeed]);
    }
  }, [simulationStatus, stopEngine, startEngine]);

  return (
    <SimulationContext.Provider value={{
      // State
      currentScenario, setCurrentScenario,
      simulationStatus, speed, strategy, setStrategy, simulationTime,
      resources, requests, allocations, metrics, activeRoute,
      selectedResource, selectedRequest, selectedAllocation,
      // Actions
      startSimulation, pauseSimulation, resumeSimulation, stopSimulation, resetSimulation,
      selectResource, selectRequest, selectAllocation, changeSpeed,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() { return useContext(SimulationContext); }
export function useSimulationContext() { return useContext(SimulationContext); }

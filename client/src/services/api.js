// ============================================================
// OptiGrid — API Service Layer
// Mock implementation — replace with Axios calls when backend is ready
// ============================================================

import {
  mockScenario, mockResources, mockRequests,
  mockAllocations, mockMetrics, mockBenchmark
} from '../data/mockData';

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

// ─── Scenarios ───────────────────────────────────────────────
export const getScenarios = async () => { await delay(); return [mockScenario]; };
export const getScenario  = async (id) => { await delay(); return mockScenario; };
export const createScenario = async (data) => { await delay(300); return { ...mockScenario, ...data, id: `scenario-${Date.now()}` }; };
export const updateScenario = async (id, data) => { await delay(300); return { ...mockScenario, ...data }; };

// ─── Resources ───────────────────────────────────────────────
export const getResources  = async (scenarioId) => { await delay(); return [...mockResources]; };
export const updateResource = async (id, data) => { await delay(); return data; };

// ─── Requests ────────────────────────────────────────────────
export const getRequests = async (scenarioId) => { await delay(); return [...mockRequests]; };
export const getRequest  = async (id) => { await delay(); return mockRequests.find(r => r.id === id) || null; };

// ─── Simulations ─────────────────────────────────────────────
export const startSimulation  = async (data) => { await delay(300); return { id: `sim-${Date.now()}`, status: 'RUNNING', ...data }; };
export const pauseSimulation  = async (id)   => { await delay(200); return { id, status: 'PAUSED' }; };
export const resumeSimulation = async (id)   => { await delay(200); return { id, status: 'RUNNING' }; };
export const stopSimulation   = async (id)   => { await delay(200); return { id, status: 'STOPPED' }; };
export const getSimulation    = async (id)   => { await delay();    return { id, status: 'RUNNING' }; };

// ─── Benchmarks ──────────────────────────────────────────────
export const runBenchmark = async (data) => { await delay(800); return { ...mockBenchmark, runAt: Date.now() }; };
export const getBenchmark = async (id)   => { await delay(); return mockBenchmark; };

// ─── Metrics ─────────────────────────────────────────────────
export const getMetrics = async (scenarioId) => { await delay(); return { ...mockMetrics }; };

import React from 'react';
import { Play, Pause, Square, RotateCcw, SkipForward } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';

function formatSecs(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

const PRIORITY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#6b7280' };

export default function Simulation() {
  const {
    simulationStatus, strategy, setStrategy, speed, changeSpeed,
    currentScenario, metrics, simulationTime, requests, resources,
    startSimulation, pauseSimulation, resumeSimulation, stopSimulation, resetSimulation,
  } = useSimulation();

  const isRunning  = simulationStatus === 'RUNNING';
  const isPaused   = simulationStatus === 'PAUSED';
  const isIdle     = simulationStatus === 'IDLE' || simulationStatus === 'STOPPED';
  const isComplete = simulationStatus === 'COMPLETED';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Simulation</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Control and observe the allocation engine in real-time.</p>
        </div>
        <StatusBadge status={simulationStatus} />
      </div>

      {/* Controls */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'start' }}>
          {/* Scenario Info */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Scenario</div>
            <div style={{ fontWeight: 600, color: '#fff' }}>{currentScenario.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {currentScenario.gridRows}×{currentScenario.gridCols} grid · {currentScenario.totalRequests} requests · {resources.length} resources
            </div>
          </div>

          {/* Strategy */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Strategy</div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['fifo', 'nearest', 'optigrid'].map(s => (
                <button key={s} onClick={() => !isRunning && setStrategy(s)}
                  disabled={isRunning}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600,
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    border: strategy === s ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    background: strategy === s ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    color: strategy === s ? 'var(--primary-color)' : 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    transition: 'all 0.2s',
                  }}>
                  {s === 'optigrid' ? 'OptiGrid' : s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Speed</div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['slow', 'normal', 'fast'].map(s => (
                <button key={s} onClick={() => changeSpeed(s)}
                  style={{
                    padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500,
                    cursor: 'pointer',
                    border: speed === s ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    background: speed === s ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                    color: speed === s ? 'var(--success-color)' : 'var(--text-secondary)',
                    textTransform: 'capitalize',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Controls</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isIdle && (
                <button className="btn btn-primary" onClick={startSimulation} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <Play size={15} /> Start
                </button>
              )}
              {isRunning && (
                <button className="btn btn-outline" onClick={pauseSimulation} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <Pause size={15} /> Pause
                </button>
              )}
              {isPaused && (
                <button className="btn btn-primary" onClick={resumeSimulation} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <SkipForward size={15} /> Resume
                </button>
              )}
              {(isRunning || isPaused) && (
                <button className="btn btn-outline" onClick={stopSimulation}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: 'rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                  <Square size={15} /> Stop
                </button>
              )}
              <button className="btn btn-outline" onClick={resetSimulation} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <RotateCcw size={15} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Progress */}
        {!isIdle && (
          <div>
            <ProgressBar value={metrics.requestsProcessed} max={metrics.totalRequests} showLabel height={10} color="var(--primary-color)" />
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Elapsed: {formatSecs(simulationTime)} · Throughput: {metrics.throughput} req/min
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Live Request Queue */}
        <div className="card" style={{ padding: '1rem', maxHeight: 420, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem', flexShrink: 0 }}>
            Live Request Queue
          </h2>
          {requests.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No active requests
            </div>
          ) : (
            <div style={{ overflow: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Request', 'Node', 'Priority', 'Status', 'Resource'].map(h => (
                      <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 30).map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', animation: 'fade-in 0.3s ease' }}>
                      <td style={{ padding: '0.4rem 0.6rem', color: 'var(--primary-color)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{req.id}</td>
                      <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}>{req.location}</td>
                      <td style={{ padding: '0.4rem 0.6rem' }}>
                        <span style={{ color: PRIORITY_COLOR[req.priority], fontSize: '0.72rem', fontWeight: 600 }}>{req.priority}</span>
                      </td>
                      <td style={{ padding: '0.4rem 0.6rem' }}><StatusBadge status={req.status} /></td>
                      <td style={{ padding: '0.4rem 0.6rem', color: 'var(--success-color)', fontWeight: 600 }}>{req.assignedResource || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Resource State */}
        <div className="card" style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Live Resource State
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {resources.map(res => (
              <div key={res.id} style={{
                padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${res.status === 'BUSY' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.15)'}`,
                borderRadius: 8,
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{res.id}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Node {res.location}</span>
                  </div>
                  <StatusBadge status={res.status} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={res.currentLoad} max={100} height={6}
                      color={res.currentLoad > 80 ? 'var(--error-color)' : res.currentLoad > 50 ? 'var(--warning-color)' : 'var(--success-color)'} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 35 }}>{res.currentLoad}%</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assignments: {res.assignments}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

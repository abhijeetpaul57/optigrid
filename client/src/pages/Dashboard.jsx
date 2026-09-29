import React, { useState } from 'react';
import { Activity, Server, Zap, Cpu, Clock, TrendingUp } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import CityGrid from '../components/grid/CityGrid';
import AllocationDetails from '../components/dashboard/AllocationDetails';

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

export default function Dashboard() {
  const {
    simulationStatus, metrics, allocations, currentScenario,
    selectAllocation, selectedAllocation
  } = useSimulation();

  const [drawerAlloc, setDrawerAlloc] = useState(null);

  const handleRowClick = (alloc) => {
    setDrawerAlloc(alloc);
    selectAllocation(alloc);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">OptiGrid</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Real-Time Resource Allocation &amp; Optimization</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scenario:</span>
          <span style={{ fontWeight: 600, color: '#fff' }}>{currentScenario?.name}</span>
          <StatusBadge status={simulationStatus} />
        </div>
      </div>

      {/* KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <MetricCard label="Requests Processed" value={metrics.requestsProcessed} icon={Activity} color="primary" />
        <MetricCard label="Active Resources"    value={`${metrics.activeResources} / ${metrics.totalResources}`} icon={Server} color="success" />
        <MetricCard label="Avg Waiting Time"    value={metrics.avgWaitingTime} unit=" min" icon={Clock} color="warning" />
        <MetricCard label="Resource Utilization" value={metrics.resourceUtilization} unit="%" icon={Cpu} color="accent" />
        <MetricCard label="Allocation Latency"  value={metrics.allocationLatency} unit=" ms" icon={Zap} color="primary" />
        <MetricCard label="Throughput"          value={metrics.throughput} unit=" req/min" icon={TrendingUp} color="success" />
      </div>

      {/* City Grid + Allocations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* City Grid */}
        <div className="card" style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            City Grid — 10 × 10
          </h2>
          <CityGrid />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { color: '#10b981', label: 'Available' },
              { color: '#f59e0b', label: 'Busy' },
              { color: '#8b5cf6', label: 'Request' },
              { color: 'rgba(59,130,246,0.6)', label: 'Route' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Allocations Table */}
        <div className="card" style={{ padding: '1rem', maxHeight: 500, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem', flexShrink: 0 }}>
            Recent Allocations
          </h2>
          {allocations.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No allocations yet — start a simulation.
            </div>
          ) : (
            <div style={{ overflow: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Request', 'Resource', 'Dist', 'Score', 'Latency', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allocations.map(alloc => (
                    <tr
                      key={alloc.id}
                      onClick={() => handleRowClick(alloc)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.5rem 0.6rem', color: 'var(--primary-color)', fontFamily: 'monospace' }}>{alloc.requestId}</td>
                      <td style={{ padding: '0.5rem 0.6rem', color: 'var(--success-color)', fontWeight: 600 }}>{alloc.resourceId}</td>
                      <td style={{ padding: '0.5rem 0.6rem' }}>{alloc.routeDistance}</td>
                      <td style={{ padding: '0.5rem 0.6rem', fontWeight: 600 }}>{alloc.finalScore}</td>
                      <td style={{ padding: '0.5rem 0.6rem' }}>{alloc.latency} ms</td>
                      <td style={{ padding: '0.5rem 0.6rem' }}><StatusBadge status={alloc.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Allocation Details Drawer */}
      <AllocationDetails allocation={drawerAlloc} onClose={() => setDrawerAlloc(null)} />
    </div>
  );
}

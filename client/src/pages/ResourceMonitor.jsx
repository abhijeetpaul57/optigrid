import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';
import Drawer from '../components/common/Drawer';

const FILTERS = ['ALL', 'AVAILABLE', 'BUSY', 'OFFLINE'];

function ResourceDetails({ resource, onClose }) {
  if (!resource) return null;
  return (
    <Drawer open={!!resource} onClose={onClose} title="Resource Details" width={380}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { label: 'Resource ID', value: resource.id },
            { label: 'Location', value: `Node ${resource.location}` },
            { label: 'Status', value: <StatusBadge status={resource.status} /> },
            { label: 'Current Load', value: `${resource.currentLoad}%` },
            { label: 'Total Assignments', value: resource.assignments },
            { label: 'Utilization', value: `${resource.utilization}%` },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{label}</div>
              <div style={{ color: '#fff', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Current Load</div>
          <ProgressBar value={resource.currentLoad} max={100} height={10}
            color={resource.currentLoad > 80 ? 'var(--error-color)' : resource.currentLoad > 50 ? 'var(--warning-color)' : 'var(--success-color)'} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Utilization</div>
          <ProgressBar value={resource.utilization} max={100} height={10} color="var(--primary-color)" />
        </div>
      </div>
    </Drawer>
  );
}

export default function ResourceMonitor() {
  const { resources } = useSimulation();
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  const filtered = resources
    .filter(r => filter === 'ALL' || r.status === filter)
    .sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortHeader = ({ colKey, label }) => (
    <th onClick={() => toggleSort(colKey)}
      style={{ padding: '0.75rem 1rem', textAlign: 'left', color: sortKey === colKey ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label} {sortKey === colKey ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resource Monitor</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track and manage all allocation resources in real-time.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.4rem 0.875rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
            border: filter === f ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)',
            background: filter === f ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
            color: filter === f ? 'var(--primary-color)' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}>
            {f}
            <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', opacity: 0.7 }}>
              ({filter === f ? filtered.length : resources.filter(r => f === 'ALL' || r.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Resource Table */}
      <div className="card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <SortHeader colKey="id"          label="Resource ID" />
              <SortHeader colKey="location"    label="Location" />
              <SortHeader colKey="status"      label="Status" />
              <SortHeader colKey="currentLoad" label="Current Load" />
              <SortHeader colKey="assignments" label="Assignments" />
              <SortHeader colKey="utilization" label="Utilization" />
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No resources match filter</td></tr>
            ) : filtered.map(res => (
              <tr key={res.id}
                onClick={() => setSelected(res)}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#fff' }}>{res.id}</td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>Node {res.location}</td>
                <td style={{ padding: '0.875rem 1rem' }}><StatusBadge status={res.status} /></td>
                <td style={{ padding: '0.875rem 1rem', minWidth: 140 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={res.currentLoad} max={100} height={5}
                        color={res.currentLoad > 80 ? 'var(--error-color)' : res.currentLoad > 50 ? 'var(--warning-color)' : 'var(--success-color)'} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 32 }}>{res.currentLoad}%</span>
                  </div>
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>{res.assignments}</td>
                <td style={{ padding: '0.875rem 1rem', minWidth: 120 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={res.utilization} max={100} height={5} color="var(--primary-color)" />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 32 }}>{res.utilization}%</span>
                  </div>
                </td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(res.lastUpdate).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ResourceDetails resource={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

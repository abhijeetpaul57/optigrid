import React from 'react';
import Drawer from '../common/Drawer';
import StatusBadge from '../common/StatusBadge';
import ProgressBar from '../common/ProgressBar';

export default function AllocationDetails({ allocation, onClose }) {
  if (!allocation) return null;

  return (
    <Drawer open={!!allocation} onClose={onClose} title="Allocation Decision" width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Main Info */}
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { label: 'Request ID',        value: allocation.requestId },
            { label: 'Request Location',  value: `Node ${allocation.requestLocation}` },
            { label: 'Priority',          value: <StatusBadge status={allocation.requestPriority} /> },
            { label: 'Selected Resource', value: allocation.resourceId },
            { label: 'Resource Location', value: `Node ${allocation.resourceLocation}` },
            { label: 'Route Distance',    value: allocation.routeDistance },
            { label: 'Resource Workload', value: `${allocation.resourceWorkload}%` },
            { label: 'Final Score',       value: <strong style={{ color: 'var(--primary-color)' }}>{allocation.finalScore}</strong> },
            { label: 'Latency',           value: `${allocation.latency} ms` },
            { label: 'Status',            value: <StatusBadge status={allocation.status} /> },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{label}</div>
              <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Candidates */}
        <div>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Candidate Resources
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {allocation.candidates?.map(c => (
              <div key={c.resourceId} className="card" style={{
                borderColor: c.selected ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.06)',
                background: c.selected ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.2)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: c.selected ? 'var(--primary-color)' : '#fff' }}>{c.resourceId}</span>
                  {c.selected && (
                    <span style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--primary-color)', padding: '0.1rem 0.5rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 600 }}>
                      SELECTED
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Distance</div><div>{c.distance}</div></div>
                  <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Workload</div><div>{c.workload}%</div></div>
                  <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Score</div>
                    <div style={{ color: c.selected ? 'var(--primary-color)' : '#fff', fontWeight: 600 }}>{c.score}</div>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <ProgressBar value={c.workload} max={100} height={4}
                    color={c.workload > 80 ? 'var(--error-color)' : c.workload > 50 ? 'var(--warning-color)' : 'var(--success-color)'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        {allocation.explanation && (
          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '0.4rem' }}>Why this resource?</div>
            {allocation.explanation}
          </div>
        )}
      </div>
    </Drawer>
  );
}

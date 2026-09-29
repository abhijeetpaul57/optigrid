import React from 'react';

export default function ProgressBar({ value = 0, max = 100, color = 'var(--primary-color)', height = 8, showLabel = false }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>{value} / {max}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div style={{ height, background: 'rgba(255,255,255,0.08)', borderRadius: height, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: height,
          transition: 'width 0.4s ease',
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  );
}

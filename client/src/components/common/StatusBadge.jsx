import React from 'react';

const STATUS_STYLES = {
  RUNNING:   { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Running'   },
  PAUSED:    { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Paused'    },
  IDLE:      { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', label: 'Idle'      },
  STOPPED:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'Stopped'   },
  COMPLETED: { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6', label: 'Completed' },
  AVAILABLE: { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Available' },
  BUSY:      { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Busy'      },
  OFFLINE:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'Offline'   },
  ASSIGNED:  { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', label: 'Assigned'  },
  PENDING:   { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', label: 'Pending'   },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.IDLE;
  return (
    <span style={{
      background: style.bg,
      color: style.color,
      padding: '0.2rem 0.65rem',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      display: 'inline-block',
      whiteSpace: 'nowrap',
    }}>
      {style.label}
    </span>
  );
}

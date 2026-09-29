import React from 'react';
import './MetricCard.css';

export default function MetricCard({ label, value, unit = '', trend, icon: Icon, color = 'primary' }) {
  const trendPositive = trend > 0;
  const trendDisplay = trend !== undefined && trend !== null && trend !== 0
    ? `${trendPositive ? '+' : ''}${trend}` : null;

  return (
    <div className={`metric-card metric-card--${color}`}>
      <div className="metric-card__header">
        <span className="metric-card__label">{label}</span>
        {Icon && <div className="metric-card__icon"><Icon size={16} /></div>}
      </div>
      <div className="metric-card__value">
        {value}<span className="metric-card__unit">{unit}</span>
      </div>
      {trendDisplay && (
        <div className={`metric-card__trend ${trendPositive ? 'up' : 'down'}`}>
          {trendPositive ? '▲' : '▼'} {trendDisplay}
        </div>
      )}
    </div>
  );
}

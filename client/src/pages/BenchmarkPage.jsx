import React, { useState } from 'react';
import { Play, TrendingDown, TrendingUp } from 'lucide-react';
import { mockBenchmark } from '../data/mockData';
import { runBenchmark } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const STRATEGIES = ['fifo', 'nearest', 'optigrid'];
const COLORS = { fifo: '#6b7280', nearest: '#f59e0b', optigrid: '#3b82f6' };
const LABELS = { fifo: 'FIFO', nearest: 'Nearest', optigrid: 'OptiGrid' };

function ImprovementCard({ label, value, unit, direction }) {
  const positive = direction === 'up';
  return (
    <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: positive ? 'var(--success-color)' : 'var(--error-color)' }}>
        {value}{unit}
      </div>
      <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ marginTop: '0.5rem' }}>
        {positive ? <TrendingUp size={18} color="var(--success-color)" /> : <TrendingDown size={18} color="var(--success-color)" />}
      </div>
    </div>
  );
}

export default function BenchmarkPage() {
  const [bench, setBench] = useState(mockBenchmark);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      const result = await runBenchmark({ scenarioId: 'scenario-001' });
      setBench(result);
    } finally {
      setLoading(false);
    }
  };

  const { results, improvements } = bench;

  const latencyData = [
    { name: 'FIFO', value: results.fifo.avgLatency },
    { name: 'Nearest', value: results.nearest.avgLatency },
    { name: 'OptiGrid', value: results.optigrid.avgLatency },
  ];
  const waitData = [
    { name: 'FIFO', value: results.fifo.avgWaitTime },
    { name: 'Nearest', value: results.nearest.avgWaitTime },
    { name: 'OptiGrid', value: results.optigrid.avgWaitTime },
  ];
  const utilData = [
    { name: 'FIFO', value: results.fifo.utilization },
    { name: 'Nearest', value: results.nearest.utilization },
    { name: 'OptiGrid', value: results.optigrid.utilization },
  ];
  const throughputData = [
    { name: 'FIFO', value: results.fifo.throughput },
    { name: 'Nearest', value: results.nearest.throughput },
    { name: 'OptiGrid', value: results.optigrid.throughput },
  ];

  const CustomTooltip = ({ active, payload, label, unit }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.75rem', fontSize: '0.8rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
          {payload.map(p => <div key={p.name} style={{ color: p.fill }}>{p.name}: {p.value}{unit}</div>)}
        </div>
      );
    }
    return null;
  };

  const chartProps = { background: 'transparent', style: { fontSize: '0.75rem' } };
  const axisProps = { tick: { fill: '#6b7280', fontSize: 11 }, axisLine: { stroke: 'rgba(255,255,255,0.1)' }, tickLine: false };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Algorithm Benchmark</h1>
          <p style={{ color: 'var(--text-secondary)' }}>All strategies evaluated against identical workload and scenario.</p>
        </div>
        <button className="btn btn-primary" onClick={handleRun} disabled={loading} style={{ padding: '0.6rem 1.25rem' }}>
          <Play size={16} /> {loading ? 'Running…' : 'Run Benchmark'}
        </button>
      </div>

      {/* Disclaimer */}
      <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--warning-color)' }}>
        ⚠ {bench.note}
      </div>

      {/* Improvement Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <ImprovementCard label="Allocation Latency" value={improvements.latency.value} unit="%" direction="down" />
        <ImprovementCard label="Waiting Time" value={improvements.waitTime.value} unit="%" direction="down" />
        <ImprovementCard label="Resource Utilization" value={`+${improvements.utilization.value}`} unit=" pp" direction="up" />
        <ImprovementCard label="Throughput" value={improvements.throughput.value} unit="%" direction="up" />
      </div>

      {/* Comparison Table */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Comparison Table</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Metric', 'FIFO', 'Nearest', 'OptiGrid', 'Improvement'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: h === 'Metric' ? 'left' : 'center', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Avg Allocation Latency', fifo: `${results.fifo.avgLatency} ms`, nearest: `${results.nearest.avgLatency} ms`, optigrid: `${results.optigrid.avgLatency} ms`, imp: `${improvements.latency.value}% lower` },
              { label: 'Avg Waiting Time', fifo: `${results.fifo.avgWaitTime} min`, nearest: `${results.nearest.avgWaitTime} min`, optigrid: `${results.optigrid.avgWaitTime} min`, imp: `${improvements.waitTime.value}% lower` },
              { label: 'Resource Utilization', fifo: `${results.fifo.utilization}%`, nearest: `${results.nearest.utilization}%`, optigrid: `${results.optigrid.utilization}%`, imp: `+${improvements.utilization.value} pp` },
              { label: 'Throughput', fifo: `${results.fifo.throughput}/min`, nearest: `${results.nearest.throughput}/min`, optigrid: `${results.optigrid.throughput}/min`, imp: `${improvements.throughput.value}% higher` },
              { label: 'Requests Completed', fifo: results.fifo.completed, nearest: results.nearest.completed, optigrid: results.optigrid.completed, imp: `+${results.optigrid.completed - results.fifo.completed}` },
            ].map(row => (
              <tr key={row.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>{row.label}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{row.fifo}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--warning-color)' }}>{row.nearest}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--primary-color)', fontWeight: 600 }}>{row.optigrid}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--success-color)', fontWeight: 600 }}>{row.imp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {[
          { title: 'Allocation Latency (ms)', data: latencyData, unit: ' ms', fill: '#3b82f6' },
          { title: 'Avg Waiting Time (min)', data: waitData, unit: ' min', fill: '#f59e0b' },
          { title: 'Resource Utilization (%)', data: utilData, unit: '%', fill: '#10b981' },
          { title: 'Throughput (req/min)', data: throughputData, unit: '/min', fill: '#8b5cf6' },
        ].map(({ title, data, unit, fill }) => (
          <div key={title} className="card">
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{title}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="value" fill={fill} radius={[4,4,0,0]} name={title.split(' ')[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}

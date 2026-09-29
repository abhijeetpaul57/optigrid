import React, { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

function WeightSlider({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={Math.round(value * 100)}
        onChange={e => onChange(parseFloat(e.target.value) / 100)}
        style={{ width: '100%', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
      />
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0.5rem' }}>
      {children}
    </h2>
  );
}

const DEFAULT = {
  name: 'Peak Demand',
  gridRows: 10, gridCols: 10,
  resources: 5,
  totalRequests: 500,
  priorityDistribution: { HIGH: 20, MEDIUM: 50, LOW: 30 },
  serviceDurationMin: 2000, serviceDurationMax: 8000,
  arrivalRate: 5,
  strategy: 'optigrid',
  weights: { distance: 0.4, workload: 0.4, priority: 0.2 },
  seed: 42,
  simulationDuration: 300,
};

export default function ScenarioBuilder() {
  const { setCurrentScenario, currentScenario } = useSimulation();
  const [form, setForm] = useState({ ...DEFAULT, ...currentScenario });
  const [saved, setSaved] = useState(false);

  const setW = (key, val) => {
    setForm(f => {
      const newWeights = { ...f.weights, [key]: val };
      const otherKeys = ['distance', 'workload', 'priority'].filter(k => k !== key);
      const remaining = Math.max(0, 1.0 - val);
      const otherSum = newWeights[otherKeys[0]] + newWeights[otherKeys[1]];
      
      if (otherSum === 0) {
        newWeights[otherKeys[0]] = remaining / 2;
        newWeights[otherKeys[1]] = remaining / 2;
      } else {
        newWeights[otherKeys[0]] = remaining * (newWeights[otherKeys[0]] / otherSum);
        newWeights[otherKeys[1]] = remaining * (newWeights[otherKeys[1]] / otherSum);
      }
      
      return { ...f, weights: newWeights };
    });
  };

  const totalWeight = Math.round((form.weights.distance + form.weights.workload + form.weights.priority) * 100);
  const weightValid = totalWeight === 100;

  const handleSave = () => {
    setCurrentScenario(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => setForm({ ...DEFAULT });

  const inputStyle = {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '0.6rem 0.75rem',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Scenario Configuration</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Define the simulation environment and algorithm parameters.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={handleReset}><RotateCcw size={15} /> Reset</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!weightValid}>
            <Save size={15} /> {saved ? 'Saved ✓' : 'Save Scenario'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* City Config */}
        <div className="card">
          <SectionTitle>City Configuration</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scenario Name</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rows</label>
                <input style={inputStyle} type="number" min={3} max={20} value={form.gridRows} onChange={e => setForm(f => ({ ...f, gridRows: +e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Columns</label>
                <input style={inputStyle} type="number" min={3} max={20} value={form.gridCols} onChange={e => setForm(f => ({ ...f, gridCols: +e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="card">
          <SectionTitle>Resources</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Number of Resources</label>
              <input style={inputStyle} type="number" min={1} max={20} value={form.resources} onChange={e => setForm(f => ({ ...f, resources: +e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Requests */}
        <div className="card">
          <SectionTitle>Requests</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Requests</label>
              <input style={inputStyle} type="number" min={10} max={10000} value={form.totalRequests} onChange={e => setForm(f => ({ ...f, totalRequests: +e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[['HIGH', 'HIGH %'], ['MEDIUM', 'MEDIUM %'], ['LOW', 'LOW %']].map(([key, label]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</label>
                  <input style={inputStyle} type="number" min={0} max={100} value={form.priorityDistribution[key]}
                    onChange={e => setForm(f => ({ ...f, priorityDistribution: { ...f.priorityDistribution, [key]: +e.target.value } }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Arrival Rate (req/s)</label>
              <input style={inputStyle} type="number" min={1} max={100} value={form.arrivalRate} onChange={e => setForm(f => ({ ...f, arrivalRate: +e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Algorithm */}
        <div className="card">
          <SectionTitle>Algorithm</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {['fifo', 'nearest', 'optigrid'].map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, strategy: s }))} style={{
                flex: 1, padding: '0.6rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                border: form.strategy === s ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                background: form.strategy === s ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                color: form.strategy === s ? 'var(--primary-color)' : 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {s === 'optigrid' ? 'OptiGrid' : s.toUpperCase()}
              </button>
            ))}
          </div>

          {form.strategy === 'optigrid' && (
            <>
              <SectionTitle>OptiGrid Weights</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <WeightSlider label="Distance Weight"  value={form.weights.distance}  onChange={v => setW('distance', v)} />
                <WeightSlider label="Workload Weight"  value={form.weights.workload}  onChange={v => setW('workload', v)} />
                <WeightSlider label="Priority Weight"  value={form.weights.priority}  onChange={v => setW('priority', v)} />
                <div style={{
                  padding: '0.6rem 0.875rem', borderRadius: 6,
                  background: weightValid ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${weightValid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: weightValid ? 'var(--success-color)' : 'var(--error-color)',
                  fontSize: '0.8rem', fontWeight: 600,
                }}>
                  Total: {totalWeight}% {weightValid ? '✓ Valid' : '— Must equal 100%'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Simulation */}
        <div className="card">
          <SectionTitle>Simulation Settings</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Random Seed</label>
              <input style={inputStyle} type="number" value={form.seed} onChange={e => setForm(f => ({ ...f, seed: +e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Duration (s)</label>
              <input style={inputStyle} type="number" min={30} value={form.simulationDuration} onChange={e => setForm(f => ({ ...f, simulationDuration: +e.target.value }))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

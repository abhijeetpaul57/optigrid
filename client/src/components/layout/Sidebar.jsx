import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, BarChart2, Server, Settings, Zap } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import './Sidebar.css';

const navItems = [
  { to: '/',           label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/simulation', label: 'Live Simulation',  icon: Activity        },
  { to: '/benchmarks', label: 'Benchmarks',       icon: BarChart2       },
  { to: '/resources',  label: 'Resources',        icon: Server          },
  { to: '/scenario',   label: 'Scenario',         icon: Settings        },
];

export default function Sidebar() {
  const { simulationStatus, currentScenario } = useSimulation();
  const engineReady = simulationStatus !== 'STOPPED';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Zap size={22} className="brand-icon" />
        <span className="brand-text">OptiGrid</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-scenario">
        <div className="scenario-label">Current Scenario</div>
        <div className="scenario-name">{currentScenario?.name || '—'}</div>
      </div>

      <div className="sidebar-status">
        <div className="status-row">
          <span className="dot dot--green" />
          <span>System Online</span>
        </div>
        <div className="status-row">
          <span className={`dot ${simulationStatus !== 'IDLE' ? 'dot--green' : 'dot--gray'}`} />
          <span>Engine {engineReady ? 'Ready' : 'Idle'}</span>
        </div>
        <div className="status-row">
          <span className="dot dot--blue" />
          <span>Backend Connected</span>
        </div>
      </div>
    </aside>
  );
}

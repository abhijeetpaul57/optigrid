import { Link, useLocation } from 'react-router-dom';
import { Activity, Map, BarChart2, Server } from 'lucide-react';
import './AppShell.css'; // We'll create this next

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Activity className="logo-icon" />
        <span className="logo-text">OptiGrid</span>
      </div>
      <div className="navbar-actions">
        {/* Status indicators can go here */}
      </div>
    </nav>
  );
}

function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <ul className="sidebar-nav">
        <li>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Map className="nav-icon" /> Dashboard
          </Link>
        </li>
        <li>
          <Link to="/scenarios/new" className={`nav-link ${isActive('/scenarios/new') ? 'active' : ''}`}>
            <Activity className="nav-icon" /> Scenario Builder
          </Link>
        </li>
        <li>
          <Link to="/resources" className={`nav-link ${isActive('/resources') ? 'active' : ''}`}>
            <Server className="nav-icon" /> Resource Monitor
          </Link>
        </li>
        <li>
          <Link to="/benchmark" className={`nav-link ${isActive('/benchmark') ? 'active' : ''}`}>
            <BarChart2 className="nav-icon" /> Benchmark
          </Link>
        </li>
      </ul>
    </aside>
  );
}

export default function AppShell({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}

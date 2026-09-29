import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SimulationProvider } from './context/SimulationContext';
import Layout from './components/layout/Layout';

import Dashboard from './pages/Dashboard';
import Simulation from './pages/Simulation';
import BenchmarkPage from './pages/BenchmarkPage';
import ResourceMonitor from './pages/ResourceMonitor';
import ScenarioBuilder from './pages/ScenarioBuilder';

function App() {
  return (
    <SimulationProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/benchmarks" element={<BenchmarkPage />} />
            <Route path="/resources"  element={<ResourceMonitor />} />
            <Route path="/scenario"   element={<ScenarioBuilder />} />
          </Routes>
        </Layout>
      </Router>
    </SimulationProvider>
  );
}

export default App;

import React, { useMemo } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { buildGridNodes } from '../../data/mockData';
import './CityGrid.css';

const COLS = 10;

function nodeColor(node, resources, requests, route, selectedResource, selectedRequest) {
  const res = resources.find(r => r.location === node.id);
  const req = requests.find(r => r.location === node.id && r.status === 'PENDING');
  if (route && route.includes(node.id)) return 'route';
  if (res) {
    if (selectedResource?.id === res.id) return 'resource-selected';
    return res.status === 'BUSY' ? 'resource-busy' : 'resource-available';
  }
  if (req) return 'request';
  if (selectedRequest?.location === node.id) return 'request-selected';
  return 'empty';
}

export default function CityGrid() {
  const { resources, requests, activeRoute, selectedResource, selectedRequest, selectResource, selectRequest } = useSimulation();
  const nodes = useMemo(() => buildGridNodes(10, 10), []);

  const handleNodeClick = (node) => {
    const res = resources.find(r => r.location === node.id);
    const req = requests.find(r => r.location === node.id && r.status === 'PENDING');
    if (res) selectResource(res);
    else if (req) selectRequest(req);
  };

  return (
    <div className="city-grid-wrapper">
      <div className="city-grid">
        {nodes.map(node => {
          const type = nodeColor(node, resources, requests, activeRoute, selectedResource, selectedRequest);
          const res = resources.find(r => r.location === node.id);
          const req = requests.find(r => r.location === node.id && (r.status === 'PENDING' || r.status === 'ASSIGNED'));
          const isOnRoute = activeRoute && activeRoute.includes(node.id);

          return (
            <div
              key={node.id}
              className={`grid-node grid-node--${type} ${isOnRoute ? 'on-route' : ''}`}
              onClick={() => handleNodeClick(node)}
              title={`Node ${node.id}${res ? ` — ${res.id} (${res.status})` : ''}${req ? ` — ${req.id}` : ''}`}
            >
              <span className="node-id">{node.id}</span>
              {res && (
                <div className={`node-marker resource-marker ${res.status === 'BUSY' ? 'busy' : 'available'}`}>
                  {res.id}
                </div>
              )}
              {req && !res && (
                <div className="node-marker request-marker">
                  {req.id.replace('RQ-', 'C')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

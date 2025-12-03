import React, { useState } from 'react';
import './VisualizationsPanel.css';
import LinkedListVisualizer from './LinkedListVisualizer';
import TreeVisualizer from './TreeVisualizer';
import StackQueueVisualizer from './StackQueueVisualizer';

const VisualizationsPanel: React.FC = () => {
  const [selectedViz, setSelectedViz] = useState<string>('linked-list');

  const visualizations = [
    { id: 'linked-list', name: 'Linked List', component: LinkedListVisualizer },
    { id: 'tree', name: 'Binary Tree', component: TreeVisualizer },
    { id: 'stack-queue', name: 'Stack & Queue', component: StackQueueVisualizer }
  ];

  const selected = visualizations.find(v => v.id === selectedViz);
  const Component = selected?.component || LinkedListVisualizer;

  return (
    <div className="visualizations-panel">
      <div className="viz-header">
        <h2>🎨 Interactive Visualizations</h2>
        <p>Manipulate data structures to understand how they work</p>
      </div>

      <div className="viz-selector">
        {visualizations.map(viz => (
          <button
            key={viz.id}
            className={`viz-btn ${selectedViz === viz.id ? 'active' : ''}`}
            onClick={() => setSelectedViz(viz.id)}
          >
            {viz.name}
          </button>
        ))}
      </div>

      <div className="viz-content">
        <Component />
      </div>
    </div>
  );
};

export default VisualizationsPanel;







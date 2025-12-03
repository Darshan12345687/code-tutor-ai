import React, { useState, useRef, useEffect } from 'react';
import './GraphVisualizer.css';

interface Algorithm {
  id: string;
  name: string;
  description: string;
}

interface GraphVisualizerProps {
  algorithms: Algorithm[];
}

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ algorithms }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('dijkstra');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateGraph();
  }, []);

  useEffect(() => {
    drawGraph();
  }, [nodes, edges]);

  const generateGraph = () => {
    const newNodes: Node[] = [
      { id: 'A', x: 100, y: 100, label: 'A' },
      { id: 'B', x: 300, y: 100, label: 'B' },
      { id: 'C', x: 500, y: 100, label: 'C' },
      { id: 'D', x: 100, y: 300, label: 'D' },
      { id: 'E', x: 300, y: 300, label: 'E' },
      { id: 'F', x: 500, y: 300, label: 'F' }
    ];

    const newEdges: Edge[] = [
      { from: 'A', to: 'B', weight: 4 },
      { from: 'A', to: 'D', weight: 2 },
      { from: 'B', to: 'C', weight: 5 },
      { from: 'B', to: 'E', weight: 3 },
      { from: 'C', to: 'F', weight: 1 },
      { from: 'D', to: 'E', weight: 6 },
      { from: 'E', to: 'F', weight: 4 }
    ];

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();

        // Draw weight
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        ctx.fillStyle = 'white';
        ctx.fillRect(midX - 15, midY - 10, 30, 20);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(edge.weight.toString(), midX, midY + 4);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
      ctx.fillStyle = '#667eea';
      ctx.fill();
      ctx.strokeStyle = '#764ba2';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + 5);
    });
  };

  const selectedAlgo = algorithms.find(a => a.id === selectedAlgorithm);

  return (
    <div className="graph-visualizer">
      <div className="visualizer-controls">
        <div className="algorithm-selector">
          <label>Select Algorithm:</label>
          <select 
            value={selectedAlgorithm} 
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            disabled={isRunning}
          >
            {algorithms.map(algo => (
              <option key={algo.id} value={algo.id}>{algo.name}</option>
            ))}
          </select>
        </div>

        <div className="control-buttons">
          <button onClick={generateGraph} disabled={isRunning} className="btn-control">
            Generate New Graph
          </button>
          <button 
            onClick={() => setIsRunning(!isRunning)} 
            className="btn-control btn-primary"
          >
            {isRunning ? 'Stop' : 'Run Algorithm'}
          </button>
        </div>
      </div>

      <div className="algorithm-info">
        <h3>{selectedAlgo?.name}</h3>
        <p>{selectedAlgo?.description}</p>
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} className="graph-canvas"></canvas>
      </div>
    </div>
  );
};

export default GraphVisualizer;







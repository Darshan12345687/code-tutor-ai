import React, { useState, useRef, useEffect } from 'react';
import './LinkedListVisualizer.css';

interface Node {
  value: number;
  next: Node | null;
}

const LinkedListVisualizer: React.FC = () => {
  const [list, setList] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawList();
  }, [list, highlightedIndex]);

  const drawList = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (list.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('List is empty. Add some nodes!', canvas.width / 2, canvas.height / 2);
      return;
    }

    const nodeWidth = 80;
    const nodeHeight = 60;
    const spacing = 20;
    const startX = 50;
    const startY = canvas.height / 2;

    list.forEach((value, index) => {
      const x = startX + index * (nodeWidth + spacing);
      const isHighlighted = index === highlightedIndex;

      // Draw node
      ctx.fillStyle = isHighlighted ? '#ffc107' : '#667eea';
      ctx.fillRect(x, startY - nodeHeight / 2, nodeWidth, nodeHeight);

      // Draw border
      ctx.strokeStyle = '#764ba2';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, startY - nodeHeight / 2, nodeWidth, nodeHeight);

      // Draw value
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x + nodeWidth / 2, startY + 5);

      // Draw arrow (except for last node)
      if (index < list.length - 1) {
        const arrowX = x + nodeWidth;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrowX, startY);
        ctx.lineTo(arrowX + spacing - 10, startY);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(arrowX + spacing - 10, startY);
        ctx.lineTo(arrowX + spacing - 20, startY - 5);
        ctx.lineTo(arrowX + spacing - 20, startY + 5);
        ctx.closePath();
        ctx.fillStyle = '#333';
        ctx.fill();
      }
    });
  };

  const addNode = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      setList([...list, value]);
      setInputValue('');
      setHighlightedIndex(list.length);
      setTimeout(() => setHighlightedIndex(null), 1000);
    }
  };

  const removeNode = (index: number) => {
    setHighlightedIndex(index);
    setTimeout(() => {
      setList(list.filter((_, i) => i !== index));
      setHighlightedIndex(null);
    }, 500);
  };

  const clearList = () => {
    setList([]);
    setHighlightedIndex(null);
  };

  return (
    <div className="linked-list-viz">
      <div className="viz-controls">
        <div className="input-group">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter value"
            className="viz-input"
          />
          <button onClick={addNode} className="btn-viz btn-primary">
            Add Node
          </button>
        </div>
        <button onClick={clearList} className="btn-viz btn-danger">
          Clear List
        </button>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="list-canvas"></canvas>
      </div>

      <div className="list-display">
        <h4>List Contents:</h4>
        <div className="node-list">
          {list.length === 0 ? (
            <p className="empty-message">Empty list</p>
          ) : (
            list.map((value, index) => (
              <div
                key={index}
                className={`list-node ${highlightedIndex === index ? 'highlighted' : ''}`}
              >
                <span className="node-value">{value}</span>
                <button
                  className="remove-btn"
                  onClick={() => removeNode(index)}
                  title="Remove node"
                >
                  ×
                </button>
                {index < list.length - 1 && <span className="arrow">→</span>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="viz-info">
        <h4>Linked List Operations:</h4>
        <ul>
          <li><strong>Add:</strong> O(1) at head, O(n) at tail</li>
          <li><strong>Remove:</strong> O(1) at head, O(n) at tail</li>
          <li><strong>Search:</strong> O(n)</li>
          <li><strong>Access:</strong> O(n)</li>
        </ul>
      </div>
    </div>
  );
};

export default LinkedListVisualizer;







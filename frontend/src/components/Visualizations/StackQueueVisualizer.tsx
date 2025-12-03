import React, { useState, useEffect } from 'react';
import './StackQueueVisualizer.css';

const StackQueueVisualizer: React.FC = () => {
  const [stack, setStack] = useState<number[]>([]);
  const [queue, setQueue] = useState<number[]>([]);
  const [stackInput, setStackInput] = useState('');
  const [queueInput, setQueueInput] = useState('');

  const pushToStack = () => {
    const value = parseInt(stackInput);
    if (!isNaN(value)) {
      setStack([...stack, value]);
      setStackInput('');
    }
  };

  const popFromStack = () => {
    if (stack.length > 0) {
      setStack(stack.slice(0, -1));
    }
  };

  const enqueue = () => {
    const value = parseInt(queueInput);
    if (!isNaN(value)) {
      setQueue([...queue, value]);
      setQueueInput('');
    }
  };

  const dequeue = () => {
    if (queue.length > 0) {
      setQueue(queue.slice(1));
    }
  };

  return (
    <div className="stack-queue-viz">
      <div className="viz-container">
        <div className="data-structure-viz">
          <h3>📚 Stack (LIFO)</h3>
          <div className="input-group">
            <input
              type="number"
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
              placeholder="Enter value"
              className="viz-input"
            />
            <button onClick={pushToStack} className="btn-viz btn-primary">
              Push
            </button>
            <button onClick={popFromStack} className="btn-viz btn-danger">
              Pop
            </button>
          </div>
          <div className="stack-display">
            {stack.length === 0 ? (
              <div className="empty-state">Stack is empty</div>
            ) : (
              stack.map((value, index) => (
                <div
                  key={index}
                  className="stack-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {value}
                </div>
              ))
            )}
          </div>
          <div className="ds-info">
            <p><strong>Top:</strong> {stack.length > 0 ? stack[stack.length - 1] : 'None'}</p>
            <p><strong>Size:</strong> {stack.length}</p>
          </div>
        </div>

        <div className="data-structure-viz">
          <h3>🚶 Queue (FIFO)</h3>
          <div className="input-group">
            <input
              type="number"
              value={queueInput}
              onChange={(e) => setQueueInput(e.target.value)}
              placeholder="Enter value"
              className="viz-input"
            />
            <button onClick={enqueue} className="btn-viz btn-primary">
              Enqueue
            </button>
            <button onClick={dequeue} className="btn-viz btn-danger">
              Dequeue
            </button>
          </div>
          <div className="queue-display">
            {queue.length === 0 ? (
              <div className="empty-state">Queue is empty</div>
            ) : (
              queue.map((value, index) => (
                <div
                  key={index}
                  className="queue-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {value}
                </div>
              ))
            )}
          </div>
          <div className="ds-info">
            <p><strong>Front:</strong> {queue.length > 0 ? queue[0] : 'None'}</p>
            <p><strong>Rear:</strong> {queue.length > 0 ? queue[queue.length - 1] : 'None'}</p>
            <p><strong>Size:</strong> {queue.length}</p>
          </div>
        </div>
      </div>

      <div className="comparison-info">
        <h4>Stack vs Queue:</h4>
        <div className="comparison-grid">
          <div className="comparison-item">
            <h5>Stack (LIFO)</h5>
            <ul>
              <li>Last In, First Out</li>
              <li>Operations: Push, Pop</li>
              <li>Time Complexity: O(1)</li>
              <li>Use cases: Undo/Redo, Call stack</li>
            </ul>
          </div>
          <div className="comparison-item">
            <h5>Queue (FIFO)</h5>
            <ul>
              <li>First In, First Out</li>
              <li>Operations: Enqueue, Dequeue</li>
              <li>Time Complexity: O(1)</li>
              <li>Use cases: Task scheduling, BFS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StackQueueVisualizer;







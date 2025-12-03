import React, { useState, useEffect, useRef } from 'react';
import './SearchVisualizer.css';

interface Algorithm {
  id: string;
  name: string;
  description: string;
}

interface SearchVisualizerProps {
  algorithms: Algorithm[];
}

const SearchVisualizer: React.FC<SearchVisualizerProps> = ({ algorithms }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('linear');
  const [array, setArray] = useState<number[]>([]);
  const [target, setTarget] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [steps, setSteps] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateSortedArray();
  }, []);

  useEffect(() => {
    drawArray();
  }, [array, currentIndex, foundIndex]);

  const generateSortedArray = () => {
    const newArray = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100) + 10)
      .sort((a, b) => a - b);
    setArray(newArray);
    setTarget(newArray[Math.floor(Math.random() * newArray.length)]);
    setCurrentIndex(null);
    setFoundIndex(null);
    setSteps(0);
  };

  const drawArray = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 400;

    const barWidth = canvas.width / array.length;
    const maxValue = Math.max(...array);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    array.forEach((value, index) => {
      const barHeight = (value / maxValue) * canvas.height;
      const x = index * barWidth;
      const y = canvas.height - barHeight;

      let color = '#667eea';
      if (index === foundIndex) {
        color = '#28a745';
      } else if (index === currentIndex) {
        color = '#ffc107';
      }

      ctx.fillStyle = color;
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
    });
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const linearSearch = async () => {
    setIsSearching(true);
    setSteps(0);
    let stepCount = 0;

    for (let i = 0; i < array.length; i++) {
      stepCount++;
      setSteps(stepCount);
      setCurrentIndex(i);
      await sleep(300);

      if (array[i] === target) {
        setFoundIndex(i);
        setIsSearching(false);
        return;
      }
    }

    setFoundIndex(-1);
    setIsSearching(false);
  };

  const binarySearch = async () => {
    setIsSearching(true);
    setSteps(0);
    let stepCount = 0;
    let left = 0;
    let right = array.length - 1;

    while (left <= right) {
      stepCount++;
      setSteps(stepCount);
      const mid = Math.floor((left + right) / 2);
      setCurrentIndex(mid);
      await sleep(500);

      if (array[mid] === target) {
        setFoundIndex(mid);
        setIsSearching(false);
        return;
      } else if (array[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    setFoundIndex(-1);
    setIsSearching(false);
  };

  const handleSearch = async () => {
    setCurrentIndex(null);
    setFoundIndex(null);
    
    switch (selectedAlgorithm) {
      case 'linear':
        await linearSearch();
        break;
      case 'binary':
        await binarySearch();
        break;
      default:
        break;
    }
  };

  const selectedAlgo = algorithms.find(a => a.id === selectedAlgorithm);

  return (
    <div className="search-visualizer">
      <div className="visualizer-controls">
        <div className="algorithm-selector">
          <label>Select Algorithm:</label>
          <select 
            value={selectedAlgorithm} 
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            disabled={isSearching}
          >
            {algorithms.map(algo => (
              <option key={algo.id} value={algo.id}>{algo.name}</option>
            ))}
          </select>
        </div>

        <div className="target-input">
          <label>Target Value:</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            disabled={isSearching}
            min={Math.min(...array)}
            max={Math.max(...array)}
          />
        </div>

        <div className="control-buttons">
          <button onClick={generateSortedArray} disabled={isSearching} className="btn-control">
            Generate New Array
          </button>
          <button onClick={handleSearch} disabled={isSearching} className="btn-control btn-primary">
            {isSearching ? 'Searching...' : 'Start Search'}
          </button>
        </div>
      </div>

      <div className="algorithm-info">
        <h3>{selectedAlgo?.name}</h3>
        <p>{selectedAlgo?.description}</p>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Steps:</span>
            <span className="stat-value">{steps}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Result:</span>
            <span className="stat-value">
              {foundIndex === null ? '-' : foundIndex === -1 ? 'Not Found' : `Index ${foundIndex}`}
            </span>
          </div>
        </div>
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} className="search-canvas"></canvas>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#ffc107' }}></div>
            <span>Current Check</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#28a745' }}></div>
            <span>Found</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchVisualizer;







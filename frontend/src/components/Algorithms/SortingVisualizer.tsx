import React, { useState, useEffect, useRef } from 'react';
import './SortingVisualizer.css';

interface Algorithm {
  id: string;
  name: string;
  description: string;
}

interface SortingVisualizerProps {
  algorithms: Algorithm[];
}

const SortingVisualizer: React.FC<SortingVisualizerProps> = ({ algorithms }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('bubble');
  const [array, setArray] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateArray();
  }, []);

  useEffect(() => {
    drawArray();
  }, [array]);

  const generateArray = () => {
    const newArray = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100) + 10);
    setArray(newArray);
    setComparisons(0);
    setSwaps(0);
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

      // Gradient fill
      const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');

      ctx.fillStyle = gradient;
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

      // Value label
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
    });
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const bubbleSort = async () => {
    setIsSorting(true);
    let comps = 0;
    let swapCount = 0;
    const arr = [...array];

    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        comps++;
        setComparisons(comps);

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          swapCount++;
          setSwaps(swapCount);
          setArray([...arr]);
          await sleep(speed);
        }
      }
    }

    setIsSorting(false);
  };

  const selectionSort = async () => {
    setIsSorting(true);
    let comps = 0;
    let swapCount = 0;
    const arr = [...array];

    for (let i = 0; i < arr.length - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < arr.length; j++) {
        comps++;
        setComparisons(comps);
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
        await sleep(speed / 2);
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        swapCount++;
        setSwaps(swapCount);
        setArray([...arr]);
        await sleep(speed);
      }
    }

    setIsSorting(false);
  };

  const insertionSort = async () => {
    setIsSorting(true);
    let comps = 0;
    let swapCount = 0;
    const arr = [...array];

    for (let i = 1; i < arr.length; i++) {
      let key = arr[i];
      let j = i - 1;

      while (j >= 0 && arr[j] > key) {
        comps++;
        setComparisons(comps);
        arr[j + 1] = arr[j];
        swapCount++;
        setSwaps(swapCount);
        j--;
        setArray([...arr]);
        await sleep(speed);
      }
      arr[j + 1] = key;
      setArray([...arr]);
      await sleep(speed);
    }

    setIsSorting(false);
  };

  const quickSort = async () => {
    setIsSorting(true);
    let comps = 0;
    let swapCount = 0;
    const arr = [...array];

    const partition = async (low: number, high: number): Promise<number> => {
      const pivot = arr[high];
      let i = low - 1;

      for (let j = low; j < high; j++) {
        comps++;
        setComparisons(comps);
        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          swapCount++;
          setSwaps(swapCount);
          setArray([...arr]);
          await sleep(speed);
        }
      }
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      swapCount++;
      setSwaps(swapCount);
      setArray([...arr]);
      await sleep(speed);
      return i + 1;
    };

    const quickSortRecursive = async (low: number, high: number) => {
      if (low < high) {
        const pi = await partition(low, high);
        await quickSortRecursive(low, pi - 1);
        await quickSortRecursive(pi + 1, high);
      }
    };

    await quickSortRecursive(0, arr.length - 1);
    setIsSorting(false);
  };

  const mergeSort = async () => {
    setIsSorting(true);
    let comps = 0;
    let swapCount = 0;
    const arr = [...array];

    const merge = async (left: number[], right: number[]): Promise<number[]> => {
      const result = [];
      let i = 0, j = 0;

      while (i < left.length && j < right.length) {
        comps++;
        setComparisons(comps);
        if (left[i] < right[j]) {
          result.push(left[i++]);
        } else {
          result.push(right[j++]);
        }
        await sleep(speed / 2);
      }

      return result.concat(left.slice(i)).concat(right.slice(j));
    };

    const mergeSortRecursive = async (arr: number[]): Promise<number[]> => {
      if (arr.length <= 1) return arr;

      const mid = Math.floor(arr.length / 2);
      const left = await mergeSortRecursive(arr.slice(0, mid));
      const right = await mergeSortRecursive(arr.slice(mid));

      const merged = await merge(left, right);
      swapCount += merged.length;
      setSwaps(swapCount);
      setArray([...merged]);
      await sleep(speed);
      return merged;
    };

    await mergeSortRecursive(arr);
    setIsSorting(false);
  };

  const heapSort = async () => {
    setIsSorting(true);
    let comps = 0;
    let swapCount = 0;
    const arr = [...array];

    const heapify = async (n: number, i: number) => {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n) {
        comps++;
        setComparisons(comps);
        if (arr[left] > arr[largest]) largest = left;
      }

      if (right < n) {
        comps++;
        setComparisons(comps);
        if (arr[right] > arr[largest]) largest = right;
      }

      if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        swapCount++;
        setSwaps(swapCount);
        setArray([...arr]);
        await sleep(speed);
        await heapify(n, largest);
      }
    };

    for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
      await heapify(arr.length, i);
    }

    for (let i = arr.length - 1; i > 0; i--) {
      [arr[0], arr[i]] = [arr[i], arr[0]];
      swapCount++;
      setSwaps(swapCount);
      setArray([...arr]);
      await sleep(speed);
      await heapify(i, 0);
    }

    setIsSorting(false);
  };

  const handleSort = async () => {
    switch (selectedAlgorithm) {
      case 'bubble':
        await bubbleSort();
        break;
      case 'selection':
        await selectionSort();
        break;
      case 'insertion':
        await insertionSort();
        break;
      case 'quick':
        await quickSort();
        break;
      case 'merge':
        await mergeSort();
        break;
      case 'heap':
        await heapSort();
        break;
    }
  };

  const selectedAlgo = algorithms.find(a => a.id === selectedAlgorithm);

  return (
    <div className="sorting-visualizer">
      <div className="visualizer-controls">
        <div className="algorithm-selector">
          <label>Select Algorithm:</label>
          <select 
            value={selectedAlgorithm} 
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            disabled={isSorting}
          >
            {algorithms.map(algo => (
              <option key={algo.id} value={algo.id}>{algo.name}</option>
            ))}
          </select>
        </div>

        <div className="control-buttons">
          <button onClick={generateArray} disabled={isSorting} className="btn-control">
            Generate New Array
          </button>
          <button onClick={handleSort} disabled={isSorting} className="btn-control btn-primary">
            {isSorting ? 'Sorting...' : 'Start Sorting'}
          </button>
        </div>

        <div className="speed-control">
          <label>Speed: {speed}ms</label>
          <input
            type="range"
            min="10"
            max="500"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            disabled={isSorting}
          />
        </div>
      </div>

      <div className="algorithm-info">
        <h3>{selectedAlgo?.name}</h3>
        <p>{selectedAlgo?.description}</p>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Comparisons:</span>
            <span className="stat-value">{comparisons}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Swaps:</span>
            <span className="stat-value">{swaps}</span>
          </div>
        </div>
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} className="sorting-canvas"></canvas>
      </div>
    </div>
  );
};

export default SortingVisualizer;







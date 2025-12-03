import React, { useState } from 'react';
import './AlgorithmsPanel.css';
import SortingVisualizer from './SortingVisualizer';
import GraphVisualizer from './GraphVisualizer';
import SearchVisualizer from './SearchVisualizer';

const AlgorithmsPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'sorting' | 'search' | 'graph' | null>(null);

  const algorithms = {
    sorting: [
      { id: 'bubble', name: 'Bubble Sort', description: 'Simple comparison-based sorting' },
      { id: 'selection', name: 'Selection Sort', description: 'Find minimum and swap' },
      { id: 'insertion', name: 'Insertion Sort', description: 'Build sorted array one element at a time' },
      { id: 'merge', name: 'Merge Sort', description: 'Divide and conquer approach' },
      { id: 'quick', name: 'Quick Sort', description: 'Efficient divide and conquer' },
      { id: 'heap', name: 'Heap Sort', description: 'Uses binary heap data structure' }
    ],
    search: [
      { id: 'linear', name: 'Linear Search', description: 'Search element by element' },
      { id: 'binary', name: 'Binary Search', description: 'Search in sorted array' },
      { id: 'bfs', name: 'BFS', description: 'Breadth-First Search' },
      { id: 'dfs', name: 'DFS', description: 'Depth-First Search' }
    ],
    graph: [
      { id: 'dijkstra', name: "Dijkstra's Algorithm", description: 'Shortest path algorithm' },
      { id: 'kruskal', name: "Kruskal's Algorithm", description: 'Minimum spanning tree' },
      { id: 'prim', name: "Prim's Algorithm", description: 'Minimum spanning tree' },
      { id: 'floyd', name: "Floyd-Warshall", description: 'All pairs shortest path' }
    ]
  };

  return (
    <div className="algorithms-panel">
      <div className="algorithms-header">
        <h2>⚡ Algorithms Learning</h2>
        <p>Visualize and understand algorithms through interactive demonstrations</p>
      </div>

      {!selectedCategory ? (
        <div className="algorithm-categories">
          <div className="category-card" onClick={() => setSelectedCategory('sorting')}>
            <div className="category-icon">🔄</div>
            <h3>Sorting Algorithms</h3>
            <p>Bubble, Selection, Insertion, Merge, Quick, Heap Sort</p>
            <div className="algorithm-count">{algorithms.sorting.length} algorithms</div>
          </div>

          <div className="category-card" onClick={() => setSelectedCategory('search')}>
            <div className="category-icon">🔍</div>
            <h3>Search Algorithms</h3>
            <p>Linear, Binary, BFS, DFS</p>
            <div className="algorithm-count">{algorithms.search.length} algorithms</div>
          </div>

          <div className="category-card" onClick={() => setSelectedCategory('graph')}>
            <div className="category-icon">🕸️</div>
            <h3>Graph Algorithms</h3>
            <p>Dijkstra, Kruskal, Prim, Floyd-Warshall</p>
            <div className="algorithm-count">{algorithms.graph.length} algorithms</div>
          </div>
        </div>
      ) : (
        <div className="algorithm-detail">
          <button className="back-btn" onClick={() => setSelectedCategory(null)}>
            ← Back to Categories
          </button>
          
          {selectedCategory === 'sorting' && (
            <SortingVisualizer algorithms={algorithms.sorting} />
          )}
          
          {selectedCategory === 'search' && (
            <SearchVisualizer algorithms={algorithms.search} />
          )}
          
          {selectedCategory === 'graph' && (
            <GraphVisualizer algorithms={algorithms.graph} />
          )}
        </div>
      )}
    </div>
  );
};

export default AlgorithmsPanel;







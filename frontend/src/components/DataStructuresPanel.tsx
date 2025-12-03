import React, { useState, useEffect } from 'react';
import './DataStructuresPanel.css';

interface DataStructure {
  id: string;
  name: string;
  description: string;
  example: string;
}

interface DSDetail {
  name: string;
  description: string;
  characteristics: string[];
  operations: string[];
  time_complexity: {
    access: string;
    search: string;
    insertion: string;
    deletion: string;
  };
  code_example: string;
}

const DataStructuresPanel: React.FC = () => {
  const [selectedDS, setSelectedDS] = useState<string | null>(null);
  const [dataStructures, setDataStructures] = useState<DataStructure[]>([]);
  const [dsDetail, setDsDetail] = useState<DSDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDataStructures();
  }, []);

  useEffect(() => {
    if (selectedDS) {
      fetchDSDetail(selectedDS);
    } else {
      setDsDetail(null);
    }
  }, [selectedDS]);

  const fetchDataStructures = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/data-structures');
      const data = await response.json();
      setDataStructures(data.data_structures);
    } catch (error) {
      console.error('Error fetching data structures:', error);
    }
  };

  const fetchDSDetail = async (dsId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/data-structures/${dsId}`);
      const data = await response.json();
      setDsDetail(data);
    } catch (error) {
      console.error('Error fetching DS detail:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-structures-panel">
      <div className="ds-header">
        <h2>📚 Data Structures Learning</h2>
        <p>Explore different data structures with detailed explanations and examples</p>
      </div>
      <div className="ds-content">
        <div className="ds-list">
          <h3>Available Data Structures</h3>
          <div className="ds-grid">
            {dataStructures.map((ds) => (
              <div
                key={ds.id}
                className={`ds-card ${selectedDS === ds.id ? 'active' : ''}`}
                onClick={() => setSelectedDS(ds.id)}
              >
                <h4>{ds.name}</h4>
                <p>{ds.description}</p>
                <code className="ds-example-preview">{ds.example}</code>
              </div>
            ))}
          </div>
        </div>
        <div className="ds-detail">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : dsDetail ? (
            <div className="ds-detail-content">
              <div className="ds-detail-header">
                <h2>{dsDetail.name}</h2>
                <button className="btn-close" onClick={() => setSelectedDS(null)}>
                  ✕
                </button>
              </div>
              <div className="ds-detail-body">
                <section className="ds-section">
                  <h3>Description</h3>
                  <p>{dsDetail.description}</p>
                </section>
                <section className="ds-section">
                  <h3>Characteristics</h3>
                  <ul>
                    {dsDetail.characteristics.map((char, index) => (
                      <li key={index}>{char}</li>
                    ))}
                  </ul>
                </section>
                <section className="ds-section">
                  <h3>Common Operations</h3>
                  <ul>
                    {dsDetail.operations.map((op, index) => (
                      <li key={index}>
                        <code>{op}</code>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="ds-section">
                  <h3>Time Complexity</h3>
                  <div className="complexity-grid">
                    <div className="complexity-item">
                      <span className="complexity-label">Access:</span>
                      <span className="complexity-value">{dsDetail.time_complexity.access}</span>
                    </div>
                    <div className="complexity-item">
                      <span className="complexity-label">Search:</span>
                      <span className="complexity-value">{dsDetail.time_complexity.search}</span>
                    </div>
                    <div className="complexity-item">
                      <span className="complexity-label">Insertion:</span>
                      <span className="complexity-value">{dsDetail.time_complexity.insertion}</span>
                    </div>
                    <div className="complexity-item">
                      <span className="complexity-label">Deletion:</span>
                      <span className="complexity-value">{dsDetail.time_complexity.deletion}</span>
                    </div>
                  </div>
                </section>
                <section className="ds-section">
                  <h3>Code Example</h3>
                  <pre className="ds-code-example">{dsDetail.code_example}</pre>
                </section>
              </div>
            </div>
          ) : (
            <div className="ds-placeholder">
              <p>Select a data structure from the list to view detailed information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataStructuresPanel;


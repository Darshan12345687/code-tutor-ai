import React, { useState } from 'react';
import './ResourcesPanel.css';

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon: string;
}

const ResourcesPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const resources: Resource[] = [
    // Python Resources
    {
      id: 'python-docs',
      title: 'Python Official Documentation',
      description: 'Comprehensive Python documentation and tutorials',
      url: 'https://docs.python.org/3/',
      category: 'python',
      icon: '🐍'
    },
    {
      id: 'python-tutorial',
      title: 'Python Tutorial - W3Schools',
      description: 'Learn Python programming step by step',
      url: 'https://www.w3schools.com/python/',
      category: 'python',
      icon: '📚'
    },
    {
      id: 'real-python',
      title: 'Real Python',
      description: 'Python tutorials, courses, and articles',
      url: 'https://realpython.com/',
      category: 'python',
      icon: '⭐'
    },
    
    // Data Structures
    {
      id: 'geeks-ds',
      title: 'GeeksforGeeks - Data Structures',
      description: 'Comprehensive data structures tutorials',
      url: 'https://www.geeksforgeeks.org/data-structures/',
      category: 'data-structures',
      icon: '📊'
    },
    {
      id: 'visualgo',
      title: 'VisuAlgo',
      description: 'Visualize data structures and algorithms',
      url: 'https://visualgo.net/',
      category: 'data-structures',
      icon: '🎨'
    },
    
    // Algorithms
    {
      id: 'algo-expert',
      title: 'AlgoExpert',
      description: 'Algorithm practice and explanations',
      url: 'https://www.algoexpert.io/',
      category: 'algorithms',
      icon: '⚡'
    },
    {
      id: 'leetcode',
      title: 'LeetCode',
      description: 'Practice coding problems and algorithms',
      url: 'https://leetcode.com/',
      category: 'algorithms',
      icon: '💻'
    },
    {
      id: 'hackerrank',
      title: 'HackerRank',
      description: 'Coding challenges and competitions',
      url: 'https://www.hackerrank.com/',
      category: 'algorithms',
      icon: '🏆'
    },
    
    // Web Development
    {
      id: 'mdn',
      title: 'MDN Web Docs',
      description: 'Complete web development documentation',
      url: 'https://developer.mozilla.org/',
      category: 'web',
      icon: '🌐'
    },
    {
      id: 'freecodecamp',
      title: 'freeCodeCamp',
      description: 'Free coding bootcamp and tutorials',
      url: 'https://www.freecodecamp.org/',
      category: 'web',
      icon: '🎓'
    },
    
    // General Programming
    {
      id: 'stack-overflow',
      title: 'Stack Overflow',
      description: 'Q&A for programmers',
      url: 'https://stackoverflow.com/',
      category: 'general',
      icon: '💬'
    },
    {
      id: 'github',
      title: 'GitHub',
      description: 'Code hosting and collaboration',
      url: 'https://github.com/',
      category: 'general',
      icon: '🐙'
    },
    {
      id: 'codewars',
      title: 'Codewars',
      description: 'Practice coding through kata challenges',
      url: 'https://www.codewars.com/',
      category: 'algorithms',
      icon: '🥋'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Resources', icon: '📚' },
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'data-structures', name: 'Data Structures', icon: '📊' },
    { id: 'algorithms', name: 'Algorithms', icon: '⚡' },
    { id: 'web', name: 'Web Development', icon: '🌐' },
    { id: 'general', name: 'General', icon: '💡' }
  ];

  const filteredResources = selectedCategory === 'all' 
    ? resources 
    : resources.filter(r => r.category === selectedCategory);

  return (
    <div className="resources-panel">
      <div className="resources-header">
        <h2>🔗 Learning Resources</h2>
        <p>Curated links to help you learn programming effectively</p>
      </div>

      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="category-icon">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="resources-grid">
        {filteredResources.map(resource => (
          <a
            key={resource.id}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="resource-card floating"
          >
            <div className="resource-icon">{resource.icon}</div>
            <h3>{resource.title}</h3>
            <p>{resource.description}</p>
            <div className="resource-link">
              Visit Site →
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ResourcesPanel;







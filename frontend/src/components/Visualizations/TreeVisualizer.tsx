import React, { useState, useRef, useEffect } from 'react';
import './TreeVisualizer.css';

interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

const TreeVisualizer: React.FC = () => {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [traversalResult, setTraversalResult] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawTree();
  }, [root]);

  const createNode = (value: number): TreeNode => ({
    value,
    left: null,
    right: null
  });

  const insertNode = (node: TreeNode | null, value: number): TreeNode => {
    if (!node) {
      return createNode(value);
    }

    if (value < node.value) {
      node.left = insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = insertNode(node.right, value);
    }

    return node;
  };

  const addNode = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      setRoot(insertNode(root, value));
      setInputValue('');
    }
  };

  const inorderTraversal = (node: TreeNode | null, result: number[] = []): number[] => {
    if (node) {
      inorderTraversal(node.left, result);
      result.push(node.value);
      inorderTraversal(node.right, result);
    }
    return result;
  };

  const preorderTraversal = (node: TreeNode | null, result: number[] = []): number[] => {
    if (node) {
      result.push(node.value);
      preorderTraversal(node.left, result);
      preorderTraversal(node.right, result);
    }
    return result;
  };

  const postorderTraversal = (node: TreeNode | null, result: number[] = []): number[] => {
    if (node) {
      postorderTraversal(node.left, result);
      postorderTraversal(node.right, result);
      result.push(node.value);
    }
    return result;
  };

  const handleTraversal = (type: 'inorder' | 'preorder' | 'postorder') => {
    let result: number[] = [];
    switch (type) {
      case 'inorder':
        result = inorderTraversal(root);
        break;
      case 'preorder':
        result = preorderTraversal(root);
        break;
      case 'postorder':
        result = postorderTraversal(root);
        break;
    }
    setTraversalResult(result);
  };

  const drawTree = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!root) {
      ctx.fillStyle = '#999';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Tree is empty. Add some nodes!', canvas.width / 2, canvas.height / 2);
      return;
    }

    const drawNode = (node: TreeNode | null, x: number, y: number, level: number, xOffset: number) => {
      if (!node) return;

      const radius = 25;
      // Removed unused spacing variable

      // Draw connections
      if (node.left) {
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - xOffset, y + 80);
        ctx.stroke();
        drawNode(node.left, x - xOffset, y + 80, level + 1, xOffset / 2);
      }

      if (node.right) {
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + xOffset, y + 80);
        ctx.stroke();
        drawNode(node.right, x + xOffset, y + 80, level + 1, xOffset / 2);
      }

      // Draw node
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#667eea';
      ctx.fill();
      ctx.strokeStyle = '#764ba2';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw value
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.value.toString(), x, y + 5);
    };

    drawNode(root, canvas.width / 2, 50, 1, 200);
  };

  const clearTree = () => {
    setRoot(null);
    setTraversalResult([]);
  };

  return (
    <div className="tree-viz">
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
        <button onClick={clearTree} className="btn-viz btn-danger">
          Clear Tree
        </button>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="tree-canvas"></canvas>
      </div>

      <div className="traversal-controls">
        <h4>Tree Traversals:</h4>
        <div className="traversal-buttons">
          <button onClick={() => handleTraversal('inorder')} className="btn-viz">
            Inorder
          </button>
          <button onClick={() => handleTraversal('preorder')} className="btn-viz">
            Preorder
          </button>
          <button onClick={() => handleTraversal('postorder')} className="btn-viz">
            Postorder
          </button>
        </div>
        {traversalResult.length > 0 && (
          <div className="traversal-result">
            <strong>Result:</strong> {traversalResult.join(' → ')}
          </div>
        )}
      </div>

      <div className="viz-info">
        <h4>Binary Tree Properties:</h4>
        <ul>
          <li><strong>Insert:</strong> O(log n) average, O(n) worst case</li>
          <li><strong>Search:</strong> O(log n) average, O(n) worst case</li>
          <li><strong>Traversal:</strong> O(n)</li>
          <li><strong>Height:</strong> O(log n) for balanced tree</li>
        </ul>
      </div>
    </div>
  );
};

export default TreeVisualizer;







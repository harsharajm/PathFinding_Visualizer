import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { dijkstra, Node } from './dijkstra';

const App: React.FC = () => {
  const [grid, setGrid] = useState<Node[][]>([]);
  const [startNode, setStartNode] = useState<Node | null>(null);
  const [endNode, setEndNode] = useState<Node | null>(null);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [currentMode, setCurrentMode] = useState<'start' | 'end' | 'wall'>('start');
  const [isMousePressed, setIsMousePressed] = useState(false);

  useEffect(() => {
    initializeGrid();
    window.addEventListener('resize', initializeGrid);
    return () => window.removeEventListener('resize', initializeGrid);
  }, []);

  const initializeGrid = useCallback(() => {
    const headerHeight = 60;
    const cellSize = 20;

    const rows = Math.floor((window.innerHeight - headerHeight) / cellSize);
    const cols = Math.floor(window.innerWidth / cellSize);

    const newGrid: Node[][] = [];
    for (let row = 0; row < rows; row++) {
      const currentRow: Node[] = [];
      for (let col = 0; col < cols; col++) {
        currentRow.push({
          row,
          col,
          distance: Infinity,
          isVisited: false,
          isStart: false,
          isEnd: false,
          isWall: false,
          previousNode: null,
        });
      }
      newGrid.push(currentRow);
    }
    setGrid(newGrid);
    setStartNode(null);
    setEndNode(null);
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (isVisualizing) return;
  
    clearVisualization();
  
    const newGrid = grid.map(row => [...row]);
    const clickedNode = newGrid[row][col];
  
    if (clickedNode.isWall) {
      // If the clicked cell is a wall, only allow removing the wall
      if (currentMode === 'wall') {
        clickedNode.isWall = false;
        setGrid(newGrid);
      }
      return;
    }
  
    if (currentMode === 'start') {
      if (startNode) {
        newGrid[startNode.row][startNode.col].isStart = false;
      }
      clickedNode.isStart = true;
      setStartNode(clickedNode);
      setCurrentMode('end'); // Automatically switch to 'end' mode
    } else if (currentMode === 'end') {
      if (endNode) {
        newGrid[endNode.row][endNode.col].isEnd = false;
      }
      clickedNode.isEnd = true;
      setEndNode(clickedNode);
    } else if (currentMode === 'wall') {
      if (!clickedNode.isStart && !clickedNode.isEnd) {
        clickedNode.isWall = !clickedNode.isWall;
      }
    }
    setGrid(newGrid);
  };

  const handleMouseDown = (row: number, col: number) => {
    if (isVisualizing) return;
    setIsMousePressed(true);
    handleCellClick(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isVisualizing || !isMousePressed) return;
    handleCellClick(row, col);
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
  };

  const handleModeChange = (mode: 'start' | 'end' | 'wall') => {
    clearVisualization();
    setCurrentMode(mode);
  
    if (mode === 'start') {
      setGrid(prevGrid => prevGrid.map(row => row.map(node => ({
        ...node,
        isStart: false,
        isEnd: false
      }))));
      setStartNode(null);
      setEndNode(null);
    } else if (mode === 'end' && !startNode) {
      // If switching to 'end' mode and there's no start node, stay in 'start' mode
      setCurrentMode('start');
    }
  };

  const visualizeDijkstra = async () => {
    if (!startNode || !endNode || isVisualizing) return;
  
    clearVisualization();
    setIsVisualizing(true);
  
    // Add a small delay to allow the grid to update visually
    await new Promise(resolve => setTimeout(resolve, 50));
  
    const updatedGrid = grid.map(row => row.map(node => ({
      ...node,
      distance: Infinity,
      isVisited: false,
      previousNode: null,
      isShortestPath: false
    })));
  
    const updatedStartNode = updatedGrid[startNode.row][startNode.col];
    const updatedEndNode = updatedGrid[endNode.row][endNode.col];
  
    setGrid(updatedGrid);
  
    await dijkstra(updatedGrid, updatedStartNode, updatedEndNode, updateNodes);
    animateShortestPath(getNodesInShortestPathOrder(updatedEndNode));
  };

  const updateNodes = (nodes: Node[]) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      for (const node of nodes) {
        if (!newGrid[node.row][node.col].isStart && !newGrid[node.row][node.col].isEnd) {
          newGrid[node.row][node.col].isVisited = true;
        }
      }
      return newGrid;
    });
  };

  const animateShortestPath = (nodesInShortestPathOrder: Node[]) => {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(row => [...row]);
          const node = nodesInShortestPathOrder[i];
          const newNode = newGrid[node.row][node.col];
          if (!newNode.isStart && !newNode.isEnd) {
            newNode.isShortestPath = true;
          }
          return newGrid;
        });
        if (i === nodesInShortestPathOrder.length - 1) {
          setIsVisualizing(false);
        }
      }, 5 * i);
    }
  };

  const getNodesInShortestPathOrder = (endNode: Node): Node[] => {
    const nodesInShortestPathOrder: Node[] = [];
    let currentNode: Node | null = endNode;
    while (currentNode !== null) {
      nodesInShortestPathOrder.unshift(currentNode);
      currentNode = currentNode.previousNode;
    }
    return nodesInShortestPathOrder;
  };

  useCallback(() => {
    setGrid(prevGrid => prevGrid.map(row => row.map(node => ({
      ...node,
      distance: Infinity,
      isVisited: false,
      previousNode: null,
      isShortestPath: false
    }))));
  }, []);
  
  const generateRandomMaze = () => {
    if (isVisualizing) return;
  
    clearAll();
  
    setGrid(prevGrid => prevGrid.map(row => row.map(node => {
      if (node.isStart || node.isEnd) {
        return node;
      }
      return {
        ...node,
        isWall: Math.random() < 0.3 // 30% chance of being a wall
      };
    })));
  };
  const clearVisualization = useCallback(() => {
    setGrid(prevGrid => prevGrid.map(row => row.map(node => ({
      ...node,
      distance: Infinity,
      isVisited: false,
      previousNode: null,
      isShortestPath: false,
      // Keep the following properties unchanged
      isWall: node.isWall,
      isStart: node.isStart,
      isEnd: node.isEnd
    }))));
  }, []);
  const clearAll = useCallback(() => {
    setGrid(prevGrid => prevGrid.map(row => row.map(node => ({
      ...node,
      isWall: false,
      isVisited: false,
      isShortestPath: false,
      distance: Infinity,
      previousNode: null,
      // Preserve start and end nodes
      isStart: node.isStart,
      isEnd: node.isEnd
    }))));
  }, []);
  return (
    <div className="App">
      <div className="button-container">
        <button
          className={`mode-button ${currentMode === 'start' ? 'active' : ''}`}
          onClick={() => handleModeChange('start')}
          disabled={isVisualizing}
        >
          Set Start
        </button>
        <button
          className={`mode-button ${currentMode === 'end' ? 'active' : ''}`}
          onClick={() => handleModeChange('end')}
          disabled={isVisualizing || !startNode}
        >
          Set End
        </button>
        <button
          className={`mode-button ${currentMode === 'wall' ? 'active' : ''}`}
          onClick={() => handleModeChange('wall')}
          disabled={isVisualizing}
        >
          Add/Remove Wall
        </button>
        <button
          className="mode-button"
          onClick={clearAll}
          disabled={isVisualizing}
        >
          Clear All
        </button>
        <button
          className="mode-button"
          onClick={generateRandomMaze}
          disabled={isVisualizing}
        >
          Generate Random Maze
        </button>
        <button
          className="visualize-button"
          onClick={visualizeDijkstra}
          disabled={isVisualizing || !startNode || !endNode}
        >
          {isVisualizing ? 'Visualizing...' : 'Visualize Dijkstra'}
        </button>
      </div>
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((node, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`cell 
                  ${node.isStart ? 'start' : ''} 
                  ${node.isEnd ? 'end' : ''} 
                  ${node.isWall ? 'wall' : ''}
                  ${node.isVisited && !node.isStart && !node.isEnd && !node.isWall ? 'visited' : ''} 
                  ${node.isShortestPath && !node.isStart && !node.isEnd && !node.isWall ? 'shortest-path' : ''}
                `}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                onMouseUp={handleMouseUp}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );


};

export default App;
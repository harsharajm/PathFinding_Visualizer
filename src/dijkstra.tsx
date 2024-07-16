export interface Node {
    row: number;
    col: number;
    distance: number;
    isVisited: boolean;
    isStart?: boolean;
    isEnd?: boolean;
    isWall?: boolean;
    previousNode: Node | null;
    isShortestPath?: boolean;
  }
  
  export const dijkstra = async (
    grid: Node[][],
    startNode: Node,
    endNode: Node,
    updateNodes: (nodes: Node[]) => void
  ): Promise<Node[]> => {
    const visitedNodesInOrder: Node[] = [];
    startNode.distance = 0;
    const unvisitedNodes = getAllNodes(grid);
  
    while (unvisitedNodes.length > 0) {
      sortNodesByDistance(unvisitedNodes);
      const currentDistance = unvisitedNodes[0].distance;
      const nodesToUpdate: Node[] = [];
  
      while (unvisitedNodes.length > 0 && unvisitedNodes[0].distance === currentDistance) {
        const closestNode = unvisitedNodes.shift();
        if (!closestNode || closestNode.distance === Infinity) return visitedNodesInOrder;
  
        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);
        nodesToUpdate.push(closestNode);
  
        if (closestNode === endNode) {
          updateNodes(nodesToUpdate);
          return visitedNodesInOrder;
        }
  
        updateUnvisitedNeighbors(closestNode, grid);
      }
  
      updateNodes(nodesToUpdate);
      await new Promise(resolve => setTimeout(resolve, 50)); // Add delay here
    }
  
    return visitedNodesInOrder;
  };
  
  const getAllNodes = (grid: Node[][]): Node[] => {
    const nodes: Node[] = [];
    for (const row of grid) {
      for (const node of row) {
        nodes.push(node);
      }
    }
    return nodes;
  };
  
  const sortNodesByDistance = (nodes: Node[]): void => {
    nodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
  };
  
  const updateUnvisitedNeighbors = (node: Node, grid: Node[][]): void => {
    const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
    for (const neighbor of unvisitedNeighbors) {
      neighbor.distance = node.distance + 1;
      neighbor.previousNode = node;
    }
  };
  
  const getUnvisitedNeighbors = (node: Node, grid: Node[][]): Node[] => {
    const neighbors: Node[] = [];
    const { row, col } = node;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
    return neighbors.filter(neighbor => !neighbor.isVisited && !neighbor.isWall);
  };
interface GraphNode {
  id: string;
  attributes: Record<string, any>;
  edges: string[];
}

interface GraphMetrics {
  degreeCentrality: Record<string, number>;
  pageRank: Record<string, number>;
  clusteringCoefficient: Record<string, number>;
  communities: Record<string, number>;
}

export class GraphAnalysisService {
  // Calculate degree centrality for all nodes
  calculateDegreeCentrality(nodes: GraphNode[]): Record<string, number> {
    const centrality: Record<string, number> = {};
    
    nodes.forEach(node => {
      centrality[node.id] = node.edges.length;
    });

    // Normalize by maximum possible degree
    const maxDegree = Math.max(...Object.values(centrality));
    if (maxDegree > 0) {
      Object.keys(centrality).forEach(id => {
        centrality[id] /= maxDegree;
      });
    }

    return centrality;
  }

  // Simple PageRank implementation
  calculatePageRank(nodes: GraphNode[], damping = 0.85, iterations = 100): Record<string, number> {
    const pageRank: Record<string, number> = {};
    const nodeCount = nodes.length;
    
    // Initialize with equal probability
    nodes.forEach(node => {
      pageRank[node.id] = 1 / nodeCount;
    });

    // Create adjacency information
    const inLinks: Record<string, string[]> = {};
    const outDegree: Record<string, number> = {};
    
    nodes.forEach(node => {
      inLinks[node.id] = [];
      outDegree[node.id] = node.edges.length;
    });

    nodes.forEach(node => {
      node.edges.forEach(targetId => {
        if (inLinks[targetId]) {
          inLinks[targetId].push(node.id);
        }
      });
    });

    // Iterate PageRank algorithm
    for (let i = 0; i < iterations; i++) {
      const newPageRank: Record<string, number> = {};
      
      nodes.forEach(node => {
        let rank = (1 - damping) / nodeCount;
        
        inLinks[node.id].forEach(sourceId => {
          if (outDegree[sourceId] > 0) {
            rank += damping * (pageRank[sourceId] / outDegree[sourceId]);
          }
        });
        
        newPageRank[node.id] = rank;
      });
      
      Object.assign(pageRank, newPageRank);
    }

    return pageRank;
  }

  // Calculate clustering coefficient
  calculateClusteringCoefficient(nodes: GraphNode[]): Record<string, number> {
    const clustering: Record<string, number> = {};
    
    // Create adjacency map
    const adjacency: Record<string, Set<string>> = {};
    nodes.forEach(node => {
      adjacency[node.id] = new Set(node.edges);
    });

    nodes.forEach(node => {
      const neighbors = Array.from(adjacency[node.id]);
      const k = neighbors.length;
      
      if (k < 2) {
        clustering[node.id] = 0;
        return;
      }

      let triangles = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (adjacency[neighbors[i]].has(neighbors[j])) {
            triangles++;
          }
        }
      }

      clustering[node.id] = (2 * triangles) / (k * (k - 1));
    });

    return clustering;
  }

  // Simple community detection using label propagation
  detectCommunities(nodes: GraphNode[], iterations = 10): Record<string, number> {
    const communities: Record<string, number> = {};
    
    // Initialize each node with unique community
    nodes.forEach((node, index) => {
      communities[node.id] = index;
    });

    // Create adjacency map
    const adjacency: Record<string, Set<string>> = {};
    nodes.forEach(node => {
      adjacency[node.id] = new Set(node.edges);
    });

    // Label propagation
    for (let iter = 0; iter < iterations; iter++) {
      const newCommunities = { ...communities };
      
      // Randomize order to avoid bias
      const shuffledNodes = [...nodes].sort(() => Math.random() - 0.5);
      
      shuffledNodes.forEach(node => {
        const neighborCommunities: Record<number, number> = {};
        
        // Count neighbor communities
        adjacency[node.id].forEach(neighborId => {
          const community = communities[neighborId];
          neighborCommunities[community] = (neighborCommunities[community] || 0) + 1;
        });

        // Find most frequent community
        let maxCount = 0;
        let bestCommunity = communities[node.id];
        
        Object.entries(neighborCommunities).forEach(([community, count]) => {
          if (count > maxCount) {
            maxCount = count;
            bestCommunity = parseInt(community);
          }
        });

        newCommunities[node.id] = bestCommunity;
      });
      
      Object.assign(communities, newCommunities);
    }

    return communities;
  }

  // Find shortest path between two nodes (BFS)
  findShortestPath(nodes: GraphNode[], startId: string, endId: string): string[] | null {
    if (startId === endId) return [startId];

    const adjacency: Record<string, Set<string>> = {};
    nodes.forEach(node => {
      adjacency[node.id] = new Set(node.edges);
    });

    const queue = [startId];
    const visited = new Set([startId]);
    const parent: Record<string, string> = {};

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === endId) {
        // Reconstruct path
        const path = [];
        let node = endId;
        while (node !== startId) {
          path.unshift(node);
          node = parent[node];
        }
        path.unshift(startId);
        return path;
      }

      adjacency[current].forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent[neighbor] = current;
          queue.push(neighbor);
        }
      });
    }

    return null; // No path found
  }

  // Detect anomalous nodes based on graph metrics
  detectAnomalousNodes(nodes: GraphNode[]): Array<{ nodeId: string; anomalyScore: number; reasons: string[] }> {
    const degreeCentrality = this.calculateDegreeCentrality(nodes);
    const pageRank = this.calculatePageRank(nodes);
    const clustering = this.calculateClusteringCoefficient(nodes);
    const communities = this.detectCommunities(nodes);

    const anomalies: Array<{ nodeId: string; anomalyScore: number; reasons: string[] }> = [];

    nodes.forEach(node => {
      const reasons: string[] = [];
      let anomalyScore = 0;

      // High degree centrality anomaly
      if (degreeCentrality[node.id] > 0.8) {
        anomalyScore += 0.3;
        reasons.push('Unusually high connectivity');
      }

      // High PageRank anomaly
      if (pageRank[node.id] > 0.1) {
        anomalyScore += 0.4;
        reasons.push('High influence in network');
      }

      // Low clustering with high degree (hub-like behavior)
      if (degreeCentrality[node.id] > 0.5 && clustering[node.id] < 0.2) {
        anomalyScore += 0.3;
        reasons.push('Hub-like connectivity pattern');
      }

      // Isolated community detection
      const communitySize = Object.values(communities).filter(c => c === communities[node.id]).length;
      if (communitySize === 1 && degreeCentrality[node.id] > 0.1) {
        anomalyScore += 0.2;
        reasons.push('Isolated from main network');
      }

      if (anomalyScore > 0.5) {
        anomalies.push({
          nodeId: node.id,
          anomalyScore: Math.min(1, anomalyScore),
          reasons
        });
      }
    });

    return anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore);
  }

  // Generate node embeddings using simple random walk
  generateNodeEmbeddings(nodes: GraphNode[], dimensions = 64): Record<string, number[]> {
    const embeddings: Record<string, number[]> = {};
    
    // Initialize random embeddings
    nodes.forEach(node => {
      embeddings[node.id] = Array.from({ length: dimensions }, () => Math.random() - 0.5);
    });

    // Simple embedding update based on neighbor similarity
    const iterations = 100;
    const learningRate = 0.01;

    for (let iter = 0; iter < iterations; iter++) {
      nodes.forEach(node => {
        const nodeEmbedding = embeddings[node.id];
        
        node.edges.forEach(neighborId => {
          if (embeddings[neighborId]) {
            const neighborEmbedding = embeddings[neighborId];
            
            // Move embeddings closer together
            for (let i = 0; i < dimensions; i++) {
              const diff = neighborEmbedding[i] - nodeEmbedding[i];
              nodeEmbedding[i] += learningRate * diff;
            }
          }
        });
      });
    }

    return embeddings;
  }
}

export const graphAnalysisService = new GraphAnalysisService();

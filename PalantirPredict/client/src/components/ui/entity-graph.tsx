import { useEffect, useRef } from 'react';
import type { GraphData } from '@/lib/types';

interface EntityGraphProps {
  graphData: GraphData;
  selectedEntityId?: string;
  onNodeClick?: (entityId: string) => void;
  className?: string;
  height?: number;
}

export function EntityGraph({ 
  graphData, 
  selectedEntityId, 
  onNodeClick, 
  className, 
  height = 200 
}: EntityGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !window.cytoscape) return;

    // Clean up previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const container = containerRef.current;
    
    // Prepare nodes and edges for Cytoscape
    const elements = [
      // Nodes
      ...graphData.entities.map(entity => ({
        data: {
          id: entity.id,
          label: entity.pseudonymousId,
          riskScore: entity.riskScore || 0,
          isSelected: entity.id === selectedEntityId
        }
      })),
      // Edges
      ...graphData.edges.map(edge => ({
        data: {
          id: `${edge.sourceEntityId}-${edge.targetEntityId}`,
          source: edge.sourceEntityId,
          target: edge.targetEntityId,
          weight: edge.weight || 1
        }
      }))
    ];

    cyRef.current = window.cytoscape({
      container,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => {
              const riskScore = ele.data('riskScore');
              if (riskScore >= 90) return 'hsl(var(--destructive))';
              if (riskScore >= 70) return 'hsl(var(--secondary))';
              if (riskScore >= 40) return 'hsl(var(--chart-3))';
              return 'hsl(var(--primary))';
            },
            'label': 'data(label)',
            'text-valign': 'center',
            'color': 'hsl(var(--foreground))',
            'font-size': '10px',
            'font-family': 'var(--font-mono)',
            'width': (ele: any) => Math.max(20, 20 + (ele.data('riskScore') || 0) / 10),
            'height': (ele: any) => Math.max(20, 20 + (ele.data('riskScore') || 0) / 10),
            'border-width': (ele: any) => ele.data('isSelected') ? 3 : 1,
            'border-color': 'hsl(var(--ring))',
            'transition-property': 'background-color, border-width',
            'transition-duration': '0.3s'
          }
        },
        {
          selector: 'edge',
          style: {
            'line-color': 'hsl(var(--border))',
            'width': (ele: any) => Math.max(1, (ele.data('weight') || 1) * 2),
            'curve-style': 'bezier',
            'opacity': 0.6
          }
        },
        {
          selector: 'node:hover',
          style: {
            'border-width': 3,
            'border-color': 'hsl(var(--ring))'
          }
        },
        {
          selector: '.high-risk',
          style: {
            'background-color': 'hsl(var(--destructive))',
            'border-color': 'hsl(var(--destructive))'
          }
        }
      ],
      layout: {
        name: 'circle',
        radius: Math.min(height * 0.3, 60),
        spacing: 1.5
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      minZoom: 0.5,
      maxZoom: 3
    });

    // Add event listeners
    cyRef.current.on('tap', 'node', (evt: any) => {
      const node = evt.target;
      const entityId = node.data('id');
      
      if (onNodeClick) {
        onNodeClick(entityId);
      }
    });

    // Add hover effects
    cyRef.current.on('mouseover', 'node', (evt: any) => {
      const node = evt.target;
      node.addClass('hover');
      
      // Highlight connected edges
      node.connectedEdges().style({
        'line-color': 'hsl(var(--primary))',
        'opacity': 1
      });
    });

    cyRef.current.on('mouseout', 'node', (evt: any) => {
      const node = evt.target;
      node.removeClass('hover');
      
      // Reset connected edges
      node.connectedEdges().style({
        'line-color': 'hsl(var(--border))',
        'opacity': 0.6
      });
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [graphData, selectedEntityId, onNodeClick, height]);

  // Load Cytoscape if not available
  useEffect(() => {
    if (!window.cytoscape) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/cytoscape@3.26.0/dist/cytoscape.min.js';
      script.async = true;
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ height }}
      data-testid="entity-graph"
    />
  );
}

// Extend window type for Cytoscape
declare global {
  interface Window {
    cytoscape: any;
  }
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RiskGauge } from '@/components/ui/risk-gauge';
import { EntityGraph } from '@/components/ui/entity-graph';
import { ExternalLink, Clock, Check, X, ArrowUp, Wifi, WifiOff, Database, Shield } from 'lucide-react';
import type { Entity, Alert, Event, GraphData, AnalystAction } from '@/lib/types';

interface RightPanelProps {
  selectedEntity?: Entity | null;
  selectedAlert?: Alert | null;
  entityDetails?: any;
  analystNotes: string;
  onAnalystNotesChange: (notes: string) => void;
  onAnalystAction: (action: AnalystAction['action']) => void;
  isUpdating: boolean;
  isConnected: boolean;
}

export function RightPanel({
  selectedEntity,
  selectedAlert,
  entityDetails,
  analystNotes,
  onAnalystNotesChange,
  onAnalystAction,
  isUpdating,
  isConnected
}: RightPanelProps) {
  const [selectedGraphEntity, setSelectedGraphEntity] = useState<string | undefined>();

  // Get graph data for visualization
  const { data: graphData } = useQuery<GraphData>({
    queryKey: ['/api/graph'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const formatTimeAgo = (date: Date | string | undefined) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getEntityIcon = (riskScore: number) => {
    if (riskScore >= 90) return '⚠️';
    if (riskScore >= 70) return '🔥';
    if (riskScore >= 40) return '⚡';
    return '🔵';
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 90) return 'text-destructive';
    if (riskScore >= 70) return 'text-secondary';
    if (riskScore >= 40) return 'text-chart-3';
    return 'text-accent';
  };

  const entity = selectedEntity || (selectedAlert?.entityId ? { id: selectedAlert.entityId } as Entity : null);
  const displayEntity = entityDetails?.entity || entity;

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      {/* Connection Status */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3 text-accent" />
              <span className="text-xs text-accent">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {!displayEntity && !selectedAlert ? (
        <div className="flex-1 p-4 space-y-4">
          {/* Placeholder Entity Card */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Entity Profile</h3>
              <div className="text-xs text-muted-foreground">Demo Mode</div>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg">
                🔍
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">
                  No Entity Selected
                </h4>
                <p className="text-xs text-muted-foreground">
                  Select an alert or event to view details
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder Risk Assessment */}
          <div className="p-4 border-b border-border">
            <h4 className="text-sm font-medium mb-3">Risk Assessment</h4>
            <div className="flex items-center justify-between mb-4">
              <RiskGauge 
                value={0} 
                size={100}
                data-testid="risk-gauge-placeholder"
              />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">Never</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Events</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="p-4 border-b border-border">
            <h4 className="text-sm font-medium mb-3">System Status</h4>
            <div className="space-y-3">
              <Card className="bg-background p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    ML Analysis Engine
                  </span>
                  <span className="text-xs font-medium text-accent">
                    Active
                  </span>
                </div>
                <p className="text-sm">System ready for data ingestion</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Last sync: {new Date().toLocaleTimeString()}
                </div>
              </Card>
              
              <Card className="bg-background p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Graph Analytics
                  </span>
                  <span className="text-xs font-medium text-accent">
                    Standby
                  </span>
                </div>
                <p className="text-sm">Awaiting entity relationships</p>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4">
            <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full text-xs justify-start"
                data-testid="button-view-all-entities"
              >
                <Database className="mr-2 h-3 w-3" />
                View All Entities
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs justify-start"
                data-testid="button-system-health"
              >
                <Shield className="mr-2 h-3 w-3" />
                System Health Check
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Entity Header */}
          {displayEntity && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Entity Profile</h3>
                <Button variant="ghost" size="sm" data-testid="button-external-link">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg">
                  {getEntityIcon(displayEntity.riskScore || 0)}
                </div>
                <div>
                  <h4 className="font-medium text-sm" data-testid="text-entity-id">
                    #{displayEntity.pseudonymousId || displayEntity.id?.substring(0, 8)}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {displayEntity.riskScore >= 90 ? 'Critical Risk' :
                     displayEntity.riskScore >= 70 ? 'High Risk' :
                     displayEntity.riskScore >= 40 ? 'Medium Risk' : 'Low Risk'} Entity
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          {displayEntity && (
            <div className="p-4 border-b border-border">
              <h4 className="text-sm font-medium mb-3">Risk Assessment</h4>
              <div className="flex items-center justify-between mb-4">
                <RiskGauge 
                  value={displayEntity.riskScore || 0} 
                  size={100}
                  data-testid="risk-gauge-entity"
                />
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">
                      {Math.round((displayEntity.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium">
                      {formatTimeAgo(displayEntity.updatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Events</span>
                    <span className="font-medium">
                      {entityDetails?.events?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Evidence/Alert Details */}
          {selectedAlert && (
            <div className="p-4 border-b border-border">
              <h4 className="text-sm font-medium mb-3">Alert Evidence</h4>
              <div className="space-y-3">
                {selectedAlert.evidence?.slice(0, 3).map((evidence, index) => (
                  <Card key={index} className="bg-background p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground capitalize">
                        {evidence.type.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-medium ${getRiskColor(evidence.weight * 100)}`}>
                        +{Math.round(evidence.weight * 100)}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{evidence.value}</p>
                    <div className="mt-2 flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{formatTimeAgo(evidence.timestamp)}</span>
                    </div>
                  </Card>
                ))}
                
                {(!selectedAlert.evidence || selectedAlert.evidence.length === 0) && (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    No evidence available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Entity Graph */}
          {graphData && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Relationship Graph</h4>
                <Button variant="ghost" size="sm" data-testid="button-expand-graph">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="bg-background rounded-lg h-48 relative overflow-hidden">
                <EntityGraph
                  graphData={graphData}
                  selectedEntityId={selectedGraphEntity}
                  onNodeClick={setSelectedGraphEntity}
                  height={192}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Analyst Actions */}
          {selectedAlert && (
            <div className="flex-1 p-4">
              <h4 className="text-sm font-medium mb-3">Analyst Actions</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => onAnalystAction('confirm')}
                    disabled={isUpdating || selectedAlert.status !== 'pending'}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    data-testid="button-confirm-alert"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Confirm
                  </Button>
                  <Button
                    onClick={() => onAnalystAction('dismiss')}
                    disabled={isUpdating || selectedAlert.status !== 'pending'}
                    variant="secondary"
                    data-testid="button-dismiss-alert"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Dismiss
                  </Button>
                </div>
                
                <Button
                  onClick={() => onAnalystAction('escalate')}
                  disabled={isUpdating || selectedAlert.status !== 'pending'}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  data-testid="button-escalate-alert"
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Escalate
                </Button>

                <div className="mt-4">
                  <label className="text-xs text-muted-foreground mb-2 block">
                    Analyst Notes
                  </label>
                  <Textarea
                    value={analystNotes}
                    onChange={(e) => onAnalystNotesChange(e.target.value)}
                    placeholder="Add investigation notes..."
                    className="resize-none h-20 text-sm"
                    disabled={isUpdating}
                    data-testid="textarea-analyst-notes"
                  />
                </div>

                {selectedAlert.status !== 'pending' && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <div className="text-xs text-muted-foreground">
                      <Badge variant="secondary" className="mb-2">
                        {(selectedAlert.status || 'pending').toUpperCase()}
                      </Badge>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Reviewed by:</span>
                          <span className="font-medium">
                            {selectedAlert.reviewedBy || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Review date:</span>
                          <span className="font-medium">
                            {formatTimeAgo(selectedAlert.reviewedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Session ID:</span>
                    <span className="font-mono">#S-2024-001</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Analyst ID:</span>
                    <span className="font-medium">Analyst_007</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timestamp:</span>
                    <span className="font-mono">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

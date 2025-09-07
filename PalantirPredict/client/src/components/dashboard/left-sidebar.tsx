import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Rss, Database, Shield, Zap, ZapOff } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Alert } from '@/lib/types';

interface LeftSidebarProps {
  onUploadClick: () => void;
  onAlertClick: (alert: Alert) => void;
  selectedAlertId?: string;
}

export function LeftSidebar({ onUploadClick, onAlertClick, selectedAlertId }: LeftSidebarProps) {
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('24h');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [mockDataRunning, setMockDataRunning] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Seed mock data mutation
  const seedMockDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/mock/seed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Mock Data Seeded',
        description: 'Initial mock data has been generated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/entities'] });
    },
    onError: (error) => {
      toast({
        title: 'Seeding Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Start/Stop realtime mock data
  const toggleMockDataMutation = useMutation({
    mutationFn: async (start: boolean) => {
      const endpoint = start ? '/api/mock/start' : '/api/mock/stop';
      const response = await apiRequest('POST', endpoint);
      return response.json();
    },
    onSuccess: (data, start) => {
      setMockDataRunning(start);
      toast({
        title: start ? 'Mock Data Started' : 'Mock Data Stopped',
        description: start ? 'Realtime events are now being generated' : 'Realtime generation has been stopped'
      });
    },
    onError: (error) => {
      toast({
        title: 'Operation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const filteredAlerts = alerts.filter(alert => {
    if (riskFilter !== 'all') {
      const ranges: Record<string, [number, number]> = {
        'critical': [90, 100],
        'high': [70, 89],
        'medium': [40, 69],
        'low': [0, 39]
      };
      const [min, max] = ranges[riskFilter] || [0, 100];
      if (alert.riskScore < min || alert.riskScore > max) return false;
    }
    
    if (timeFilter !== 'all') {
      const hours = parseInt(timeFilter.replace('h', ''));
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      if (new Date(alert.createdAt!) < cutoff) return false;
    }
    
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-destructive/10 border-destructive/30';
      case 'HIGH': return 'bg-secondary/10 border-secondary/30';
      case 'MEDIUM': return 'bg-muted/30 border-muted';
      default: return 'bg-accent/10 border-accent/30';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-destructive';
      case 'HIGH': return 'text-secondary';
      case 'MEDIUM': return 'text-muted-foreground';
      default: return 'text-accent';
    }
  };

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

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Intelligence Portal</h1>
            <p className="text-xs text-muted-foreground">Predictive Analytics</p>
          </div>
        </div>
      </div>

      {/* Data Ingestion Controls */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium mb-3">Data Ingestion</h3>
        <div className="space-y-2">
          <Button 
            onClick={onUploadClick}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-upload-csv"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV Data
          </Button>
          <div className="flex space-x-2">
            <Button 
              variant="secondary" 
              className="flex-1 text-xs"
              data-testid="button-rss"
            >
              <Rss className="mr-1 h-3 w-3" />
              RSS
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 text-xs"
              data-testid="button-api"
            >
              <Database className="mr-1 h-3 w-3" />
              API
            </Button>
          </div>
          
          {/* Mock Data Controls */}
          <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-muted">
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">Demo Data</h4>
            <div className="space-y-2">
              <Button 
                onClick={() => seedMockDataMutation.mutate()}
                disabled={seedMockDataMutation.isPending}
                variant="outline"
                className="w-full text-xs"
                data-testid="button-seed-mock"
              >
                <Database className="mr-1 h-3 w-3" />
                {seedMockDataMutation.isPending ? 'Seeding...' : 'Seed Data'}
              </Button>
              
              <Button 
                onClick={() => toggleMockDataMutation.mutate(!mockDataRunning)}
                disabled={toggleMockDataMutation.isPending}
                variant={mockDataRunning ? "destructive" : "default"}
                className="w-full text-xs"
                data-testid="button-toggle-mock"
              >
                {mockDataRunning ? (
                  <>
                    <ZapOff className="mr-1 h-3 w-3" />
                    Stop Live
                  </>
                ) : (
                  <>
                    <Zap className="mr-1 h-3 w-3" />
                    Start Live
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium mb-3">Filters</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Risk Level</label>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full" data-testid="select-risk-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical (90-100)</SelectItem>
                <SelectItem value="high">High (70-89)</SelectItem>
                <SelectItem value="medium">Medium (40-69)</SelectItem>
                <SelectItem value="low">Low (0-39)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Time Range</label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full" data-testid="select-time-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="168h">Last 7 Days</SelectItem>
                <SelectItem value="720h">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Event Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full" data-testid="select-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="network">Network Anomaly</SelectItem>
                <SelectItem value="text">Text Analysis</SelectItem>
                <SelectItem value="transaction">Transaction Pattern</SelectItem>
                <SelectItem value="behavioral">Behavioral Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alert Queue */}
      <div className="flex-1 p-4 overflow-hidden">
        <h3 className="text-sm font-medium mb-3">Alert Queue ({filteredAlerts.length})</h3>
        <div className="space-y-2 scrollbar-thin overflow-y-auto h-full">
          {filteredAlerts.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No alerts match current filters
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedAlertId === alert.id ? 'ring-2 ring-primary' : ''
                } ${getPriorityColor(alert.priority)}`}
                onClick={() => onAlertClick(alert)}
                data-testid={`alert-card-${alert.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    alert.priority === 'CRITICAL' ? 'bg-destructive text-destructive-foreground' :
                    alert.priority === 'HIGH' ? 'bg-secondary text-secondary-foreground' :
                    alert.priority === 'MEDIUM' ? 'bg-muted text-muted-foreground' :
                    'bg-accent/20 text-accent'
                  }`}>
                    {alert.priority}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(alert.createdAt)}
                  </span>
                </div>
                
                <h4 className="text-sm font-medium mb-1 line-clamp-2">
                  {alert.title}
                </h4>
                
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {alert.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-medium ${getPriorityTextColor(alert.priority)}`}>
                    Risk: {Math.round(alert.riskScore)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Entity: {alert.entityId?.substring(0, 8) || 'Unknown'}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

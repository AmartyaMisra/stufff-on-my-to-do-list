import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { LeftSidebar } from '@/components/dashboard/left-sidebar';
import { MainContent } from '@/components/dashboard/main-content';
import { RightPanel } from '@/components/dashboard/right-panel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Alert, Event, Entity, AnalystAction } from '@/lib/types';

export default function Dashboard() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [analystNotes, setAnalystNotes] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // WebSocket connection for real-time updates
  const { lastMessage, isConnected } = useWebSocket();

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'new_alert':
          queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
          if (lastMessage.alert) {
            toast({
              title: 'New Alert',
              description: lastMessage.alert.title,
              variant: lastMessage.alert.priority === 'CRITICAL' ? 'destructive' : 'default'
            });
          }
          break;
        case 'alert_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
          break;
        case 'event_processed':
          queryClient.invalidateQueries({ queryKey: ['/api/events'] });
          queryClient.invalidateQueries({ queryKey: ['/api/events/recent/24'] });
          break;
      }
    }
  }, [lastMessage, queryClient, toast]);

  // Get entity details when selected
  const { data: entityDetails } = useQuery({
    queryKey: ['/api/entities', selectedEntity?.id],
    enabled: !!selectedEntity?.id
  });

  // Upload CSV mutation
  const uploadCsvMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {} as Record<string, string>);
      });

      const response = await apiRequest('POST', '/api/upload/csv', { data: rows });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload Successful',
        description: `Processed ${data.processed} events`
      });
      setShowUploadDialog(false);
      setCsvContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update alert mutation
  const updateAlertMutation = useMutation({
    mutationFn: async ({ alertId, action, notes }: { alertId: string; action: AnalystAction['action']; notes?: string }) => {
      const status = action === 'confirm' ? 'confirmed' : action === 'dismiss' ? 'dismissed' : 'escalated';
      const response = await apiRequest('PATCH', `/api/alerts/${alertId}`, {
        status,
        notes,
        reviewedBy: 'Analyst_007' // In production, this would be the actual user ID
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Alert Updated',
        description: 'Alert status has been updated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      setAnalystNotes('');
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setAnalystNotes(alert.notes || '');
    
    // Load associated entity if available
    if (alert.entityId) {
      queryClient.fetchQuery({
        queryKey: ['/api/entities', alert.entityId]
      }).then((entityData: any) => {
        setSelectedEntity(entityData.entity);
      });
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    
    // Load associated entity if available
    if (event.entityId) {
      queryClient.fetchQuery({
        queryKey: ['/api/entities', event.entityId]
      }).then((entityData: any) => {
        setSelectedEntity(entityData.entity);
      });
    }
  };

  const handleAnalystAction = (action: AnalystAction['action']) => {
    if (!selectedAlert) return;
    
    updateAlertMutation.mutate({
      alertId: selectedAlert.id,
      action,
      notes: analystNotes
    });
  };

  const handleUploadCsv = () => {
    if (!csvContent.trim()) {
      toast({
        title: 'No Data',
        description: 'Please enter CSV data to upload',
        variant: 'destructive'
      });
      return;
    }
    
    uploadCsvMutation.mutate(csvContent);
  };

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <LeftSidebar
        onUploadClick={() => setShowUploadDialog(true)}
        onAlertClick={handleAlertClick}
        selectedAlertId={selectedAlert?.id}
      />

      {/* Main Content */}
      <MainContent
        onEventClick={handleEventClick}
        selectedEventId={selectedEvent?.id}
      />

      {/* Right Panel */}
      <RightPanel
        selectedEntity={selectedEntity}
        selectedAlert={selectedAlert}
        entityDetails={entityDetails}
        analystNotes={analystNotes}
        onAnalystNotesChange={setAnalystNotes}
        onAnalystAction={handleAnalystAction}
        isUpdating={updateAlertMutation.isPending}
        isConnected={isConnected}
      />

      {/* CSV Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload CSV Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-content">CSV Data</Label>
              <Textarea
                id="csv-content"
                placeholder="timestamp,source,type,text,email,phone&#10;2024-01-01T12:00:00Z,social_media,text_analysis,suspicious message,user@example.com,1234567890"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="min-h-32 font-mono text-sm"
                data-testid="textarea-csv-content"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: timestamp,source,type,text,email,phone (first line should be headers)
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadCsv}
                disabled={uploadCsvMutation.isPending}
                data-testid="button-submit-upload"
              >
                {uploadCsvMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

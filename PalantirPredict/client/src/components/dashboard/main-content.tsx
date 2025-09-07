import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { TimelineChart } from '@/components/ui/timeline-chart';
import type { Event, TimelineEvent } from '@/lib/types';

interface MainContentProps {
  onEventClick: (event: Event) => void;
  selectedEventId?: string;
}

export function MainContent({ onEventClick, selectedEventId }: MainContentProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    refetchInterval: isPlaying ? 3000 : false // Refresh every 3 seconds when playing
  });

  const { data: recentEvents = [] } = useQuery<Event[]>({
    queryKey: ['/api/events/recent/24'],
    refetchInterval: isPlaying ? 5000 : false
  });

  // Convert events to timeline format
  const timelineEvents: TimelineEvent[] = recentEvents.map(event => ({
    id: event.id,
    timestamp: new Date(event.timestamp),
    riskScore: event.riskScore || 0,
    priority: event.riskScore && event.riskScore >= 90 ? 'CRITICAL' :
              event.riskScore && event.riskScore >= 70 ? 'HIGH' :
              event.riskScore && event.riskScore >= 40 ? 'MEDIUM' : 'LOW',
    title: event.text?.substring(0, 50) || `${event.type} event`,
    entityId: event.entityId
  }));

  const formatTimestamp = (timestamp: Date | string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getPriorityBadge = (riskScore: number) => {
    if (riskScore >= 90) return { text: 'CRITICAL', class: 'bg-destructive text-destructive-foreground' };
    if (riskScore >= 70) return { text: 'HIGH', class: 'bg-secondary text-secondary-foreground' };
    if (riskScore >= 40) return { text: 'MEDIUM', class: 'bg-muted text-muted-foreground' };
    return { text: 'LOW', class: 'bg-accent/20 text-accent' };
  };

  const getEventBorderClass = (riskScore: number) => {
    if (riskScore >= 90) return 'border-destructive/30';
    if (riskScore >= 70) return 'border-secondary/30';
    if (riskScore >= 40) return 'border-muted';
    return 'border-accent/30';
  };

  const highlightRiskTokens = (text: string) => {
    if (!text) return '';
    
    const riskTokens = ['attack', 'bomb', 'hack', 'threat', 'coordinate', 'exploit', 'breach'];
    let highlightedText = text;
    
    riskTokens.forEach(token => {
      const regex = new RegExp(`\\b${token}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<span class="evidence-token">${token}</span>`);
    });
    
    return highlightedText;
  };

  const handleTimelineEventClick = (timelineEvent: TimelineEvent) => {
    const event = events.find(e => e.id === timelineEvent.id);
    if (event) {
      onEventClick(event);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top Bar */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium">Live Intelligence Feed</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-accent animate-pulse-slow' : 'bg-muted'}`} />
            <span className="text-sm text-muted-foreground">
              {isPlaying ? 'Real-time monitoring active' : 'Monitoring paused'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            data-testid={isPlaying ? "button-pause" : "button-play"}
          >
            {isPlaying ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Play
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="button-replay"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Replay
          </Button>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Event Timeline</h3>
          <div className="text-xs text-muted-foreground">Last 24 Hours</div>
        </div>
        
        <div className="bg-background rounded-lg overflow-hidden">
          <TimelineChart 
            events={timelineEvents}
            height={96}
            onEventClick={handleTimelineEventClick}
            className="w-full"
          />
        </div>
      </div>

      {/* Event Feed */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="space-y-3 scrollbar-thin overflow-y-auto h-full">
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <div className="text-lg mb-2">No events detected</div>
              <div className="text-sm">Upload data or connect sources to begin analysis</div>
            </div>
          ) : (
            events.map((event) => {
              const priority = getPriorityBadge(event.riskScore || 0);
              const isSelected = selectedEventId === event.id;
              
              return (
                <Card
                  key={event.id}
                  className={`p-4 cursor-pointer transition-all hover:bg-card/80 ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  } ${getEventBorderClass(event.riskScore || 0)}`}
                  onClick={() => onEventClick(event)}
                  data-testid={`event-card-${event.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${priority.class}`}>
                        {priority.text}
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatTimestamp(event.timestamp)} UTC
                      </span>
                    </div>
                    <span className="text-xl font-bold" style={{
                      color: event.riskScore && event.riskScore >= 90 ? 'hsl(var(--destructive))' :
                             event.riskScore && event.riskScore >= 70 ? 'hsl(var(--secondary))' :
                             'hsl(var(--muted-foreground))'
                    }}>
                      {Math.round(event.riskScore || 0)}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-medium mb-2 capitalize">
                    {event.type.replace('_', ' ')} Event Detected
                  </h4>
                  
                  {event.text && (
                    <div 
                      className="text-sm text-muted-foreground mb-3"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightRiskTokens(event.text.substring(0, 200) + (event.text.length > 200 ? '...' : ''))
                      }}
                    />
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Source: <span className="text-primary">{event.source}</span>
                      {event.entityId && (
                        <>
                          {' • '}Entity: <span className="text-primary">#{event.entityId.substring(0, 8)}</span>
                        </>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

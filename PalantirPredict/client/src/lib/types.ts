export interface Entity {
  id: string;
  canonicalHash: string;
  pseudonymousId: string;
  attributes?: Record<string, any>;
  riskScore?: number;
  confidence?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Event {
  id: string;
  timestamp: Date;
  source: string;
  entityId?: string;
  type: string;
  text?: string;
  metadata?: Record<string, any>;
  riskScore?: number;
  processed?: boolean;
  createdAt?: Date;
}

export interface Alert {
  id: string;
  entityId?: string;
  eventId?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  riskScore: number;
  confidence: number;
  evidence?: Array<{
    type: string;
    value: string;
    weight: number;
    timestamp: string;
  }>;
  status?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  createdAt?: Date;
}

export interface GraphData {
  entities: Entity[];
  edges: Array<{
    id: string;
    sourceEntityId: string;
    targetEntityId: string;
    relationshipType: string;
    weight?: number;
    metadata?: Record<string, any>;
  }>;
  metrics?: {
    degreeCentrality: Record<string, number>;
    pageRank: Record<string, number>;
    communities: Record<string, number>;
  };
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  riskScore: number;
  priority: string;
  title: string;
  entityId?: string;
}

export interface AnalystAction {
  action: 'confirm' | 'dismiss' | 'escalate';
  alertId: string;
  notes?: string;
}

export interface WebSocketMessage {
  type: 'new_alert' | 'alert_updated' | 'event_processed' | 'connection_status';
  data?: any;
  alert?: Alert;
  eventId?: string;
  riskScore?: number;
}

import { type Entity, type InsertEntity, type Event, type InsertEvent, type Alert, type InsertAlert, type AuditLog, type InsertAuditLog, type GraphEdge, type InsertGraphEdge } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Entities
  getEntity(id: string): Promise<Entity | undefined>;
  getEntityByHash(hash: string): Promise<Entity | undefined>;
  createEntity(entity: InsertEntity): Promise<Entity>;
  updateEntity(id: string, updates: Partial<Entity>): Promise<Entity | undefined>;
  getEntities(limit?: number): Promise<Entity[]>;

  // Events
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined>;
  getEvents(limit?: number, entityId?: string): Promise<Event[]>;
  getRecentEvents(hours: number): Promise<Event[]>;

  // Alerts
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlerts(status?: string, priority?: string): Promise<Alert[]>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(userId?: string, sessionId?: string): Promise<AuditLog[]>;

  // Graph Edges
  createGraphEdge(edge: InsertGraphEdge): Promise<GraphEdge>;
  getEntityEdges(entityId: string): Promise<GraphEdge[]>;
  getGraphData(): Promise<{ entities: Entity[], edges: GraphEdge[] }>;
}

export class MemStorage implements IStorage {
  private entities: Map<string, Entity> = new Map();
  private events: Map<string, Event> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private graphEdges: Map<string, GraphEdge> = new Map();

  async getEntity(id: string): Promise<Entity | undefined> {
    return this.entities.get(id);
  }

  async getEntityByHash(hash: string): Promise<Entity | undefined> {
    return Array.from(this.entities.values()).find(e => e.canonicalHash === hash);
  }

  async createEntity(insertEntity: InsertEntity): Promise<Entity> {
    const id = randomUUID();
    const entity: Entity = {
      ...insertEntity,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      attributes: insertEntity.attributes || null,
      riskScore: insertEntity.riskScore || 0,
      confidence: insertEntity.confidence || 0
    };
    this.entities.set(id, entity);
    return entity;
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity | undefined> {
    const entity = this.entities.get(id);
    if (!entity) return undefined;
    
    const updated = { ...entity, ...updates, updatedAt: new Date() };
    this.entities.set(id, updated);
    return updated;
  }

  async getEntities(limit = 100): Promise<Entity[]> {
    return Array.from(this.entities.values()).slice(0, limit);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      ...insertEvent,
      id,
      createdAt: new Date(),
      metadata: insertEvent.metadata || null,
      text: insertEvent.text || null,
      riskScore: insertEvent.riskScore || 0,
      processed: insertEvent.processed || false,
      entityId: insertEvent.entityId || null
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updated = { ...event, ...updates };
    this.events.set(id, updated);
    return updated;
  }

  async getEvents(limit = 100, entityId?: string): Promise<Event[]> {
    let events = Array.from(this.events.values());
    if (entityId) {
      events = events.filter(e => e.entityId === entityId);
    }
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getRecentEvents(hours: number): Promise<Event[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.events.values())
      .filter(e => new Date(e.timestamp) >= cutoff)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = {
      ...insertAlert,
      id,
      createdAt: new Date(),
      status: insertAlert.status || 'pending',
      entityId: insertAlert.entityId || null,
      eventId: insertAlert.eventId || null,
      reviewedBy: insertAlert.reviewedBy || null,
      reviewedAt: insertAlert.reviewedAt || null,
      notes: insertAlert.notes || null
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async getAlerts(status?: string, priority?: string): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());
    if (status) {
      alerts = alerts.filter(a => a.status === status);
    }
    if (priority) {
      alerts = alerts.filter(a => a.priority === priority);
    }
    return alerts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updated = { ...alert, ...updates };
    this.alerts.set(id, updated);
    return updated;
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
      details: insertLog.details || null,
      entityId: insertLog.entityId || null,
      alertId: insertLog.alertId || null
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogs(userId?: string, sessionId?: string): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values());
    if (userId) {
      logs = logs.filter(l => l.userId === userId);
    }
    if (sessionId) {
      logs = logs.filter(l => l.sessionId === sessionId);
    }
    return logs.sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async createGraphEdge(insertEdge: InsertGraphEdge): Promise<GraphEdge> {
    const id = randomUUID();
    const edge: GraphEdge = {
      ...insertEdge,
      id,
      createdAt: new Date(),
      metadata: insertEdge.metadata || null,
      weight: insertEdge.weight || 1,
      sourceEntityId: insertEdge.sourceEntityId || null,
      targetEntityId: insertEdge.targetEntityId || null
    };
    this.graphEdges.set(id, edge);
    return edge;
  }

  async getEntityEdges(entityId: string): Promise<GraphEdge[]> {
    return Array.from(this.graphEdges.values())
      .filter(e => e.sourceEntityId === entityId || e.targetEntityId === entityId);
  }

  async getGraphData(): Promise<{ entities: Entity[], edges: GraphEdge[] }> {
    return {
      entities: Array.from(this.entities.values()),
      edges: Array.from(this.graphEdges.values())
    };
  }
}

export const storage = new MemStorage();

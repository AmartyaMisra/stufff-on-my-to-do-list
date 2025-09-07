import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import { mlAnalysisService } from "./services/mlAnalysis.js";
import { entityResolutionService } from "./services/entityResolution.js";
import { riskScoringService } from "./services/riskScoring.js";
import { graphAnalysisService } from "./services/graphAnalysis.js";
import { mockDataGenerator } from "./services/mockDataGenerator.js";
import { insertEventSchema, insertAlertSchema, insertAuditLogSchema } from "@shared/schema.js";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // Data Ingestion Endpoint
  app.post('/api/ingest', async (req, res) => {
    try {
      const rawData = req.body;
      
      // Log ingestion attempt
      await storage.createAuditLog({
        userId: req.headers['user-id'] as string || 'system',
        sessionId: req.headers['session-id'] as string || randomUUID(),
        action: 'data_ingestion',
        details: { source: rawData.source, type: rawData.type }
      });

      // Sanitize and resolve entity
      const sanitizedAttributes = entityResolutionService.sanitizeAttributes(rawData.attributes || {});
      const canonicalHash = entityResolutionService.createCanonicalHash(sanitizedAttributes);
      
      // Check for existing entity
      let entity = await storage.getEntityByHash(canonicalHash);
      if (!entity) {
        entity = await storage.createEntity({
          canonicalHash,
          pseudonymousId: entityResolutionService.createPseudonymousId(canonicalHash),
          attributes: sanitizedAttributes,
          riskScore: 0,
          confidence: 0
        });
      }

      // Create event
      const event = await storage.createEvent({
        timestamp: new Date(rawData.timestamp || Date.now()),
        source: rawData.source,
        entityId: entity.id,
        type: rawData.type,
        text: rawData.text,
        metadata: rawData.metadata || {},
        riskScore: 0,
        processed: false
      });

      // Process event asynchronously
      processEvent(event.id, broadcast);

      res.json({ success: true, eventId: event.id, entityId: entity.id });
    } catch (error) {
      console.error('Ingestion error:', error);
      res.status(500).json({ error: 'Failed to ingest data' });
    }
  });

  // Analyze single event/entity
  app.post('/api/analyze', async (req, res) => {
    try {
      const { eventId, entityId } = req.body;
      
      if (eventId) {
        const result = await analyzeEvent(eventId);
        res.json(result);
      } else if (entityId) {
        const result = await analyzeEntity(entityId);
        res.json(result);
      } else {
        res.status(400).json({ error: 'eventId or entityId required' });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  });

  // Get entities with pagination
  app.get('/api/entities', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const entities = await storage.getEntities(limit);
      res.json(entities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch entities' });
    }
  });

  // Get single entity with details
  app.get('/api/entities/:id', async (req, res) => {
    try {
      const entity = await storage.getEntity(req.params.id);
      if (!entity) {
        return res.status(404).json({ error: 'Entity not found' });
      }
      
      const events = await storage.getEvents(100, entity.id);
      const edges = await storage.getEntityEdges(entity.id);
      const alerts = await storage.getAlerts(undefined, undefined);
      const entityAlerts = alerts.filter(a => a.entityId === entity.id);
      
      res.json({
        entity,
        events,
        edges,
        alerts: entityAlerts
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch entity details' });
    }
  });

  // Get alerts with filtering
  app.get('/api/alerts', async (req, res) => {
    try {
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const alerts = await storage.getAlerts(status, priority);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // Update alert status (human review)
  app.patch('/api/alerts/:id', async (req, res) => {
    try {
      const { status, notes, reviewedBy } = req.body;
      
      const updated = await storage.updateAlert(req.params.id, {
        status,
        notes,
        reviewedBy,
        reviewedAt: new Date()
      });

      if (!updated) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      // Log human review action
      await storage.createAuditLog({
        userId: reviewedBy || 'unknown',
        sessionId: req.headers['session-id'] as string || randomUUID(),
        action: 'alert_review',
        alertId: req.params.id,
        details: { status, notes }
      });

      broadcast({ type: 'alert_updated', alert: updated });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update alert' });
    }
  });

  // Get events with filtering
  app.get('/api/events', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const entityId = req.query.entityId as string;
      const events = await storage.getEvents(limit, entityId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Get recent events for timeline
  app.get('/api/events/recent/:hours', async (req, res) => {
    try {
      const hours = parseInt(req.params.hours) || 24;
      const events = await storage.getRecentEvents(hours);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recent events' });
    }
  });

  // Get graph data for visualization
  app.get('/api/graph', async (req, res) => {
    try {
      const graphData = await storage.getGraphData();
      
      // Add graph metrics
      const nodes = graphData.entities.map(entity => ({
        id: entity.id,
        attributes: entity.attributes || {},
        edges: graphData.edges
          .filter(edge => edge.sourceEntityId === entity.id || edge.targetEntityId === entity.id)
          .map(edge => edge.sourceEntityId === entity.id ? edge.targetEntityId! : edge.sourceEntityId!)
      }));

      const metrics = {
        degreeCentrality: graphAnalysisService.calculateDegreeCentrality(nodes),
        pageRank: graphAnalysisService.calculatePageRank(nodes),
        communities: graphAnalysisService.detectCommunities(nodes)
      };

      res.json({
        entities: graphData.entities,
        edges: graphData.edges,
        metrics
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch graph data' });
    }
  });

  // Get audit logs
  app.get('/api/audit', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const sessionId = req.query.sessionId as string;
      const logs = await storage.getAuditLogs(userId, sessionId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mock data endpoints for development
  app.post('/api/mock/seed', async (req, res) => {
    try {
      await mockDataGenerator.seedInitialData();
      res.json({ success: true, message: 'Mock data seeded successfully' });
    } catch (error) {
      console.error('Failed to seed mock data:', error);
      res.status(500).json({ error: 'Failed to seed mock data' });
    }
  });

  app.post('/api/mock/start', async (req, res) => {
    try {
      mockDataGenerator.startRealtimeGeneration();
      res.json({ success: true, message: 'Realtime mock data generation started' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start mock data generation' });
    }
  });

  app.post('/api/mock/stop', async (req, res) => {
    try {
      mockDataGenerator.stopRealtimeGeneration();
      res.json({ success: true, message: 'Realtime mock data generation stopped' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop mock data generation' });
    }
  });

  // CSV upload endpoint
  app.post('/api/upload/csv', async (req, res) => {
    try {
      const csvData = req.body.data;
      if (!Array.isArray(csvData)) {
        return res.status(400).json({ error: 'Invalid CSV data format' });
      }

      const results = [];
      for (const row of csvData) {
        try {
          // Process each CSV row as an event
          const sanitizedAttributes = entityResolutionService.sanitizeAttributes(row);
          const canonicalHash = entityResolutionService.createCanonicalHash(sanitizedAttributes);
          
          let entity = await storage.getEntityByHash(canonicalHash);
          if (!entity) {
            entity = await storage.createEntity({
              canonicalHash,
              pseudonymousId: entityResolutionService.createPseudonymousId(canonicalHash),
              attributes: sanitizedAttributes,
              riskScore: 0,
              confidence: 0
            });
          }

          const event = await storage.createEvent({
            timestamp: new Date(row.timestamp || Date.now()),
            source: 'csv_upload',
            entityId: entity.id,
            type: row.type || 'unknown',
            text: row.text || '',
            metadata: row,
            riskScore: 0,
            processed: false
          });

          results.push({ eventId: event.id, entityId: entity.id });
          
          // Process event
          processEvent(event.id, broadcast);
        } catch (rowError) {
          console.error('Error processing CSV row:', rowError);
        }
      }

      res.json({ success: true, processed: results.length, events: results });
    } catch (error) {
      console.error('CSV upload error:', error);
      res.status(500).json({ error: 'Failed to process CSV upload' });
    }
  });

  return httpServer;
}

// Background event processing
async function processEvent(eventId: string, broadcast: (data: any) => void) {
  try {
    const event = await storage.getEvent(eventId);
    if (!event || event.processed) return;

    // Analyze text if present
    let textAnalysis;
    if (event.text) {
      const decodedText = mlAnalysisService.decodeLeetSpeak(event.text);
      textAnalysis = mlAnalysisService.analyzeText(decodedText);
    }

    // Get entity for behavioral analysis
    const entity = event.entityId ? await storage.getEntity(event.entityId) : null;
    let behavioralAnomaly = 0;
    
    if (entity) {
      // Simple behavioral features
      const entityEvents = await storage.getEvents(100, entity.id);
      const features = {
        sessionLength: 1800, // Mock
        deviceChurn: entityEvents.length > 10 ? 2 : 0,
        geoJump: Math.random() > 0.8, // Mock geo jump detection
        timePattern: 'normal',
        volumeAnomaly: entityEvents.length > 50 ? 0.3 : 0
      };
      
      behavioralAnomaly = mlAnalysisService.detectBehavioralAnomalies(features);
    }

    // Calculate risk score
    const riskExplanation = riskScoringService.calculateRiskScore({
      textAnalysis,
      behavioralAnomaly,
      graphCentrality: Math.random() * 5, // Mock centrality
      temporalPatterns: {
        frequencyAnomaly: Math.random() * 0.5,
        timePatternAnomaly: Math.random() * 0.3
      },
      networkFeatures: {
        ipReputation: Math.random() * 0.4,
        geoAnomaly: Math.random() * 0.3,
        deviceAnomaly: Math.random() * 0.2
      }
    });

    // Update event with risk score
    await storage.updateEvent(eventId, {
      riskScore: riskExplanation.score,
      processed: true
    });

    // Update entity risk score
    if (entity) {
      await storage.updateEntity(entity.id, {
        riskScore: riskExplanation.score,
        confidence: riskExplanation.confidence
      });
    }

    // Create alert if high risk
    if (riskExplanation.score >= 40) {
      const priority = riskScoringService.determinePriority(riskExplanation.score, riskExplanation.confidence);
      
      const alert = await storage.createAlert({
        entityId: event.entityId,
        eventId: event.id,
        priority,
        title: getAlertTitle(textAnalysis, behavioralAnomaly),
        description: getAlertDescription(event, riskExplanation),
        riskScore: riskExplanation.score,
        confidence: riskExplanation.confidence,
        evidence: riskExplanation.factors.map(f => ({
          type: f.name,
          value: f.evidence,
          weight: f.weight,
          timestamp: new Date().toISOString()
        })),
        status: 'pending'
      });

      broadcast({ type: 'new_alert', alert });
    }

    broadcast({ type: 'event_processed', eventId, riskScore: riskExplanation.score });

  } catch (error) {
    console.error('Event processing error:', error);
  }
}

async function analyzeEvent(eventId: string) {
  const event = await storage.getEvent(eventId);
  if (!event) throw new Error('Event not found');

  let textAnalysis;
  if (event.text) {
    const decodedText = mlAnalysisService.decodeLeetSpeak(event.text);
    textAnalysis = mlAnalysisService.analyzeText(decodedText);
  }

  return {
    event,
    textAnalysis,
    riskScore: event.riskScore
  };
}

async function analyzeEntity(entityId: string) {
  const entity = await storage.getEntity(entityId);
  if (!entity) throw new Error('Entity not found');

  const events = await storage.getEvents(100, entityId);
  const edges = await storage.getEntityEdges(entityId);
  
  return {
    entity,
    events,
    edges,
    riskScore: entity.riskScore,
    confidence: entity.confidence
  };
}

function getAlertTitle(textAnalysis: any, behavioralAnomaly: number): string {
  if (textAnalysis?.riskTokens.length > 0) {
    return 'Suspicious Text Content Detected';
  }
  if (behavioralAnomaly > 0.7) {
    return 'Behavioral Anomaly Detected';
  }
  return 'Risk Pattern Identified';
}

function getAlertDescription(event: any, riskExplanation: any): string {
  const factors = riskExplanation.factors.map((f: any) => f.evidence).join('. ');
  return `${event.type} event from ${event.source}. ${factors}`;
}

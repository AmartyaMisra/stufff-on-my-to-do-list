import { storage } from '../storage.js';
import { entityResolutionService } from './entityResolution.js';
import { mlAnalysisService } from './mlAnalysis.js';
import { riskScoringService } from './riskScoring.js';

interface MockEventTemplate {
  type: string;
  texts: string[];
  sources: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const mockEventTemplates: MockEventTemplate[] = [
  {
    type: 'network_anomaly',
    texts: [
      'Suspicious login spike detected from RU IP range 185.220.xxx.xxx',
      'Multiple failed authentication attempts from TOR exit nodes',
      'Unusual data transfer patterns to offshore servers',
      'Port scanning activity detected from compromised endpoints'
    ],
    sources: ['network_monitor', 'firewall_logs', 'intrusion_detection'],
    riskLevel: 'high'
  },
  {
    type: 'text_analysis',
    texts: [
      'NLP flagged phrase "detonate package" in encrypted channel',
      'Coordination keywords detected: "meet at location alpha"',
      'Suspicious communication pattern: coded language usage',
      'Threat analysis: "target acquired, proceeding with operation"'
    ],
    sources: ['social_media', 'encrypted_comms', 'chat_monitor'],
    riskLevel: 'critical'
  },
  {
    type: 'transaction_pattern',
    texts: [
      'Rapid fund movement through shell companies detected',
      'Cryptocurrency mixing service usage pattern identified',
      'Unusual high-value transfers to sanctioned regions',
      'Money laundering indicators in transaction flow'
    ],
    sources: ['payment_processor', 'bank_api', 'crypto_monitor'],
    riskLevel: 'medium'
  },
  {
    type: 'behavioral_change',
    texts: [
      'Entity behavior deviation: 347% increase in activity',
      'Geolocation jump: NYC → Moscow in 30 minutes',
      'Device fingerprint mismatch: new hardware detected',
      'Access pattern anomaly: unusual hours and frequency'
    ],
    sources: ['user_analytics', 'device_tracking', 'location_service'],
    riskLevel: 'medium'
  },
  {
    type: 'supply_chain',
    texts: [
      'Critical vendor compromise: supply chain infiltration',
      'Malicious package injection in software dependency',
      'Third-party service breach: credentials exposure',
      'Infrastructure tampering detected in logistics chain'
    ],
    sources: ['vendor_monitor', 'package_scanner', 'logistics_api'],
    riskLevel: 'high'
  }
];

export class MockDataGenerator {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  async seedInitialData() {
    console.log('Seeding initial mock data...');
    
    // Create some mock entities with realistic attributes
    const mockEntities = [
      {
        email: 'user.alpha@protonmail.com',
        location: 'Eastern Europe',
        deviceFingerprint: 'fp_1a2b3c4d',
        name: 'Entity Alpha'
      },
      {
        email: 'beta.contact@tutanota.com', 
        location: 'Southeast Asia',
        deviceFingerprint: 'fp_5e6f7g8h',
        name: 'Entity Beta'
      },
      {
        email: 'gamma.user@guerrillamail.com',
        location: 'North America',
        deviceFingerprint: 'fp_9i0j1k2l',
        name: 'Entity Gamma'
      }
    ];

    const entities = [];
    for (const mockEntity of mockEntities) {
      const sanitizedAttributes = entityResolutionService.sanitizeAttributes(mockEntity);
      const canonicalHash = entityResolutionService.createCanonicalHash(sanitizedAttributes);
      
      const entity = await storage.createEntity({
        canonicalHash,
        pseudonymousId: entityResolutionService.createPseudonymousId(canonicalHash),
        attributes: sanitizedAttributes,
        riskScore: Math.random() * 100,
        confidence: 0.8 + Math.random() * 0.2
      });
      entities.push(entity);
    }

    // Create some historical events for timeline
    const now = Date.now();
    for (let i = 0; i < 15; i++) {
      const hoursAgo = Math.random() * 24;
      const timestamp = new Date(now - hoursAgo * 60 * 60 * 1000);
      
      await this.generateMockEvent(timestamp, entities);
    }

    // Create some entity relationships
    if (entities.length >= 2) {
      await storage.createGraphEdge({
        sourceEntityId: entities[0].id,
        targetEntityId: entities[1].id,
        relationshipType: 'communication',
        weight: 0.8,
        metadata: { connection_type: 'encrypted_channel' }
      });

      await storage.createGraphEdge({
        sourceEntityId: entities[1].id,
        targetEntityId: entities[2].id,
        relationshipType: 'transaction',
        weight: 0.6,
        metadata: { amount: 5000, currency: 'cryptocurrency' }
      });
    }

    console.log(`Seeded ${entities.length} entities and initial events`);
  }

  async generateMockEvent(timestamp?: Date, entities?: any[]) {
    const template = mockEventTemplates[Math.floor(Math.random() * mockEventTemplates.length)];
    const text = template.texts[Math.floor(Math.random() * template.texts.length)];
    const source = template.sources[Math.floor(Math.random() * template.sources.length)];
    
    // Get available entities or create a new one
    let entityList = entities;
    if (!entityList || entityList.length === 0) {
      entityList = await storage.getEntities(10);
    }
    
    const entity = entityList.length > 0 ? 
      entityList[Math.floor(Math.random() * entityList.length)] : null;

    // Create event
    const event = await storage.createEvent({
      timestamp: timestamp || new Date(),
      source,
      entityId: entity?.id,
      type: template.type,
      text,
      metadata: {
        template_used: template.type,
        auto_generated: true
      },
      riskScore: 0,
      processed: false
    });

    // Process the event to generate risk score
    await this.processEvent(event.id);
    
    return event;
  }

  private async processEvent(eventId: string) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event || event.processed) return;

      // Analyze text
      let textAnalysis;
      if (event.text) {
        const decodedText = mlAnalysisService.decodeLeetSpeak(event.text);
        textAnalysis = mlAnalysisService.analyzeText(decodedText);
      }

      // Mock behavioral features
      const behavioralAnomaly = Math.random() * 0.7;

      // Calculate risk score
      const riskExplanation = riskScoringService.calculateRiskScore({
        textAnalysis,
        behavioralAnomaly,
        graphCentrality: Math.random() * 5,
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

      // Update event
      await storage.updateEvent(eventId, {
        riskScore: riskExplanation.score,
        processed: true
      });

      // Update entity risk score
      if (event.entityId) {
        const entity = await storage.getEntity(event.entityId);
        if (entity) {
          await storage.updateEntity(entity.id, {
            riskScore: Math.max(entity.riskScore || 0, riskExplanation.score),
            confidence: riskExplanation.confidence
          });
        }
      }

      // Create alert if high risk
      if (riskExplanation.score >= 40) {
        const priority = riskScoringService.determinePriority(riskExplanation.score, riskExplanation.confidence);
        
        await storage.createAlert({
          entityId: event.entityId,
          eventId: event.id,
          priority,
          title: this.getAlertTitle(event.type, riskExplanation.score),
          description: this.getAlertDescription(event, riskExplanation),
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
      }

    } catch (error) {
      console.error('Mock event processing error:', error);
    }
  }

  private getAlertTitle(eventType: string, riskScore: number): string {
    const titles: Record<string, string[]> = {
      network_anomaly: ['Network Intrusion Detected', 'Suspicious Network Activity', 'Anomalous Connection Pattern'],
      text_analysis: ['Threat Communication Intercepted', 'Suspicious Text Content', 'Coordinated Activity Detected'],
      transaction_pattern: ['Financial Anomaly Detected', 'Suspicious Transaction Flow', 'Money Laundering Pattern'],
      behavioral_change: ['Entity Behavior Anomaly', 'Unusual Activity Pattern', 'Behavioral Deviation Alert'],
      supply_chain: ['Supply Chain Compromise', 'Vendor Security Breach', 'Infrastructure Tampering']
    };

    const eventTitles = titles[eventType] || ['Security Alert Detected'];
    return eventTitles[Math.floor(Math.random() * eventTitles.length)];
  }

  private getAlertDescription(event: any, riskExplanation: any): string {
    const factors = riskExplanation.factors.map((f: any) => f.evidence).join('. ');
    return `${event.type.replace('_', ' ')} event from ${event.source}. ${factors}`;
  }

  startRealtimeGeneration() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting realtime mock data generation...');
    
    // Generate new events every 10-30 seconds
    this.intervalId = setInterval(async () => {
      try {
        await this.generateMockEvent();
      } catch (error) {
        console.error('Error generating mock event:', error);
      }
    }, 10000 + Math.random() * 20000); // 10-30 seconds
  }

  stopRealtimeGeneration() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Stopped realtime mock data generation');
  }
}

export const mockDataGenerator = new MockDataGenerator();
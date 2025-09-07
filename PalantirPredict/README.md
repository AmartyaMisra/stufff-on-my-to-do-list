# Palantir-Style Predictive Intelligence Portal

A comprehensive ethical AI-powered intelligence analysis platform designed for risk assessment, anomaly detection, and real-time threat monitoring. This system processes events and metadata to forecast risky scenarios while maintaining strict ethical guidelines and human oversight.

## 🎯 Project Overview

This intelligence portal combines machine learning, graph analytics, and real-time processing to provide analysts with actionable insights while ensuring responsible AI deployment. The system focuses on:

- **Ethical AI**: Human-in-the-loop workflows with comprehensive audit trails
- **Privacy-First**: Anonymized data processing with pseudonymous identifiers  
- **Explainable AI**: Risk scores backed by clear evidence chains
- **Real-Time Analysis**: Live event processing and alert generation

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Shadcn/UI** components built on Radix UI primitives
- **Tailwind CSS** for modern, responsive styling
- **TanStack Query** for efficient server state management
- **Wouter** for lightweight client-side routing
- **D3.js** for advanced data visualizations

### Backend Stack
- **Node.js** with Express.js framework
- **TypeScript** with ES modules for consistency
- **WebSocket** connections for real-time updates
- **PostgreSQL** with Drizzle ORM for type-safe database operations
- **Modular service architecture** for ML and analytics

### Machine Learning Pipeline
- **Text Analysis**: NLP processing with sentiment analysis and threat detection
- **Entity Resolution**: Probabilistic record linkage using string similarity
- **Behavioral Analytics**: Anomaly detection in user patterns
- **Graph Analysis**: Network centrality and relationship mapping
- **Risk Scoring**: Multi-factor assessment with confidence intervals

## 🚀 Features

### Dashboard Interface
- **Three-Panel Layout**: Alerts sidebar, event timeline, and entity analysis
- **Dark Cyber-Ops Theme**: Professional intelligence portal aesthetic
- **Real-Time Updates**: Live WebSocket connections for instant notifications
- **Interactive Timeline**: Visualize events chronologically with risk indicators

### Intelligence Capabilities
- **Multi-Modal Analysis**: Process text, behavioral, and network data
- **Entity Relationship Mapping**: Discover connections between actors
- **Explainable AI**: Evidence-based risk assessments with clear reasoning
- **Human-in-the-Loop**: Analyst review workflows with confirm/dismiss actions

### Data Processing
- **CSV Upload**: Bulk import of structured intelligence data
- **Real-Time Ingestion**: Process events as they occur
- **Anonymization**: Privacy-preserving data handling with canonical hashing
- **Audit Logging**: Comprehensive tracking of all system decisions

## 📊 System Components

### Risk Assessment Engine
The system calculates risk scores using multiple factors:

```typescript
Risk Score = Weighted Sum of:
- Text Analysis (threat keywords, sentiment)
- Behavioral Anomalies (pattern deviations)  
- Graph Centrality (network importance)
- Temporal Patterns (frequency anomalies)
- Network Features (IP reputation, geolocation)
```

### Entity Resolution
Privacy-preserving entity identification:
- **Canonical Hashing**: SHA-256 of normalized attributes
- **Pseudonymous IDs**: HMAC-based anonymous identifiers
- **Similarity Matching**: Probabilistic record linkage
- **Attribute Sanitization**: Remove PII while preserving intelligence value

### Alert Management
Intelligent alert prioritization:
- **CRITICAL**: Score ≥ 80, immediate attention required
- **HIGH**: Score 60-79, elevated threat level
- **MEDIUM**: Score 40-59, monitoring recommended  
- **LOW**: Score < 40, baseline activity

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ with npm
- PostgreSQL database (or use built-in Neon database)
- Modern web browser with WebSocket support

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd intelligence-portal
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file with:
```bash
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=development
SESSION_SECRET=your_session_secret
```

4. **Database Setup**
```bash
# Run migrations (if using PostgreSQL)
npx drizzle-kit generate
npx drizzle-kit migrate
```

5. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Project Structure
```
intelligence-portal/
├── client/src/           # React frontend application
│   ├── components/       # Reusable UI components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   └── ui/          # Shadcn UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and types
│   └── pages/           # Application pages
├── server/              # Express backend
│   ├── services/        # Business logic services
│   │   ├── mlAnalysis.ts    # Text and ML processing
│   │   ├── riskScoring.ts   # Risk assessment engine
│   │   ├── entityResolution.ts # Entity matching
│   │   ├── graphAnalysis.ts # Network analytics
│   │   └── mockDataGenerator.ts # Development data
│   ├── storage.ts       # Data persistence layer
│   └── routes.ts        # API endpoints
├── shared/              # Shared TypeScript schemas
└── drizzle/            # Database schema and migrations
```

## 🎮 Usage Guide

### Getting Started
1. **Launch the application** and navigate to the dashboard
2. **Seed demo data** using the "Seed Data" button in the left panel
3. **Start live generation** with "Start Live" to see real-time events
4. **Explore alerts** by clicking on items in the alerts list
5. **Investigate entities** by selecting alerts to view relationship graphs

### Demo Features
The system includes realistic mock data generators:
- **Network Anomalies**: Suspicious login patterns, TOR usage
- **Text Analysis**: Threat communications, coded language
- **Financial Patterns**: Money laundering, cryptocurrency mixing
- **Behavioral Changes**: Geolocation jumps, device anomalies
- **Supply Chain**: Vendor compromises, infrastructure tampering

### Analyst Workflows
1. **Alert Triage**: Review pending alerts by priority
2. **Investigation**: Examine entity relationships and evidence
3. **Decision Making**: Confirm, dismiss, or escalate threats
4. **Documentation**: Add analyst notes and reasoning
5. **Audit Trail**: All actions logged for compliance

## 🔧 API Endpoints

### Core Data APIs
- `GET /api/events` - Retrieve events with optional filtering
- `GET /api/events/recent/:hours` - Get recent events
- `GET /api/alerts` - List alerts with status filtering
- `POST /api/alerts/:id/review` - Analyst review actions
- `GET /api/entities/:id` - Entity details and relationships
- `GET /api/graph` - Network graph data with metrics

### Data Ingestion
- `POST /api/upload/csv` - Bulk CSV upload and processing
- `POST /api/events` - Create individual events
- `POST /api/entities` - Register new entities

### Development Utilities
- `POST /api/mock/seed` - Generate initial demo data
- `POST /api/mock/start` - Begin real-time event simulation
- `POST /api/mock/stop` - Stop event generation
- `GET /api/health` - System health check

### WebSocket Events
Real-time updates via WebSocket connection at `/ws`:
- `new_alert` - Alert created
- `alert_updated` - Alert status changed  
- `event_processed` - Event analysis completed
- `entity_updated` - Entity risk score updated

## 🛡️ Security & Ethics

### Privacy Protection
- **Data Anonymization**: No raw PII stored in system
- **Pseudonymous Processing**: HMAC-based entity identification
- **Audit Logging**: Full traceability of all decisions
- **Access Controls**: Session-based authentication

### Ethical AI Guidelines
- **Human Oversight**: All high-risk alerts require analyst review
- **Explainable Decisions**: Clear evidence chains for all risk scores
- **Bias Mitigation**: Regular model evaluation and fairness testing
- **Transparency**: Open algorithm documentation

### Compliance Features
- **GDPR/CCPA Ready**: Right to erasure and data portability
- **Audit Trails**: Immutable decision logging
- **Data Retention**: Configurable retention policies
- **Export Controls**: Jurisdiction-aware processing

## 🧪 Testing & Development

### Mock Data System
The platform includes comprehensive mock data generation:
- **Realistic Scenarios**: Based on actual threat intelligence patterns
- **Configurable Volume**: Adjust event generation frequency
- **Diverse Sources**: Network logs, communications, financial data
- **Risk Gradients**: Events across all risk levels

### Performance Considerations
- **Real-time Processing**: Sub-second event analysis
- **Scalable Architecture**: Horizontal scaling support
- **Efficient Queries**: Optimized database indexing
- **Caching Strategy**: Intelligent cache invalidation

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
```bash
NODE_ENV=production
DATABASE_URL=production_database_url
SESSION_SECRET=strong_production_secret
```

2. **Build Application**
```bash
npm run build
```

3. **Database Migration**
```bash
npx drizzle-kit migrate
```

4. **Start Production Server**
```bash
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development/production)
- `SESSION_SECRET` - Session encryption key
- `PORT` - Server port (default: 5000)
- `WEBSOCKET_PATH` - WebSocket endpoint (default: /ws)

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit pull request with description

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Consistent code formatting
- **Testing**: Unit tests for core functions
- **Documentation**: JSDoc for all public APIs

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This system is designed for legitimate security analysis and threat detection purposes only. Users are responsible for ensuring compliance with applicable laws and regulations in their jurisdiction. The developers assume no liability for misuse of this software.

---

**Built with ❤️ for ethical intelligence analysis**

For questions, issues, or contributions, please refer to the project's issue tracker and documentation.
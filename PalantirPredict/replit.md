# Overview

This is a Palantir-style predictive intelligence portal built for ethical risk assessment and anomaly detection. The application ingests events and metadata to forecast risky events and identify anomalous scenarios using machine learning techniques. It provides an aesthetic, real-time dashboard for analysts to review alerts, investigate entities, and make informed decisions about potential threats.

The system focuses on ethical deployment with anonymized data, human-in-the-loop validation, and comprehensive audit logging. It's designed to assist analysts rather than perform autonomous surveillance or accusations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Visualization**: D3.js for custom charts and graph visualizations
- **Real-time Updates**: WebSocket connection for live alerts and event streaming

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with real-time WebSocket support
- **Data Processing**: Modular service architecture with separate concerns:
  - Entity resolution for identifying relationships
  - ML analysis for text processing and risk scoring
  - Graph analysis for network pattern detection
  - Risk scoring with explainable AI factors

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment
- **Schema Design**: Normalized tables for entities, events, alerts, audit logs, and graph edges
- **Data Privacy**: Anonymized attributes with pseudonymous identifiers and canonical hashing

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Audit Trail**: Comprehensive logging of all user actions and system decisions
- **Privacy Controls**: GDPR/CCPA compliant data handling with opt-out provisions

## Machine Learning Pipeline
- **Text Analysis**: Keyword-based risk detection with sentiment analysis
- **Entity Resolution**: Probabilistic record linkage using string similarity and hashing
- **Graph Analytics**: Network centrality calculations and community detection
- **Risk Scoring**: Multi-factor risk assessment with confidence intervals and explainable evidence

## Real-time Processing
- **WebSocket Server**: Live event streaming and alert notifications
- **Event Processing**: Asynchronous ingestion pipeline with data validation and sanitization
- **Graph Updates**: Dynamic entity relationship mapping and visualization

# External Dependencies

## Database Services
- **@neondatabase/serverless**: Serverless PostgreSQL connection for Neon Database
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **drizzle-kit**: Database migration and schema management tools

## UI and Visualization
- **@radix-ui/***: Comprehensive component primitives for accessible UI
- **@tanstack/react-query**: Server state management and caching
- **d3**: Data visualization library for custom charts and graphs
- **tailwindcss**: Utility-first CSS framework for styling
- **lucide-react**: Icon library for consistent iconography

## Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Text Processing
- **date-fns**: Date manipulation and formatting utilities
- **class-variance-authority**: Type-safe variant management for components
- **clsx**: Conditional className utility

## WebSocket Communication
- **ws**: WebSocket implementation for real-time communication
- **wouter**: Lightweight routing for single-page application navigation

The application uses a monorepo structure with shared TypeScript schemas between client and server, ensuring type safety across the full stack. The architecture prioritizes ethical AI deployment with human oversight, comprehensive audit trails, and explainable risk assessments.
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const entities = pgTable("entities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  canonicalHash: text("canonical_hash").notNull().unique(),
  pseudonymousId: text("pseudonymous_id").notNull(),
  attributes: json("attributes").$type<Record<string, any>>(),
  riskScore: real("risk_score").default(0),
  confidence: real("confidence").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull(),
  source: text("source").notNull(),
  entityId: varchar("entity_id").references(() => entities.id),
  type: text("type").notNull(),
  text: text("text"),
  metadata: json("metadata").$type<Record<string, any>>(),
  riskScore: real("risk_score").default(0),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: varchar("entity_id").references(() => entities.id),
  eventId: varchar("event_id").references(() => events.id),
  priority: text("priority").notNull(), // CRITICAL, HIGH, MEDIUM, LOW
  title: text("title").notNull(),
  description: text("description").notNull(),
  riskScore: real("risk_score").notNull(),
  confidence: real("confidence").notNull(),
  evidence: json("evidence").$type<Array<{
    type: string;
    value: string;
    weight: number;
    timestamp: string;
  }>>(),
  status: text("status").default("pending"), // pending, confirmed, dismissed, escalated
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  action: text("action").notNull(),
  entityId: varchar("entity_id"),
  alertId: varchar("alert_id"),
  details: json("details").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow()
});

export const graphEdges = pgTable("graph_edges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceEntityId: varchar("source_entity_id").references(() => entities.id),
  targetEntityId: varchar("target_entity_id").references(() => entities.id),
  relationshipType: text("relationship_type").notNull(),
  weight: real("weight").default(1),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertEntitySchema = createInsertSchema(entities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true
});

export const insertGraphEdgeSchema = createInsertSchema(graphEdges).omit({
  id: true,
  createdAt: true
});

// Types
export type Entity = typeof entities.$inferSelect;
export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type GraphEdge = typeof graphEdges.$inferSelect;
export type InsertGraphEdge = z.infer<typeof insertGraphEdgeSchema>;

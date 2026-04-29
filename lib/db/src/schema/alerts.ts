import {
  pgTable,
  serial,
  text,
  real,
  timestamp,
} from "drizzle-orm/pg-core";

export const biasAlertsTable = pgTable("bias_alerts", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  attribute: text("attribute").notNull(),
  group: text("group").notNull(),
  metric: text("metric").notNull(),
  value: real("value").notNull(),
  threshold: real("threshold").notNull(),
  severity: text("severity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type BiasAlert = typeof biasAlertsTable.$inferSelect;
export type InsertBiasAlert = typeof biasAlertsTable.$inferInsert;

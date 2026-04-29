import {
  pgTable,
  serial,
  text,
  real,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  fairnessMode: boolean("fairness_mode").notNull().default(true),
  approvalThreshold: real("approval_threshold").notNull().default(0.5),
  demographicParityThreshold: real("demographic_parity_threshold")
    .notNull()
    .default(0.1),
  disparateImpactThreshold: real("disparate_impact_threshold")
    .notNull()
    .default(0.8),
  mitigationStrategy: text("mitigation_strategy")
    .notNull()
    .default("ThresholdTuning"),
  protectedAttributes: jsonb("protected_attributes")
    .notNull()
    .default(["gender", "location", "education"]),
  modelName: text("model_name").notNull().default("LoanModel_v1.3"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Settings = typeof settingsTable.$inferSelect;
export type InsertSettings = typeof settingsTable.$inferInsert;

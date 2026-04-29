import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  // Applicant input
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  maritalStatus: text("marital_status").notNull(),
  education: text("education").notNull(),
  location: text("location").notNull(),
  workExperience: integer("work_experience").notNull(),
  income: real("income").notNull(),
  loanAmount: real("loan_amount").notNull(),
  creditHistory: text("credit_history").notNull(),
  // Model output
  modelName: text("model_name").notNull(),
  rawScore: real("raw_score").notNull(),
  mitigatedScore: real("mitigated_score").notNull(),
  rawDecision: text("raw_decision").notNull(),
  finalDecision: text("final_decision").notNull(),
  confidence: real("confidence").notNull(),
  // Fairness
  biasDetected: boolean("bias_detected").notNull(),
  severity: text("severity").notNull(),
  mitigationApplied: boolean("mitigation_applied").notNull(),
  // Explanation
  factors: jsonb("factors").notNull(),
  explanation: text("explanation").notNull(),
  processingTimeMs: integer("processing_time_ms").notNull(),
  // Optional scenario tag for batch runs
  scenario: text("scenario"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Prediction = typeof predictionsTable.$inferSelect;
export type InsertPrediction = typeof predictionsTable.$inferInsert;

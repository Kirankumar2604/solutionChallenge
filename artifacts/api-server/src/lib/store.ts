import { db } from "@workspace/db";
import {
  predictionsTable,
  biasAlertsTable,
  settingsTable,
  type Prediction,
  type Settings,
  type InsertPrediction,
  type InsertBiasAlert,
} from "@workspace/db";
import { desc, eq, and, sql } from "drizzle-orm";

export async function getOrCreateSettings(): Promise<Settings> {
  const existing = await db.select().from(settingsTable).limit(1);
  if (existing.length > 0) return existing[0]!;
  const [created] = await db
    .insert(settingsTable)
    .values({})
    .returning();
  return created!;
}

export async function updateSettings(
  patch: Partial<Settings>,
): Promise<Settings> {
  const current = await getOrCreateSettings();
  const [updated] = await db
    .update(settingsTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(settingsTable.id, current.id))
    .returning();
  return updated!;
}

export async function insertPrediction(
  p: InsertPrediction,
): Promise<Prediction> {
  const [created] = await db.insert(predictionsTable).values(p).returning();
  return created!;
}

export async function listPredictions(opts: {
  limit?: number;
  group?: string;
  biasOnly?: boolean;
}): Promise<Prediction[]> {
  const limit = opts.limit ?? 50;
  const conditions = [] as ReturnType<typeof eq>[];
  if (opts.group) {
    conditions.push(eq(predictionsTable.gender, opts.group));
  }
  if (opts.biasOnly) {
    conditions.push(eq(predictionsTable.biasDetected, true));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db
    .select()
    .from(predictionsTable)
    .where(where)
    .orderBy(desc(predictionsTable.createdAt))
    .limit(limit);
  return rows;
}

export async function getPrediction(id: number): Promise<Prediction | null> {
  const [row] = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.id, id))
    .limit(1);
  return row ?? null;
}

export async function listAllPredictions(): Promise<Prediction[]> {
  return db
    .select()
    .from(predictionsTable)
    .orderBy(desc(predictionsTable.createdAt));
}

export async function insertAlert(a: InsertBiasAlert) {
  const [created] = await db.insert(biasAlertsTable).values(a).returning();
  return created!;
}

export async function listAlerts(limit: number) {
  return db
    .select()
    .from(biasAlertsTable)
    .orderBy(desc(biasAlertsTable.createdAt))
    .limit(limit);
}

export async function dailyVolumeSummary(days = 7) {
  const rows = await db.execute(sql`
    SELECT
      to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
      COUNT(*)::int as total,
      SUM(CASE WHEN final_decision = 'Approved' THEN 1 ELSE 0 END)::int as approved,
      SUM(CASE WHEN final_decision = 'Rejected' THEN 1 ELSE 0 END)::int as rejected
    FROM predictions
    WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
    GROUP BY 1
    ORDER BY 1 ASC
  `);
  return rows.rows as Array<{
    date: string;
    total: number;
    approved: number;
    rejected: number;
  }>;
}

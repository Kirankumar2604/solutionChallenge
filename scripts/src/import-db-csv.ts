import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { db, predictionsTable, biasAlertsTable, settingsTable } from "@workspace/db";

type CsvRow = Record<string, string>;

function clean(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function toNumber(value: string | undefined, field: string, row: number): number {
  const n = Number(clean(value));
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid ${field} at row ${row}: ${String(value)}`);
  }
  return n;
}

function toBoolean(value: string | undefined, field: string, row: number): boolean {
  const v = clean(value).toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  throw new Error(`Invalid ${field} at row ${row}: ${String(value)}`);
}

function toDate(value: string | undefined, field: string, row: number): Date {
  const v = clean(value);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ${field} at row ${row}: ${String(value)}`);
  }
  return d;
}

function toJson(value: string | undefined, field: string, row: number): unknown {
  const v = clean(value);
  try {
    return JSON.parse(v);
  } catch {
    throw new Error(`Invalid JSON for ${field} at row ${row}`);
  }
}

async function readCsv(filePath: string): Promise<CsvRow[]> {
  const text = await readFile(filePath, "utf8");
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as CsvRow[];
}

async function importPredictions(csvPath: string) {
  const rows = await readCsv(csvPath);
  const values = rows.map((r, i) => {
    const row = i + 2;
    const scenario = clean(r["scenario"]);
    return {
      age: toNumber(r["age"], "age", row),
      gender: clean(r["gender"]),
      maritalStatus: clean(r["marital_status"]),
      education: clean(r["education"]),
      location: clean(r["location"]),
      workExperience: toNumber(r["work_experience"], "work_experience", row),
      income: toNumber(r["income"], "income", row),
      loanAmount: toNumber(r["loan_amount"], "loan_amount", row),
      creditHistory: clean(r["credit_history"]),
      modelName: clean(r["model_name"]),
      rawScore: toNumber(r["raw_score"], "raw_score", row),
      mitigatedScore: toNumber(r["mitigated_score"], "mitigated_score", row),
      rawDecision: clean(r["raw_decision"]),
      finalDecision: clean(r["final_decision"]),
      confidence: toNumber(r["confidence"], "confidence", row),
      biasDetected: toBoolean(r["bias_detected"], "bias_detected", row),
      severity: clean(r["severity"]),
      mitigationApplied: toBoolean(r["mitigation_applied"], "mitigation_applied", row),
      factors: toJson(r["factors"], "factors", row),
      explanation: clean(r["explanation"]),
      processingTimeMs: toNumber(r["processing_time_ms"], "processing_time_ms", row),
      scenario: scenario ? scenario : null,
      createdAt: toDate(r["created_at"], "created_at", row),
    };
  });

  if (values.length > 0) {
    await db.insert(predictionsTable).values(values);
  }

  return values.length;
}

async function importAlerts(csvPath: string) {
  const rows = await readCsv(csvPath);
  const values = rows.map((r, i) => {
    const row = i + 2;
    return {
      message: clean(r["message"]),
      attribute: clean(r["attribute"]),
      group: clean(r["group"]),
      metric: clean(r["metric"]),
      value: toNumber(r["value"], "value", row),
      threshold: toNumber(r["threshold"], "threshold", row),
      severity: clean(r["severity"]),
      createdAt: toDate(r["created_at"], "created_at", row),
    };
  });

  if (values.length > 0) {
    await db.insert(biasAlertsTable).values(values);
  }

  return values.length;
}

async function importSettings(csvPath: string) {
  const rows = await readCsv(csvPath);
  const values = rows.map((r, i) => {
    const row = i + 2;
    return {
      fairnessMode: toBoolean(r["fairness_mode"], "fairness_mode", row),
      approvalThreshold: toNumber(r["approval_threshold"], "approval_threshold", row),
      demographicParityThreshold: toNumber(
        r["demographic_parity_threshold"],
        "demographic_parity_threshold",
        row,
      ),
      disparateImpactThreshold: toNumber(
        r["disparate_impact_threshold"],
        "disparate_impact_threshold",
        row,
      ),
      mitigationStrategy: clean(r["mitigation_strategy"]),
      protectedAttributes: toJson(r["protected_attributes"], "protected_attributes", row),
      modelName: clean(r["model_name"]),
      updatedAt: toDate(r["updated_at"], "updated_at", row),
    };
  });

  if (values.length > 0) {
    await db.insert(settingsTable).values(values);
  }

  return values.length;
}

async function main() {
  const cliArgs = process.argv.slice(2).filter((arg) => arg !== "--");
  const baseDirArg = cliArgs[0] ?? "./DataBase";
  const baseDir = path.resolve(process.cwd(), baseDirArg);

  const predictionsPath = path.join(baseDir, "predictions.csv");
  const alertsPath = path.join(baseDir, "bias_alerts.csv");
  const settingsPath = path.join(baseDir, "settings.csv");

  await db.delete(biasAlertsTable);
  await db.delete(predictionsTable);
  await db.delete(settingsTable);

  const settingsCount = await importSettings(settingsPath);
  const predictionsCount = await importPredictions(predictionsPath);
  const alertsCount = await importAlerts(alertsPath);

  console.log(
    `Imported settings=${settingsCount}, predictions=${predictionsCount}, alerts=${alertsCount}`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

type CsvRow = Record<string, string>;

type PredictionInput = {
  age: number;
  gender: string;
  maritalStatus: string;
  education: string;
  location: string;
  workExperience: number;
  income: number;
  loanAmount: number;
  creditHistory: string;
};

const requiredKeys = [
  "age",
  "gender",
  "maritalStatus",
  "education",
  "location",
  "workExperience",
  "income",
  "loanAmount",
  "creditHistory",
] as const;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const headerAliases = new Map<string, keyof PredictionInput>([
  ["age", "age"],
  ["gender", "gender"],
  ["maritalstatus", "maritalStatus"],
  ["marital", "maritalStatus"],
  ["education", "education"],
  ["location", "location"],
  ["workexperience", "workExperience"],
  ["experience", "workExperience"],
  ["income", "income"],
  ["loanamount", "loanAmount"],
  ["loan", "loanAmount"],
  ["credithistory", "creditHistory"],
  ["credit", "creditHistory"],
]);

function parseNumber(value: string, field: string, rowNumber: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Row ${rowNumber}: invalid numeric value for ${field}: "${value}"`);
  }
  return n;
}

function mapRow(raw: CsvRow, rowNumber: number): PredictionInput {
  const normalized = new Map<keyof PredictionInput, string>();

  for (const [key, value] of Object.entries(raw)) {
    const alias = headerAliases.get(normalizeKey(key));
    if (!alias) continue;
    normalized.set(alias, String(value ?? "").trim());
  }

  for (const key of requiredKeys) {
    if (!normalized.get(key)) {
      throw new Error(`Row ${rowNumber}: missing required field "${key}"`);
    }
  }

  return {
    age: parseNumber(normalized.get("age")!, "age", rowNumber),
    gender: normalized.get("gender")!,
    maritalStatus: normalized.get("maritalStatus")!,
    education: normalized.get("education")!,
    location: normalized.get("location")!,
    workExperience: parseNumber(
      normalized.get("workExperience")!,
      "workExperience",
      rowNumber,
    ),
    income: parseNumber(normalized.get("income")!, "income", rowNumber),
    loanAmount: parseNumber(normalized.get("loanAmount")!, "loanAmount", rowNumber),
    creditHistory: normalized.get("creditHistory")!,
  };
}

async function postPrediction(
  apiBaseUrl: string,
  payload: PredictionInput,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/predictions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status} ${response.statusText}: ${body}`);
  }
}

async function main() {
  const csvPathArg = process.argv[2];
  const apiBaseUrl = (process.env.API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

  if (!csvPathArg) {
    throw new Error(
      "Missing CSV path. Usage: pnpm --filter @workspace/scripts run import-csv -- ./path/to/data.csv",
    );
  }

  const csvPath = path.resolve(process.cwd(), csvPathArg);
  const csvText = await readFile(csvPath, "utf8");

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as CsvRow[];

  if (records.length === 0) {
    throw new Error("CSV has no data rows.");
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const rowNumber = i + 2;
    try {
      const payload = mapRow(records[i]!, rowNumber);
      await postPrediction(apiBaseUrl, payload);
      success++;
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
    }
  }

  console.log(`Import complete. success=${success} failed=${failed} total=${records.length}`);
  if (errors.length > 0) {
    console.log("First errors:");
    for (const msg of errors.slice(0, 10)) {
      console.log(`- ${msg}`);
    }
  }

  if (success === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

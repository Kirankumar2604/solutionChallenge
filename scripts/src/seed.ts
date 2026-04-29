import { db } from "@workspace/db";
import { predictionsTable, settingsTable, biasAlertsTable } from "@workspace/db";

const GENDERS = ["Male", "Female", "Other"] as const;
const MARITAL = ["Single", "Married", "Divorced", "Widowed"] as const;
const EDU = ["High School", "Bachelors", "Masters", "PhD"] as const;
const LOC = ["Urban", "Suburban", "Rural"] as const;
const CREDIT = ["Excellent", "Good", "Fair", "Poor"] as const;

function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)] as T;
}
function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}
function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

const CREDIT_W: Record<string, number> = {
  Excellent: 0.35,
  Good: 0.2,
  Fair: -0.05,
  Poor: -0.3,
};
const EDU_W: Record<string, number> = {
  PhD: 0.12,
  Masters: 0.09,
  Bachelors: 0.05,
  "High School": 0,
};
const LOC_B: Record<string, number> = {
  Urban: 0.06,
  Suburban: 0.02,
  Rural: -0.07,
};
const GENDER_B: Record<string, number> = {
  Male: 0.05,
  Other: 0,
  Female: -0.07,
};
const MARITAL_B: Record<string, number> = {
  Married: 0.03,
  Single: 0,
  Divorced: -0.02,
  Widowed: -0.01,
};

async function main() {
  // Settings — ensure one row exists
  const exists = await db.select().from(settingsTable).limit(1);
  if (exists.length === 0) {
    await db.insert(settingsTable).values({});
  }

  // Clear and reseed
  await db.delete(predictionsTable);
  await db.delete(biasAlertsTable);

  const N = 90;
  for (let i = 0; i < N; i++) {
    const age = randInt(22, 65);
    const gender = pick(GENDERS);
    const maritalStatus = pick(MARITAL);
    const education = pick(EDU);
    const location = pick(LOC);
    const workExperience = randInt(0, Math.min(40, age - 18));
    const income = randInt(25000, 200000);
    const loanAmount = randInt(50000, 600000);
    const creditHistory = pick(CREDIT);

    const incomeRatio = loanAmount > 0 ? income / loanAmount : 5;
    const incomeFactor = clamp((incomeRatio - 1.5) * 0.18, -0.4, 0.5);
    const experienceFactor = clamp((workExperience - 2) * 0.025, -0.1, 0.25);
    const ageFactor = age >= 25 && age <= 55 ? 0.05 : -0.02;

    const logit =
      -0.3 +
      incomeFactor +
      experienceFactor +
      ageFactor +
      (CREDIT_W[creditHistory] ?? 0) +
      (EDU_W[education] ?? 0) +
      (LOC_B[location] ?? 0) +
      (GENDER_B[gender] ?? 0) +
      (MARITAL_B[maritalStatus] ?? 0);

    const rawScore = sigmoid(logit);
    const rawDecision = rawScore >= 0.5 ? "Approved" : "Rejected";

    const isUnderserved = gender === "Female" || location === "Rural";
    const protectedSwing =
      Math.abs(GENDER_B[gender] ?? 0) +
      Math.abs(LOC_B[location] ?? 0) +
      Math.abs(MARITAL_B[maritalStatus] ?? 0);
    const biasDetected = isUnderserved && protectedSwing > 0.05;
    let severity: "None" | "Low" | "Medium" | "High" = "None";
    if (biasDetected) {
      if (protectedSwing > 0.13) severity = "High";
      else if (protectedSwing > 0.09) severity = "Medium";
      else severity = "Low";
    }

    let mitigatedScore = rawScore;
    let mitigationApplied = false;
    if (biasDetected) {
      mitigatedScore = clamp(rawScore + 0.08, 0, 1);
      mitigationApplied = true;
    }
    const finalDecision = mitigatedScore >= 0.5 ? "Approved" : "Rejected";
    const confidence = clamp(
      finalDecision === "Approved" ? mitigatedScore : 1 - mitigatedScore,
      0.5,
      0.99,
    );

    const factors = [
      {
        label: "Credit History",
        weight: Math.abs(CREDIT_W[creditHistory] ?? 0) / 0.35,
        direction: (CREDIT_W[creditHistory] ?? 0) >= 0 ? "positive" : "negative",
      },
      {
        label: "Income vs Loan Amount",
        weight: Math.min(1, Math.abs(incomeFactor) / 0.5),
        direction: incomeFactor >= 0 ? "positive" : "negative",
      },
      {
        label: "Work Experience",
        weight: Math.min(1, Math.abs(experienceFactor) / 0.25),
        direction: experienceFactor >= 0 ? "positive" : "negative",
      },
      {
        label: "Education Level",
        weight: Math.min(1, Math.abs(EDU_W[education] ?? 0) / 0.12),
        direction: (EDU_W[education] ?? 0) >= 0 ? "positive" : "negative",
      },
      {
        label: "Age Bracket",
        weight: Math.min(1, Math.abs(ageFactor) / 0.05),
        direction: ageFactor >= 0 ? "positive" : "negative",
      },
    ].sort((a, b) => b.weight - a.weight);

    const explanation = mitigationApplied
      ? `The model produced a raw score of ${rawScore.toFixed(2)}, which would have ${rawDecision === "Approved" ? "approved" : "rejected"} this application. Bias was detected (${severity.toLowerCase()} severity); mitigation adjusted the score to ${mitigatedScore.toFixed(2)}.`
      : `The model produced a raw score of ${rawScore.toFixed(2)}. No bias was detected, so the prediction was passed through unchanged.`;

    const createdAt = new Date(Date.now() - randInt(0, 6) * 86400000 - randInt(0, 86400000));

    await db.insert(predictionsTable).values({
      age,
      gender,
      maritalStatus,
      education,
      location,
      workExperience,
      income,
      loanAmount,
      creditHistory,
      modelName: "LoanModel_v1.3",
      rawScore,
      mitigatedScore,
      rawDecision,
      finalDecision,
      confidence,
      biasDetected,
      severity,
      mitigationApplied,
      factors,
      explanation,
      processingTimeMs: randInt(35, 120),
      createdAt,
    });

    if (biasDetected && severity !== "None") {
      await db.insert(biasAlertsTable).values({
        message: `Bias detected for ${gender}/${location} applicant — ${severity.toLowerCase()} severity`,
        attribute: gender === "Female" ? "gender" : "location",
        group: gender === "Female" ? "Female" : location,
        metric: "Disparate Impact",
        value: rawScore,
        threshold: 0.5,
        severity: severity as "Low" | "Medium" | "High",
        createdAt,
      });
    }
  }

  console.log(`Seeded ${N} predictions.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

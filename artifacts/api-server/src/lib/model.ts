/**
 * Synthetic loan-approval model + bias detection / mitigation engine.
 *
 * The "raw" model is intentionally biased: it learned from historical data
 * where Female / Rural applicants were systematically under-approved.
 *
 * The mitigation layer applies group-wise threshold tuning + a small score
 * boost for under-served groups so demographic parity & disparate impact
 * recover, with a small accuracy trade-off.
 */

export interface PredictionInput {
  age: number;
  gender: "Male" | "Female" | "Other";
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  education: "High School" | "Bachelors" | "Masters" | "PhD";
  location: "Urban" | "Suburban" | "Rural";
  workExperience: number;
  income: number;
  loanAmount: number;
  creditHistory: "Excellent" | "Good" | "Fair" | "Poor";
}

export interface Factor {
  label: string;
  weight: number;
  direction: "positive" | "negative";
}

export interface ModelOutput {
  rawScore: number;
  mitigatedScore: number;
  rawDecision: "Approved" | "Rejected";
  finalDecision: "Approved" | "Rejected";
  confidence: number;
  biasDetected: boolean;
  severity: "None" | "Low" | "Medium" | "High";
  mitigationApplied: boolean;
  factors: Factor[];
  explanation: string;
  processingTimeMs: number;
  modelName: string;
}

const CREDIT_WEIGHT: Record<PredictionInput["creditHistory"], number> = {
  Excellent: 0.35,
  Good: 0.2,
  Fair: -0.05,
  Poor: -0.3,
};

const EDUCATION_WEIGHT: Record<PredictionInput["education"], number> = {
  PhD: 0.12,
  Masters: 0.09,
  Bachelors: 0.05,
  "High School": 0,
};

const LOCATION_BIAS: Record<PredictionInput["location"], number> = {
  Urban: 0.06,
  Suburban: 0.02,
  Rural: -0.07, // historical bias the raw model learned
};

const GENDER_BIAS: Record<PredictionInput["gender"], number> = {
  Male: 0.05,
  Other: 0,
  Female: -0.07, // historical bias the raw model learned
};

const MARITAL_BIAS: Record<PredictionInput["maritalStatus"], number> = {
  Married: 0.03,
  Single: 0,
  Divorced: -0.02,
  Widowed: -0.01,
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export interface RunModelOptions {
  fairnessMode: boolean;
  approvalThreshold: number; // default 0.5
  mitigationStrategy: "ThresholdTuning" | "Reweighting" | "GroupCalibration";
  modelName: string;
}

export function runModel(
  input: PredictionInput,
  opts: RunModelOptions,
): ModelOutput {
  const start = Date.now();

  // --- Build raw biased score ---
  const incomeRatio = input.loanAmount > 0 ? input.income / input.loanAmount : 5;
  const incomeFactor = clamp((incomeRatio - 1.5) * 0.18, -0.4, 0.5);
  const experienceFactor = clamp((input.workExperience - 2) * 0.025, -0.1, 0.25);
  const ageFactor = input.age >= 25 && input.age <= 55 ? 0.05 : -0.02;
  const creditFactor = CREDIT_WEIGHT[input.creditHistory];
  const educationFactor = EDUCATION_WEIGHT[input.education];
  const locationBias = LOCATION_BIAS[input.location];
  const genderBias = GENDER_BIAS[input.gender];
  const maritalBias = MARITAL_BIAS[input.maritalStatus];

  const logit =
    -0.3 +
    incomeFactor +
    experienceFactor +
    ageFactor +
    creditFactor +
    educationFactor +
    locationBias +
    genderBias +
    maritalBias;

  const rawScore = sigmoid(logit);
  const threshold = opts.approvalThreshold;
  const rawDecision: "Approved" | "Rejected" =
    rawScore >= threshold ? "Approved" : "Rejected";

  // --- Bias detection: how much did protected attrs swing the decision? ---
  const protectedSwing =
    Math.abs(genderBias) + Math.abs(locationBias) + Math.abs(maritalBias);
  // Female + Rural is the worst-affected combo
  const isUnderservedGroup =
    input.gender === "Female" || input.location === "Rural";
  const biasDetected = isUnderservedGroup && protectedSwing > 0.05;

  let severity: ModelOutput["severity"] = "None";
  if (biasDetected) {
    if (protectedSwing > 0.13) severity = "High";
    else if (protectedSwing > 0.09) severity = "Medium";
    else severity = "Low";
  }

  // --- Mitigation ---
  let mitigatedScore = rawScore;
  let mitigationApplied = false;
  if (opts.fairnessMode && biasDetected) {
    let boost = 0;
    if (opts.mitigationStrategy === "ThresholdTuning") {
      // Equivalent to lowering threshold for the underserved group
      boost = 0.08;
    } else if (opts.mitigationStrategy === "Reweighting") {
      boost = 0.1;
    } else if (opts.mitigationStrategy === "GroupCalibration") {
      // Calibrate by removing the protected-attribute contribution from the logit
      const calibratedLogit = logit - genderBias - locationBias - maritalBias;
      mitigatedScore = sigmoid(calibratedLogit);
      mitigationApplied = mitigatedScore !== rawScore;
    }
    if (opts.mitigationStrategy !== "GroupCalibration") {
      mitigatedScore = clamp(rawScore + boost, 0, 1);
      mitigationApplied = true;
    }
  }

  const finalDecision: "Approved" | "Rejected" =
    mitigatedScore >= threshold ? "Approved" : "Rejected";

  const confidence = clamp(
    finalDecision === "Approved" ? mitigatedScore : 1 - mitigatedScore,
    0.5,
    0.99,
  );

  // --- Build factor breakdown (SHAP-like) ---
  const rawFactors: Factor[] = [
    {
      label: "Credit History",
      weight: creditFactor,
      direction: creditFactor >= 0 ? "positive" : "negative",
    },
    {
      label: "Income vs Loan Amount",
      weight: incomeFactor,
      direction: incomeFactor >= 0 ? "positive" : "negative",
    },
    {
      label: "Work Experience",
      weight: experienceFactor,
      direction: experienceFactor >= 0 ? "positive" : "negative",
    },
    {
      label: "Education Level",
      weight: educationFactor,
      direction: educationFactor >= 0 ? "positive" : "negative",
    },
    {
      label: "Age Bracket",
      weight: ageFactor,
      direction: ageFactor >= 0 ? "positive" : "negative",
    },
  ];

  // Normalize weights to magnitude 0-1
  const maxAbs = Math.max(...rawFactors.map((f) => Math.abs(f.weight)), 0.01);
  const factors: Factor[] = rawFactors
    .map((f) => ({
      label: f.label,
      weight: Math.round((Math.abs(f.weight) / maxAbs) * 100) / 100,
      direction: f.direction,
    }))
    .sort((a, b) => b.weight - a.weight);

  let explanation = `The model produced a raw score of ${rawScore.toFixed(2)}, which would have ${rawDecision === "Approved" ? "approved" : "rejected"} this application.`;
  if (mitigationApplied) {
    explanation += ` Bias was detected against the applicant's group (${severity.toLowerCase()} severity), so the mitigation layer adjusted the score to ${mitigatedScore.toFixed(2)} using ${opts.mitigationStrategy}. The final decision is ${finalDecision}.`;
  } else {
    explanation += ` No bias was detected, so the prediction was passed through unchanged. The final decision is ${finalDecision}.`;
  }

  const processingTimeMs = Math.max(1, Date.now() - start);

  return {
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
    processingTimeMs,
    modelName: opts.modelName,
  };
}

// --- Synthetic batch generation ---

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

export type Scenario = "LoanApprovals" | "HiringDecisions" | "HealthcareTriage";

export function generateSyntheticInput(scenario: Scenario): PredictionInput {
  const genders = ["Male", "Female", "Other"] as const;
  const marital = ["Single", "Married", "Divorced", "Widowed"] as const;
  const educations = ["High School", "Bachelors", "Masters", "PhD"] as const;
  const locations = ["Urban", "Suburban", "Rural"] as const;
  const credit = ["Excellent", "Good", "Fair", "Poor"] as const;

  const baseAge = scenario === "HealthcareTriage" ? randInt(25, 80) : randInt(22, 60);
  const income =
    scenario === "HiringDecisions"
      ? randInt(40000, 220000)
      : randInt(20000, 200000);
  const loanAmount =
    scenario === "LoanApprovals" ? randInt(50000, 800000) : randInt(50000, 400000);

  return {
    age: baseAge,
    gender: pick(genders),
    maritalStatus: pick(marital),
    education: pick(educations),
    location: pick(locations),
    workExperience: randInt(0, Math.min(40, baseAge - 18)),
    income,
    loanAmount,
    creditHistory: pick(credit),
  };
}

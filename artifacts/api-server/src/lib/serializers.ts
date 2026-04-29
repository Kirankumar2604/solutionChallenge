import type { Prediction, BiasAlert, Settings } from "@workspace/db";

export function serializePrediction(p: Prediction) {
  return {
    id: p.id,
    finalDecision: p.finalDecision as "Approved" | "Rejected",
    rawDecision: p.rawDecision as "Approved" | "Rejected",
    confidence: p.confidence,
    rawScore: p.rawScore,
    mitigatedScore: p.mitigatedScore,
    biasDetected: p.biasDetected,
    severity: p.severity as "None" | "Low" | "Medium" | "High",
    mitigationApplied: p.mitigationApplied,
    factors: p.factors as Array<{
      label: string;
      weight: number;
      direction: "positive" | "negative";
    }>,
    explanation: p.explanation,
    processingTimeMs: p.processingTimeMs,
    modelName: p.modelName,
    input: {
      age: p.age,
      gender: p.gender as "Male" | "Female" | "Other",
      maritalStatus: p.maritalStatus as
        | "Single"
        | "Married"
        | "Divorced"
        | "Widowed",
      education: p.education as
        | "High School"
        | "Bachelors"
        | "Masters"
        | "PhD",
      location: p.location as "Urban" | "Suburban" | "Rural",
      workExperience: p.workExperience,
      income: p.income,
      loanAmount: p.loanAmount,
      creditHistory: p.creditHistory as "Excellent" | "Good" | "Fair" | "Poor",
    },
    createdAt: p.createdAt.toISOString(),
  };
}

export function serializeAlert(a: BiasAlert) {
  return {
    id: a.id,
    message: a.message,
    attribute: a.attribute,
    group: a.group,
    metric: a.metric,
    value: a.value,
    threshold: a.threshold,
    severity: a.severity as "Low" | "Medium" | "High",
    createdAt: a.createdAt.toISOString(),
  };
}

export function serializeSettings(s: Settings) {
  return {
    id: s.id,
    fairnessMode: s.fairnessMode,
    approvalThreshold: s.approvalThreshold,
    demographicParityThreshold: s.demographicParityThreshold,
    disparateImpactThreshold: s.disparateImpactThreshold,
    mitigationStrategy: s.mitigationStrategy as
      | "ThresholdTuning"
      | "Reweighting"
      | "GroupCalibration",
    protectedAttributes: s.protectedAttributes as string[],
    modelName: s.modelName,
    updatedAt: s.updatedAt.toISOString(),
  };
}

import { Router, type IRouter } from "express";
import {
  CreatePredictionBody,
  ListPredictionsQueryParams,
  GetPredictionParams,
  RunBatchPredictionBody,
} from "@workspace/api-zod";
import {
  runModel,
  generateSyntheticInput,
  type Scenario,
} from "../lib/model.js";
import {
  insertPrediction,
  listPredictions,
  getPrediction,
  getOrCreateSettings,
  insertAlert,
} from "../lib/store.js";
import { serializePrediction } from "../lib/serializers.js";
import {
  aggregateByGroup,
  computeMetrics,
  type Attribute,
} from "../lib/fairness.js";
import { listAllPredictions } from "../lib/store.js";

const router: IRouter = Router();

router.get("/predictions", async (req, res) => {
  const params = ListPredictionsQueryParams.parse(req.query);
  const rows = await listPredictions({
    limit: params.limit,
    group: params.group,
    biasOnly: params.biasOnly,
  });
  res.json(rows.map(serializePrediction));
});

router.get("/predictions/:id", async (req, res) => {
  const { id } = GetPredictionParams.parse(req.params);
  const row = await getPrediction(id);
  if (!row) {
    res.status(404).json({ error: "Prediction not found" });
    return;
  }
  res.json(serializePrediction(row));
});

router.post("/predictions", async (req, res) => {
  const input = CreatePredictionBody.parse(req.body);
  const settings = await getOrCreateSettings();
  const result = runModel(input, {
    fairnessMode: settings.fairnessMode,
    approvalThreshold: settings.approvalThreshold,
    mitigationStrategy: settings.mitigationStrategy as
      | "ThresholdTuning"
      | "Reweighting"
      | "GroupCalibration",
    modelName: settings.modelName,
  });

  const created = await insertPrediction({
    age: input.age,
    gender: input.gender,
    maritalStatus: input.maritalStatus,
    education: input.education,
    location: input.location,
    workExperience: input.workExperience,
    income: input.income,
    loanAmount: input.loanAmount,
    creditHistory: input.creditHistory,
    modelName: result.modelName,
    rawScore: result.rawScore,
    mitigatedScore: result.mitigatedScore,
    rawDecision: result.rawDecision,
    finalDecision: result.finalDecision,
    confidence: result.confidence,
    biasDetected: result.biasDetected,
    severity: result.severity,
    mitigationApplied: result.mitigationApplied,
    factors: result.factors,
    explanation: result.explanation,
    processingTimeMs: result.processingTimeMs,
  });

  if (result.biasDetected && result.severity !== "None") {
    await insertAlert({
      message: `Bias detected for ${input.gender}/${input.location} applicant — ${result.severity.toLowerCase()} severity`,
      attribute: input.gender === "Female" ? "gender" : "location",
      group: input.gender === "Female" ? "Female" : input.location,
      metric: "Disparate Impact",
      value: result.rawScore,
      threshold: settings.approvalThreshold,
      severity: result.severity as "Low" | "Medium" | "High",
    });
  }

  res.json(serializePrediction(created));
});

router.post("/predictions/batch", async (req, res) => {
  const body = RunBatchPredictionBody.parse(req.body);
  const settings = await getOrCreateSettings();

  const created = [] as Awaited<ReturnType<typeof insertPrediction>>[];
  for (let i = 0; i < body.count; i++) {
    const input = generateSyntheticInput(body.scenario as Scenario);
    const result = runModel(input, {
      fairnessMode: settings.fairnessMode,
      approvalThreshold: settings.approvalThreshold,
      mitigationStrategy: settings.mitigationStrategy as
        | "ThresholdTuning"
        | "Reweighting"
        | "GroupCalibration",
      modelName: settings.modelName,
    });
    const row = await insertPrediction({
      age: input.age,
      gender: input.gender,
      maritalStatus: input.maritalStatus,
      education: input.education,
      location: input.location,
      workExperience: input.workExperience,
      income: input.income,
      loanAmount: input.loanAmount,
      creditHistory: input.creditHistory,
      modelName: result.modelName,
      rawScore: result.rawScore,
      mitigatedScore: result.mitigatedScore,
      rawDecision: result.rawDecision,
      finalDecision: result.finalDecision,
      confidence: result.confidence,
      biasDetected: result.biasDetected,
      severity: result.severity,
      mitigationApplied: result.mitigationApplied,
      factors: result.factors,
      explanation: result.explanation,
      processingTimeMs: result.processingTimeMs,
      scenario: body.scenario,
    });
    created.push(row);
  }

  const all = await listAllPredictions();
  const groups = aggregateByGroup(all, "gender" as Attribute);
  computeMetrics(groups, {
    demographicParity: settings.demographicParityThreshold,
    disparateImpact: settings.disparateImpactThreshold,
  });

  const approvedCount = created.filter(
    (c) => c.finalDecision === "Approved",
  ).length;
  const rejectedCount = created.filter(
    (c) => c.finalDecision === "Rejected",
  ).length;
  const biasDetectedCount = created.filter((c) => c.biasDetected).length;
  const mitigationsApplied = created.filter((c) => c.mitigationApplied).length;

  // group breakdown across the just-created batch by gender
  const breakdown = aggregateByGroup(created, "gender");

  res.json({
    totalProcessed: created.length,
    approvedCount,
    rejectedCount,
    biasDetectedCount,
    mitigationsApplied,
    scenario: body.scenario,
    groupBreakdown: breakdown,
  });
});

export default router;

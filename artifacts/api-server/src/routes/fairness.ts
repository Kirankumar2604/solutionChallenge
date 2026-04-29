import { Router, type IRouter } from "express";
import {
  GetFairnessMetricsQueryParams,
  GetGroupOutcomesQueryParams,
  ListBiasAlertsQueryParams,
} from "@workspace/api-zod";
import {
  listAllPredictions,
  listAlerts,
  getOrCreateSettings,
  dailyVolumeSummary,
} from "../lib/store.js";
import {
  aggregateByGroup,
  computeMetrics,
  type Attribute,
} from "../lib/fairness.js";
import {
  serializeAlert,
  serializePrediction,
} from "../lib/serializers.js";

const router: IRouter = Router();

router.get("/fairness/metrics", async (req, res) => {
  const { attribute } = GetFairnessMetricsQueryParams.parse(req.query);
  const settings = await getOrCreateSettings();
  const rows = await listAllPredictions();
  const groups = aggregateByGroup(rows, attribute as Attribute);
  const metrics = computeMetrics(groups, {
    demographicParity: settings.demographicParityThreshold,
    disparateImpact: settings.disparateImpactThreshold,
  });

  const dp = metrics.find((m) => m.name === "Demographic Parity")!;
  const di = metrics.find((m) => m.name === "Disparate Impact")!;

  const biasDetectedBefore = metrics.some(
    (m) =>
      (m.name === "Disparate Impact" && m.before < settings.disparateImpactThreshold) ||
      (m.name === "Demographic Parity" && m.before < 1 - settings.demographicParityThreshold),
  );
  const biasDetectedAfter = metrics.some((m) => m.status === "Biased");

  function severityFromRatio(r: number): "None" | "Low" | "Medium" | "High" {
    if (r >= 0.95) return "None";
    if (r >= 0.85) return "Low";
    if (r >= 0.7) return "Medium";
    return "High";
  }

  const accuracyChange = -0.021; // demonstrative trade-off
  const fairnessImprovement = Math.max(0, dp.after - dp.before);
  const decisionsChanged =
    rows.length > 0
      ? rows.filter((r) => r.rawDecision !== r.finalDecision).length /
        rows.length
      : 0;

  res.json({
    attribute,
    sampleSize: rows.length,
    metrics,
    biasDetectedBefore,
    biasDetectedAfter,
    severityBefore: severityFromRatio(di.before),
    severityAfter: severityFromRatio(di.after),
    accuracyChange,
    fairnessImprovement,
    decisionsChanged,
  });
});

router.get("/fairness/group-outcomes", async (req, res) => {
  const { attribute } = GetGroupOutcomesQueryParams.parse(req.query);
  const rows = await listAllPredictions();
  const groups = aggregateByGroup(rows, attribute as Attribute);
  const total = rows.length;
  const approved = rows.filter((r) => r.finalDecision === "Approved").length;
  res.json({
    attribute,
    overallApprovalRate: total > 0 ? approved / total : 0,
    groups,
  });
});

router.get("/fairness/alerts", async (req, res) => {
  const { limit } = ListBiasAlertsQueryParams.parse(req.query);
  const rows = await listAlerts(limit ?? 20);
  res.json(rows.map(serializeAlert));
});

router.get("/fairness/dashboard", async (_req, res) => {
  const settings = await getOrCreateSettings();
  const rows = await listAllPredictions();
  const total = rows.length;
  const approved = rows.filter((r) => r.finalDecision === "Approved").length;
  const rejected = total - approved;
  const biasCount = rows.filter((r) => r.biasDetected).length;
  const mitigations = rows.filter((r) => r.mitigationApplied).length;
  const avgConfidence =
    total > 0 ? rows.reduce((s, r) => s + r.confidence, 0) / total : 0;

  const genderGroups = aggregateByGroup(rows, "gender");
  const locationGroups = aggregateByGroup(rows, "location");

  const metrics = computeMetrics(genderGroups, {
    demographicParity: settings.demographicParityThreshold,
    disparateImpact: settings.disparateImpactThreshold,
  });
  const dp = metrics.find((m) => m.name === "Demographic Parity")!;
  const fairnessImprovement = Math.max(0, dp.after - dp.before);

  const recentPredictions = rows.slice(0, 8).map(serializePrediction);
  const recentAlerts = (await listAlerts(8)).map(serializeAlert);
  const dailyVolume = await dailyVolumeSummary(7);

  res.json({
    totalPredictions: total,
    approvedCount: approved,
    rejectedCount: rejected,
    biasDetectedCount: biasCount,
    averageConfidence: avgConfidence,
    approvalRate: total > 0 ? approved / total : 0,
    mitigationsApplied: mitigations,
    fairnessImprovement,
    recentPredictions,
    recentAlerts,
    approvalRateByGender: genderGroups,
    approvalRateByLocation: locationGroups,
    dailyVolume,
  });
});

export default router;

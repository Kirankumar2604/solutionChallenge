# FairLens

## Overview

FairLens is a real-time AI bias detection, mitigation, and explainability dashboard. It scores hiring/loan/healthcare applicants, detects bias against protected groups (gender, location, education) in real time, applies dynamic mitigation, and presents decisions with explainability.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js**: 24 / TypeScript 5.9
- **API**: Express 5 (in `artifacts/api-server`)
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval — OpenAPI spec at `lib/api-spec/openapi.yaml`
- **Frontend**: React + Vite + Tailwind + shadcn/ui + Recharts (`artifacts/fairlens`)
- **Routing**: wouter
- **Data fetching**: TanStack Query via generated hooks in `@workspace/api-client-react`

## Architecture

- **Synthetic biased model** (`artifacts/api-server/src/lib/model.ts`): Logistic-style scorer that intentionally encodes historical bias against Female / Rural / certain marital-status applicants.
- **Bias detection**: Flags predictions where protected-attribute contribution to the logit exceeds a threshold; severity (Low/Medium/High) is derived from contribution magnitude.
- **Mitigation strategies**: ThresholdTuning, Reweighting, GroupCalibration (configured in Settings).
- **Fairness metrics** (`artifacts/api-server/src/lib/fairness.ts`): Demographic Parity, Equal Opportunity, Disparate Impact, Statistical Parity Difference — computed before vs after mitigation across configurable protected attributes.
- **Persistence**: All predictions and bias alerts are stored in Postgres for the dashboard, logs, and explainability views.

## Pages

- `/` Dashboard — KPIs, approval-rate-by-group charts, recent predictions, alerts feed
- `/new-prediction` — Submit an applicant, see decision + mitigation in real time
- `/batch-prediction` — Run synthetic batches (LoanApprovals / HiringDecisions / HealthcareTriage)
- `/bias-monitor` — Live fairness metrics with attribute toggle
- `/explainability` — Per-prediction factor breakdown and natural-language explanation
- `/logs` — Filterable history of all predictions
- `/settings` — Fairness mode, thresholds, mitigation strategy

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/scripts run seed` — reset and seed 90 demo predictions

See the `pnpm-workspace` skill for workspace structure.

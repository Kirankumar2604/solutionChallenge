# FairLens

FairLens is a real-time AI bias detection, mitigation, and explainability platform.

It scores applicant-like inputs (loan, hiring, healthcare-style scenarios), detects potential bias across protected attributes, applies configurable mitigation, and visualizes impact through a dashboard.

## Monorepo Structure

- `artifacts/api-server`: Express API (prediction engine, fairness metrics, settings, alerts)
- `artifacts/fairlens`: React + Vite frontend dashboard
- `lib/db`: Drizzle ORM schema + database package
- `lib/api-spec`: Gemini API source and code generation config (Orval)
- `lib/api-client-react`: generated React Query API client
- `lib/api-zod`: generated Zod schemas/types
- `scripts`: utilities like seeding synthetic data

## Tech Stack

- TypeScript + pnpm workspaces
- Express 5 (API)
- PostgreSQL + Drizzle ORM
- React + Vite + Tailwind + shadcn/ui (frontend)
- Orval (Gemini API -> typed client + Zod models)

## Core Features

- Real-time prediction scoring with intentionally bias-sensitive synthetic model behavior
- Bias detection by protected-attribute contribution and severity labeling
- Mitigation strategies:
  - ThresholdTuning
  - Reweighting
  - GroupCalibration
- Fairness reporting:
  - Demographic Parity
  - Equal Opportunity
  - Disparate Impact
  - Statistical Parity Difference
- Dashboard, logs, alerts, explainability, and settings management

## API Endpoints (high-level)

All endpoints are under `/api`.

- `GET /healthz`
- `GET /predictions`
- `GET /predictions/:id`
- `POST /predictions`
- `POST /predictions/batch`
- `GET /fairness/metrics`
- `GET /fairness/group-outcomes`
- `GET /fairness/alerts`
- `GET /fairness/dashboard`
- `GET /settings`
- `PUT /settings`

## Prerequisites

- Node.js 24+
- pnpm
- PostgreSQL database

## Environment Variables

Required:

- `DATABASE_URL`: Postgres connection string (required by `lib/db` and DB tooling)
- `PORT`: required by API server and Vite config
- `BASE_PATH`: required by Vite (`/` is a safe default for local dev)

Example:

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/fairlens"
export PORT=4000
export BASE_PATH="/"
```

## Setup

```bash
pnpm install
pnpm run typecheck
```

## Database Setup

Push schema:

```bash
pnpm --filter @workspace/db run push
```

Seed demo data (90 synthetic predictions):

```bash
pnpm --filter @workspace/scripts run seed
```

## Run the Apps

API server:

```bash
PORT=4000 pnpm --filter @workspace/api-server run dev
```

Frontend (in another terminal):

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/fairlens run dev
```

Notes:

- The generated client calls `/api/...` routes.
- In hosted/reverse-proxied environments, this usually works out of the box.
- For custom local networking setups, route frontend `/api` requests to the API server origin.

## Useful Commands

- `pnpm run typecheck`: full workspace typecheck
- `pnpm run build`: workspace build
- `pnpm --filter @workspace/api-spec run codegen`: regenerate API client + Zod from OpenAPI
- `pnpm --filter @workspace/db run push`: push DB schema
- `pnpm --filter @workspace/scripts run seed`: reseed demo data

## Product Pages

- `/`: dashboard (KPIs, fairness summary, alerts, trends)
- `/new-prediction`: single prediction + mitigation insight
- `/batch-prediction`: synthetic batch runs by scenario
- `/bias-monitor`: fairness metrics and group outcomes
- `/explainability`: per-prediction factor breakdown
- `/logs`: prediction history
- `/settings`: fairness mode, thresholds, mitigation settings

## Development Notes

- OpenAPI source lives in `lib/api-spec/openapi.yaml`.
- Generated files are consumed through `@workspace/api-client-react` and `@workspace/api-zod`.
- Keep API contracts updated by rerunning codegen when endpoint schemas change.

description: Execute only Phase 5 of the canonical build workflow

Use CLAUDE.md and the canonical master prompt as binding instructions.

Execute ONLY Phase 5:
Enterprise dashboard and Generative UI.

Scope:

dashboard route groups

auth/role gating

owner/manager/stylist/receptionist views

bento grid

AI provider

ai-analytics.tsx

chart components

prom registry page and AI extraction flow

Constraints:

Do not invent Phase 6, 7, or 8

Use tenant-scoped DB access for AI analytics

Use zod-validated tool params

Use streamed RSC UI with skeleton first

Required checkpoint output:

dashboard routing structure

dashboard layout/auth files

owner/manager/stylist/receptionist key pages

ai-provider.tsx

ai-analytics.tsx

ChartSkeleton.tsx

StylistUtilizationChart.tsx

prom registry page/action

commands run

validation results for lint, typecheck, build

unresolved risks

Stop and ask for approval when done.
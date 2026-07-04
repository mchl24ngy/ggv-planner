# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Immo PV Planer (ggv-planner) is a client-side React/TypeScript tool for calculating the economics and energy flows of German "Mieterstrom" (tenant electricity) and "GGV" (Gemeinschaftliche Gebäudeversorgung) solar PV projects. There is no backend — everything runs in the browser, state lives in React `useState`, and results are computed synchronously/async in `src/lib/`.
Project addresses non-technical users. Therefor the app need to be as easy as possible to use regarding user journey and technical context.

## Commands

```bash
npm run dev             # Start Vite dev server (proxies /pvgis-api/* to PVGIS EU API)
npm run build           # tsc -b && vite build
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint
npm run format          # Prettier --write on src/
npm run format:check    # Prettier check only
npm run check-all       # typecheck + lint + format:check (run before committing)
npm run fix-all         # format + lint --fix

npm test                # vitest run (single run, e.g. CI)
npm run test:watch      # vitest watch mode
npm run test:coverage   # vitest run --coverage (report in coverage/, gitignored)
```

To run a single test file: `npx vitest run tests/lib/calculations.test.ts`. To filter by test name: `npx vitest run -t "<name>"`.

## Architecture

### Data flow

Four input structs flow through the app: `SystemParams` (PV system, location, battery), `ConsumptionParams` (apartments, heat pump, EV, general load), `EconomicParams` (Mieterstrom vs. GGV model, tariffs, CAPEX/OPEX), `FinancingParams` (loan). All are defined in `src/types/index.ts` and owned as `useState` in `src/components/Configurator.tsx` (the single stateful orchestrator — ~2000 lines, holds all inputs, triggers recalculation, and renders the tabbed UI).

Calculation pipeline (all pure functions in `src/lib/`, called from `Configurator.tsx`):

1. `fetchPvgisYield` / `fetchPvgisMonthlyYield` (`calculations.ts`, `energyFlowCalculation.ts`) — yearly and monthly PV yield from the PVGIS v5.2 API, with a Central-Europe seasonal-distribution fallback when coordinates are missing or the API fails.
2. `calculateEnergyYield` (`calculations.ts`) — annual energy balance: self-consumption, grid supply/export, autarky rate, using a simplified heuristic (not 15-min load profiles) with an 85% self-consumption cap and a battery factor.
3. `calculateMonthlyEnergyFlows` (`energyFlowCalculation.ts`) — per-month energy flow using a daily-buffer battery model (charge by day, discharge by night, no cross-month carryover). Algorithm is documented step-by-step in `docu/energy-flow-algorithm.md` — read that before touching this function.
4. `calculateEconomics` (`calculations.ts`) — 20-year cashflow projection: annuity loan formula, GGV vs. Mieterstrom revenue models (base fee vs. subsidy), LCOE, amortization year, cumulative cashflow.

CAPEX/OPEX default values (auto-derived, editable via "Kosten aufschlüsseln"/breakdown modal) come from tiered pricing in `src/lib/avgCostConfig.ts` (`PV_COST_TIERS`, `BATTERY_COST_TIERS`, `TECH_MANAGEMENT_RATE`, `BILLING_COST_PER_PARTICIPANT`). Once a user edits a value in the breakdown modal, it is treated as manually overridden and no longer auto-recalculated.

### i18n

Custom lightweight i18n, not a library: `src/i18n/translations.ts` holds `de`/`en` string tables, `LanguageContext.tsx` provides them via context (browser-language auto-detect on first load), `useLanguage.ts` is the consumer hook. All UI copy must be added to both language tables in `translations.ts`.

### PVGIS proxy requirement

The EU PVGIS API has no CORS support, so all calls go through `/pvgis-api/*`, which must be proxied server-side:

- Local dev: proxied automatically by `vite.config.ts`.
- Netlify: proxied via `netlify.toml` redirect rule.
- Other platforms (Vercel, Nginx, etc.): need equivalent proxy config — see `docu/deployment.md`.

The base path is overridable via `VITE_PVGIS_BASE_URL` (defaults to `/pvgis-api/api/v5_2`).

### Export/import

`src/lib/jsonExport.ts` serializes/deserializes the full input state (`GgvPlannerExportUi`) for save/load. `src/lib/pdfExport.ts` generates a PDF report via jsPDF/jspdf-autotable/html2canvas.

### Optional integrations (no-op if unconfigured)

- `VITE_FORMBRICKS_WORKSPACE_ID` — enables the in-app feedback/survey button (`@formbricks/js`). Absent → button does nothing.
- `react-joyride`-based onboarding lives in `src/components/TutorialWalkthrough.tsx` / `WelcomeModal.tsx`.

## Testing conventions

Tests live in `tests/lib/`, mirroring `src/lib/`, and cover only calculation logic (`calculations.test.ts`, `energyFlowCalculation.test.ts`) — no component/UI tests exist. Each test file defines fixture builders (`mkSystem`, `mkConsumption`, `mkEconomics`, `mkFinancing`) that provide sensible defaults; override only the fields relevant to the test case. New calculation functions should get corresponding tests in `tests/lib/`.

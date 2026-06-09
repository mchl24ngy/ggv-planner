# Deployment Guide

[Deutsch](#deutsch) | [English](#english)

---

<a name="deutsch"></a>
## 🇩🇪 Deutsch

### Umgebungsvariablen

Lege eine `.env`-Datei im Projektstammverzeichnis an (Vorlage: `.env_example`):

| Variable | Pflicht | Beschreibung |
|---|---|---|
| `VITE_PVGIS_BASE_URL` | Nein | Basis-URL für die PVGIS-API. Standard: `/pvgis-api/api/v5_2` (geht durch den konfigurierten Proxy) |
| `VITE_FORMBRICKS_WORKSPACE_ID` | Nein | Workspace-ID aus dem Formbricks-Dashboard. Aktiviert den „Feedback & Support"-Button in der Sidebar. Ohne diese Variable bleibt der Button stumm. |

> Die Adress-Autovervollständigung nutzt [Photon (Komoot)](https://photon.komoot.io/) auf Basis von OpenStreetMap – kein API-Key notwendig.

#### Formbricks einrichten (optional)

[Formbricks](https://formbricks.com/) ermöglicht In-App-Umfragen, die über einen Button in der Sidebar geöffnet werden können.

**Schritte:**

1. Konto bei [app.formbricks.com](https://app.formbricks.com) anlegen (kostenloser Cloud-Plan verfügbar)
2. Eine **App Survey** erstellen (Typ: *App Survey*, nicht *Link Survey*)
3. Als Auslöser einen **Code-Trigger** mit dem Event-Schlüssel `support` konfigurieren
4. Survey auf **Live** schalten
5. Die **Workspace-ID** unter *Settings → General* kopieren
6. In `.env` eintragen: `VITE_FORMBRICKS_WORKSPACE_ID=<deine-id>`
7. Für Netlify: Variable zusätzlich unter *Site settings → Environment variables* setzen

> Ist `VITE_FORMBRICKS_WORKSPACE_ID` nicht gesetzt, wird Formbricks nicht initialisiert – das App-Verhalten ändert sich nicht.

#### Hinweis zur PVGIS-API

Die [PVGIS-API der EU-Kommission](https://re.jrc.ec.europa.eu/pvg_tools/en/) unterstützt **keine direkten Browser-Anfragen** (kein CORS). Anfragen müssen über einen serverseitigen Proxy geleitet werden. Für lokale Entwicklung und Netlify-Deployments ist dies bereits vorkonfiguriert (siehe unten).

---

### Lokale Entwicklung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. .env anlegen (optional, nur falls PVGIS_BASE_URL angepasst werden soll)
cp .env.example .env

# 3. Entwicklungsserver starten
npm run dev
```

Der Vite-Dev-Server proxied automatisch alle Anfragen an `/pvgis-api/*` an `https://re.jrc.ec.europa.eu`. Keine weitere Konfiguration nötig.

---

### Deployment auf Netlify

Die Datei [`netlify.toml`](../netlify.toml) im Projektstammverzeichnis enthält bereits eine Proxy-Regel für die PVGIS-API:

```toml
[[redirects]]
  from = "/pvgis-api/*"
  to   = "https://re.jrc.ec.europa.eu/:splat"
  status = 200
  force  = true
```

**Schritte:**

1. Repository mit Netlify verbinden (GitHub → Netlify → "New site from Git")
2. Build-Einstellungen:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Umgebungsvariablen in Netlify setzen:
   - `VITE_PVGIS_BASE_URL` → `/pvgis-api/api/v5_2` (entspricht dem Proxy-Pfad aus `netlify.toml`)
4. Deploy auslösen

Die PVGIS-Proxy-Regel greift automatisch, sobald `netlify.toml` im Repository vorhanden ist.

---

### Deployment auf anderen Plattformen

Für andere Hosting-Plattformen muss der PVGIS-Proxy separat konfiguriert werden.

#### Vercel

Erstelle eine `vercel.json` im Projektstammverzeichnis:

```json
{
  "rewrites": [
    {
      "source": "/pvgis-api/:path*",
      "destination": "https://re.jrc.ec.europa.eu/:path*"
    }
  ]
}
```

Setze anschließend `VITE_PVGIS_BASE_URL=/pvgis-api/api/v5_2` als Umgebungsvariable in den Vercel-Projekteinstellungen.

#### Nginx

```nginx
location /pvgis-api/ {
    proxy_pass https://re.jrc.ec.europa.eu/;
    proxy_set_header Host re.jrc.ec.europa.eu;
}
```

Setze `VITE_PVGIS_BASE_URL` beim Build auf die öffentliche URL deines Proxys, z. B.:

```bash
VITE_PVGIS_BASE_URL=https://deine-domain.de/pvgis-api/api/v5_2 npm run build
```

---

### Marktdurchschnittswerte anpassen

Die automatisch berechneten CAPEX-Richtwerte (PV-Anlage und Batteriespeicher) sind zentral in einer einzigen Datei gespeichert:

```
src/lib/avgCostConfig.ts
```

Dort sind die Preisstaffeln als Arrays definiert:

```ts
// PV-Anlage: €/kWp je Größenstufe
export const PV_COST_TIERS: CostTier[] = [
  { upTo: 20, pricePerUnit: 1400 },   // bis 20 kWp
  { upTo: 50, pricePerUnit: 1100 },   // 20–50 kWp
  { upTo: Infinity, pricePerUnit: 950 }, // ab 50 kWp
];

// Batteriespeicher: €/kWh je Kapazitätsstufe
export const BATTERY_COST_TIERS: CostTier[] = [
  { upTo: 15, pricePerUnit: 600 },    // bis 15 kWh
  { upTo: 30, pricePerUnit: 450 },    // 15–30 kWh
  { upTo: Infinity, pricePerUnit: 350 }, // 30–100 kWh
];

// OPEX-Pauschalen
export const TECH_MANAGEMENT_RATE = 0.01;        // 1 % des CAPEX pro Jahr
export const BILLING_COST_PER_PARTICIPANT = 150; // €/Jahr je Vertragspartei
```

**CAPEX-Staffeln ändern:** Passen Sie `pricePerUnit` in den jeweiligen Einträgen an. Neue Staffeln können durch Hinzufügen weiterer Objekte ergänzt werden – `upTo` gibt die obere Grenze der Stufe in kWp bzw. kWh an; der letzte Eintrag muss `upTo: Infinity` haben.

**OPEX-Pauschalen ändern:** `TECH_MANAGEMENT_RATE` ist der Anteil am CAPEX (z.B. `0.015` für 1,5 %). `BILLING_COST_PER_PARTICIPANT` ist der jährliche Abrechnungsbetrag pro Vertragspartei in €.

**Wirkung:** Die Änderungen greifen sofort für alle automatisch berechneten Standardwerte im Tool. Nutzer, die bereits auf „Kosten aufschlüsseln" geklickt und eigene Werte eingetragen haben, sind nicht betroffen – deren manuell gesetzte Werte bleiben erhalten.

---

### Codequalität: Linter & Formatter

Das Projekt verwendet **ESLint** (Linter) und **Prettier** (Formatter).

| Befehl | Beschreibung |
|---|---|
| `npm run lint` | ESLint ausführen – zeigt Fehler und Warnungen an |
| `npm run format` | Prettier formatiert alle Dateien in `src/` automatisch |
| `npm run format:check` | Prettier nur prüfen, ohne Dateien zu ändern |
| `npm run typecheck` | TypeScript-Typen prüfen (`tsc --noEmit`) |
| `npm run check-all` | Alle Prüfungen kombiniert (typecheck + lint + format:check) |
| `npm run fix-all` | Prettier formatieren + ESLint auto-fix |

**Empfohlener Workflow vor einem Commit:**

```bash
npm run fix-all    # Prettier + ESLint auto-fix anwenden
npm run check-all  # Alle Prüfungen abschließend ausführen
```

---

### 🧪 Tests

Die Berechnungslogik ist mit **[Vitest](https://vitest.dev/)** abgedeckt, um bei der Weiterentwicklung sicherzustellen, dass alle Energie- und Wirtschaftlichkeitsberechnungen korrekt bleiben.

#### Teststruktur

```
tests/
└── lib/
    ├── calculations.test.ts          # Jahresenergiebilanz & Wirtschaftlichkeit
    └── energyFlowCalculation.test.ts # Monatliche Energieflüsse
```

| Testdatei | Getestete Funktionen | Testfälle |
|---|---|---|
| `calculations.test.ts` | `calculateEnergyYield`, `calculateEconomics`, `fetchPvgisYield` | 61 |
| `energyFlowCalculation.test.ts` | `calculateMonthlyEnergyFlows`, `fetchPvgisMonthlyYield` | 32 |

#### Was wird getestet?

**`calculateEnergyYield`** – Jahres-Energiebilanz:
- Aggregation des Gesamtverbrauchs (Wohneinheiten, Wärmepumpe, E-Mobilität, Allgemeinstrom)
- Eigenverbrauchsheuristik inkl. 85%-Cap und Batteriefaktor
- Energieerhaltung: `Eigenverbrauch + Einspeisung = PV-Ertrag`
- Autarkie- und Eigenverbrauchsquoten

**`calculateEconomics`** – 20-Jahres-Wirtschaftlichkeit:
- Annuitätenformel für Kreditfinanzierung
- Einnahmenmodelle GGV vs. Mieterstrom (Grundgebühr, Zuschlag)
- LCOE-Berechnung (Stromgestehungskosten in ct/kWh)
- Amortisationszeit und kumulativer Cashflow

**`calculateMonthlyEnergyFlows`** – Monatliche Energieflüsse:
- Defizitmonate (PV < Bedarf): gesamter Ertrag wird verbraucht, Rest aus Netz
- Überschussmonate ohne Batterie: Überschuss wird eingespeist
- Überschussmonate mit Batterie: Pufferung bis zur Kapazität, dann Einspeisung
- Energieerhaltung pro Monat in beide Richtungen

**`fetchPvgisYield` / `fetchPvgisMonthlyYield`** – PVGIS-API:
- Fallbacks bei fehlenden Koordinaten oder API-Fehlern
- Korrektes Parsing der PVGIS v5.2-Antwortstruktur

#### Tests ausführen

```bash
# Einmalig (z. B. in CI)
npm test

# Interaktiver Watch-Modus (während der Entwicklung)
npm run test:watch

# Mit Coverage-Report
npm run test:coverage
```

Der Coverage-Report wird nach `npm run test:coverage` im Ordner `coverage/` erzeugt und kann mit einem Browser geöffnet werden (`coverage/index.html`). Der Ordner ist in `.gitignore` eingetragen und wird nicht versioniert.

#### Tests erweitern

Neue Berechnungsfunktionen sollten immer mit entsprechenden Tests in `tests/lib/` abgesichert werden. Die Test-Fixtures (`mkSystem`, `mkConsumption`, `mkEconomics`, `mkFinancing`) in den jeweiligen Testdateien erlauben es, nur die für den Testfall relevanten Parameter zu überschreiben – alle anderen erhalten sinnvolle Standardwerte.

---

<a name="english"></a>
## 🇺🇸 English

### Environment Variables

Create a `.env` file in the project root (template: `.env_example`):

| Variable | Required | Description |
|---|---|---|
| `VITE_PVGIS_BASE_URL` | No | Base URL for the PVGIS API. Default: `/pvgis-api/api/v5_2` (routed through the configured proxy) |
| `VITE_FORMBRICKS_WORKSPACE_ID` | No | Workspace ID from the Formbricks dashboard. Enables the "Feedback & Support" button in the sidebar. Without this variable the button is a no-op. |

> Address autocomplete uses [Photon (Komoot)](https://photon.komoot.io/) powered by OpenStreetMap — no API key required.

#### Setting up Formbricks (optional)

[Formbricks](https://formbricks.com/) provides in-app surveys that can be opened via a button in the sidebar.

**Steps:**

1. Create an account at [app.formbricks.com](https://app.formbricks.com) (free cloud plan available)
2. Create an **App Survey** (type: *App Survey*, not *Link Survey*)
3. Add a **Code trigger** with the event key `support`
4. Set the survey status to **Live**
5. Copy the **Workspace ID** from *Settings → General*
6. Add to `.env`: `VITE_FORMBRICKS_WORKSPACE_ID=<your-id>`
7. For Netlify: also add the variable under *Site settings → Environment variables*

> If `VITE_FORMBRICKS_WORKSPACE_ID` is not set, Formbricks is not initialized — the app behaviour is unchanged.

#### Note on the PVGIS API

The [EU Commission PVGIS API](https://re.jrc.ec.europa.eu/pvg_tools/en/) does **not support direct browser requests** (no CORS). Requests must be routed through a server-side proxy. This is already pre-configured for local development and Netlify deployments (see below).

---

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env (optional, only if PVGIS_BASE_URL needs to be customized)
cp .env.example .env

# 3. Start development server
npm run dev
```

The Vite dev server automatically proxies all requests to `/pvgis-api/*` to `https://re.jrc.ec.europa.eu`. No additional configuration required.

---

### Deploying to Netlify

The [`netlify.toml`](../netlify.toml) file already includes a proxy rule for the PVGIS API:

```toml
[[redirects]]
  from = "/pvgis-api/*"
  to   = "https://re.jrc.ec.europa.eu/:splat"
  status = 200
  force  = true
```

**Steps:**

1. Connect your repository to Netlify (GitHub → Netlify → "New site from Git")
2. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Set environment variables in Netlify:
   - `VITE_PVGIS_BASE_URL` → `/pvgis-api/api/v5_2` (matches the proxy path from `netlify.toml`)
4. Trigger a deploy

The PVGIS proxy rule is picked up automatically as long as `netlify.toml` is present in the repository.

---

### Deploying to Other Platforms

For other hosting platforms, the PVGIS proxy needs to be configured separately.

#### Vercel

Create a `vercel.json` in the project root:

```json
{
  "rewrites": [
    {
      "source": "/pvgis-api/:path*",
      "destination": "https://re.jrc.ec.europa.eu/:path*"
    }
  ]
}
```

Then set `VITE_PVGIS_BASE_URL=/pvgis-api/api/v5_2` as an environment variable in your Vercel project settings.

#### Nginx

```nginx
location /pvgis-api/ {
    proxy_pass https://re.jrc.ec.europa.eu/;
    proxy_set_header Host re.jrc.ec.europa.eu;
}
```

Set `VITE_PVGIS_BASE_URL` at build time to your public proxy URL, e.g.:

```bash
VITE_PVGIS_BASE_URL=https://your-domain.com/pvgis-api/api/v5_2 npm run build
```

---

### Updating Market Average Prices

The automatically calculated CAPEX reference values (PV system and battery storage) are stored centrally in a single file:

```
src/lib/avgCostConfig.ts
```

The price tiers are defined there as arrays:

```ts
// PV system: €/kWp per size tier
export const PV_COST_TIERS: CostTier[] = [
  { upTo: 20, pricePerUnit: 1400 },      // up to 20 kWp
  { upTo: 50, pricePerUnit: 1100 },      // 20–50 kWp
  { upTo: Infinity, pricePerUnit: 950 }, // above 50 kWp
];

// Battery storage: €/kWh per capacity tier
export const BATTERY_COST_TIERS: CostTier[] = [
  { upTo: 15, pricePerUnit: 600 },       // up to 15 kWh
  { upTo: 30, pricePerUnit: 450 },       // 15–30 kWh
  { upTo: Infinity, pricePerUnit: 350 }, // 30–100 kWh
];

// OPEX flat rates
export const TECH_MANAGEMENT_RATE = 0.01;        // 1% of CAPEX per year
export const BILLING_COST_PER_PARTICIPANT = 150; // €/year per metered participant
```

**Changing CAPEX tiers:** Adjust `pricePerUnit` in the relevant entries. Additional tiers can be added by inserting more objects — `upTo` defines the upper boundary of each tier in kWp or kWh respectively; the last entry must always have `upTo: Infinity`.

**Changing OPEX flat rates:** `TECH_MANAGEMENT_RATE` is the share of CAPEX (e.g. `0.015` for 1.5 %). `BILLING_COST_PER_PARTICIPANT` is the annual billing amount per metered participant in €.

**Effect:** Changes take effect immediately for all automatically calculated default values in the tool. Users who have already clicked "Break down" and entered their own figures are not affected — their manually set values are preserved.

---

### Code Quality: Linter & Formatter

The project uses **ESLint** (linter) and **Prettier** (formatter).

| Command | Description |
|---|---|
| `npm run lint` | Run ESLint – reports errors and warnings |
| `npm run format` | Prettier auto-formats all files in `src/` |
| `npm run format:check` | Check formatting without modifying files |
| `npm run typecheck` | Check TypeScript types (`tsc --noEmit`) |
| `npm run check-all` | All checks combined (typecheck + lint + format:check) |
| `npm run fix-all` | Apply Prettier formatting + ESLint auto-fix |

**Recommended workflow before committing:**

```bash
npm run fix-all    # Apply Prettier + ESLint auto-fixes
npm run check-all  # Run all checks to verify
```

---

### 🧪 Tests

The calculation logic is covered by **[Vitest](https://vitest.dev/)** to ensure that all energy and financial calculations remain correct as the project evolves.

#### Test Structure

```
tests/
└── lib/
    ├── calculations.test.ts          # Annual energy balance & financial projections
    └── energyFlowCalculation.test.ts # Monthly energy flows
```

| Test file | Functions under test | Test cases |
|---|---|---|
| `calculations.test.ts` | `calculateEnergyYield`, `calculateEconomics`, `fetchPvgisYield` | 61 |
| `energyFlowCalculation.test.ts` | `calculateMonthlyEnergyFlows`, `fetchPvgisMonthlyYield` | 32 |

#### What is tested?

**`calculateEnergyYield`** – Annual energy balance:
- Consumption aggregation (apartments, heat pump, EV charging, general electricity)
- Self-consumption heuristic including the 85% cap and battery factor
- Energy conservation: `self-consumption + grid export = PV yield`
- Autarky rate and self-consumption rate

**`calculateEconomics`** – 20-year financial projection:
- Annuity formula for loan financing
- Revenue models GGV vs. Mieterstrom (base fee, subsidy)
- LCOE calculation (levelized cost of electricity in ct/kWh)
- Amortization period and cumulative cash flow

**`calculateMonthlyEnergyFlows`** – Monthly energy flows:
- Deficit months (PV < demand): full yield consumed, remainder from grid
- Surplus months without battery: surplus fed into grid
- Surplus months with battery: buffered up to capacity, then fed into grid
- Energy conservation per month in both directions

**`fetchPvgisYield` / `fetchPvgisMonthlyYield`** – PVGIS API:
- Fallbacks for missing coordinates or API failures
- Correct parsing of the PVGIS v5.2 response structure

#### Running the Tests

```bash
# Single run (e.g. in CI)
npm test

# Interactive watch mode (during development)
npm run test:watch

# With coverage report
npm run test:coverage
```

After `npm run test:coverage`, the HTML coverage report is generated in the `coverage/` folder and can be opened in a browser (`coverage/index.html`). The folder is listed in `.gitignore` and is not versioned.

#### Extending the Tests

New calculation functions should always be accompanied by corresponding tests in `tests/lib/`. The test fixtures (`mkSystem`, `mkConsumption`, `mkEconomics`, `mkFinancing`) in each test file allow overriding only the parameters relevant to the test case — all others receive sensible default values.

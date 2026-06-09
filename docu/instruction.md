# Bedienungsanleitung – Immo PV Planer

[Deutsch](#deutsch) | [English](#english)

---

<a name="deutsch"></a>
## Deutsch

### Überblick

Der **Immo PV Planer** ist ein interaktives Simulationstool für Mehrfamilienhäuser, das die wirtschaftliche Machbarkeit von Photovoltaik-Anlagen im Rahmen des **Mieterstrom**- oder **GGV-Modells** (Gemeinschaftliche Gebäudeversorgung) berechnet. Das Tool ist für Eigentümer, Verwalter und Berater konzipiert, die einen schnellen, fundierten Überblick über Energieerzeugung, Autarkiegrad und Wirtschaftlichkeit einer PV-Anlage erhalten möchten.

Die Simulation umfasst drei Bereiche:

1. **Technische Konfiguration** – PV-Anlage, Batteriespeicher, Verbrauch
2. **Wirtschaftliche Parameter** – Tarife, Investitionskosten, Finanzierung
3. **Ergebnisse & Analyse** – Energiebilanz, Cashflow, monatliche Energieflüsse

Alle Kennzahlen in der oberen KPI-Leiste aktualisieren sich bei jeder Eingabeänderung automatisch.

---

### Schritt 1 – Technische Konfiguration

#### Standort

Geben Sie die Adresse des Gebäudes ein. Die Adresse wird automatisch in GPS-Koordinaten umgerechnet und dient als Basis für die PV-Ertragssimulation über die **PVGIS-Satellitendatenbank der EU-Kommission**. Die eingegebene Adresse wird nicht gespeichert.

#### PV-Anlage

Die Größe der PV-Anlage kann wahlweise in **kWp** (Kilowatt-Peak, installierte Peakleistung) oder in **m² Dachfläche** angegeben werden. Bei der Eingabe in m² berechnet das Tool die Leistung automatisch nach der Formel `(m² ÷ 5) × 0,8`.

Ein typisches Mehrfamilienhaus hat eine PV-Anlage von 30–150 kWp.

#### Batteriespeicher

Aktivieren Sie den Batteriespeicher mit dem Toggle und geben Sie die Kapazität in kWh an. Ein Speicher erhöht den Eigenverbrauchsanteil erheblich, da überschüssiger PV-Strom tagsüber gespeichert und nachts genutzt werden kann.

Faustformel: **0,5 kWh Speicherkapazität pro kWp PV-Leistung**.

#### Expertenmodus

Im Standard arbeitet das Tool mit Südausrichtung (0°) und 35° Neigungswinkel – typische Werte für optimale Erträge in Mitteleuropa. Im **Expertenmodus** können Neigungswinkel und Azimut individuell angepasst werden.

#### Verbraucher im Gebäude

Konfigurieren Sie die relevanten Stromverbraucher:

| Parameter | Beschreibung |
|---|---|
| **Wohneinheiten** | Anzahl der angeschlossenen Mietparteien |
| **Teilnehmerquote** | Anteil der Wohneinheiten, die am Modell teilnehmen (Erfahrungswert: 60–80 %) |
| **Verbrauch pro WE** | Jahresstromverbrauch pro Wohneinheit (typisch: 1.800–3.500 kWh/a) |
| **Wärmepumpe** | Gesamter elektr. Energiebedarf der Wärmepumpe (kWh/a) |
| **E-Mobilität** | Anzahl Ladepunkte und jährl. kWh pro Ladepunkt |
| **Allgemeinstrom** | Treppenhaus, Keller, Aufzug etc. (typisch: 1.000–5.000 kWh/a) |

---

### Schritt 2 – Wirtschaftliche Parameter

#### Betriebsmodell

Wählen Sie zwischen zwei Modellen:

- **Klassischer Mieterstrom**: Der Betreiber übernimmt die vollständige Energieversorgung (PV-Strom + zugekaufter Reststrom). Er erhält den Mieterstromzuschlag sowie eine monatliche Grundgebühr pro Wohneinheit. Der Verkaufspreis muss mindestens 10 % unter dem lokalen Grundversorger-Tarif liegen.

- **GGV (Gemeinschaftliche Gebäudeversorgung)**: Mieter erhalten den PV-Strom als Ergänzung zu ihrem bestehenden Stromvertrag. In Zeiten ohne PV-Erzeugung beziehen sie Strom weiter aus ihrem bisherigen Vertrag. Der Betreiber erhält den vereinbarten Arbeitspreis für jede gelieferte kWh.

#### Stromtarife & Gebühren

| Parameter | Beschreibung |
|---|---|
| **Netto-Verkaufspreis Mieter** | Preis pro kWh an die Mieter (netto, umsatzsteuerpflichtig) |
| **Einspeisevergütung** | EEG-Vergütung oder Direktvermarktung für eingespeisten Strom |
| **Grundgebühr** | Monatliche Pauschale pro WE (nur Mieterstrom-Modell) |
| **Mieterstromzuschlag** | Staatliche Förderung nach § 21 EEG (abhängig von Anlagengröße) |
| **Referenzpreis Netz** | Lokaler Grundversorger-Tarif als Vergleichsbasis |

#### Investitionskosten (CAPEX) – Automatische Berechnung

Die Investitionskosten werden **automatisch** aus der konfigurierten Anlagengröße berechnet, sobald Sie Tab 1 eingestellt haben. Dabei werden aktuelle Marktdurchschnittswerte nach Größenstaffel verwendet:

**PV-Anlage:**

| Größe | Durchschnittspreis |
|---|---|
| bis 20 kWp | 1.400 €/kWp |
| 20–50 kWp | 1.100 €/kWp |
| ab 50 kWp | 950 €/kWp |

**Batteriespeicher:**

| Kapazität | Durchschnittspreis |
|---|---|
| bis 15 kWh | 600 €/kWh |
| 15–30 kWh | 450 €/kWh |
| 30–100 kWh | 350 €/kWh |

Der Hinweis unterhalb des CAPEX-Feldes zeigt Ihnen, welche Staffel aktuell verwendet wird und wie der Betrag berechnet wurde (z.B. *„50 kWp × 1.100 €/kWp + 25 kWh × 450 €/kWh"*).

**Kosten aufschlüsseln (manuelle Eingabe)**

Wenn Sie genauere Angaben zu den Einzelpositionen haben, klicken Sie auf **„Kosten aufschlüsseln"**. Es öffnet sich ein Modal, in dem Sie folgende Positionen separat eingeben können:

- PV-Anlage inkl. Wechselrichter
- Batteriespeicher
- Installation & Infrastruktur (Zähler, Unterverteiler, Kabelwege)
- Beratung & Planungskosten
- Sonstige Kosten

Die Summe wird übernommen und der automatische Standardwert wird durch Ihren manuellen Wert **dauerhaft ersetzt**, bis Sie auf **„Zurücksetzen"** klicken. Das Modell öffnet sich mit den automatisch berechneten Werten als Ausgangspunkt, die Sie beliebig anpassen können.

> **Hinweis:** CAPEX-Werte sind Netto-Angaben (ohne MwSt.). Überprüfen Sie im Einzelfall, ob der geplante Kauf unter die Kleinunternehmerregelung oder eine umsatzsteuerfreie Variante fällt.

#### Betriebskosten (OPEX) – Automatische Schätzung

Die jährlichen Betriebskosten werden ebenfalls **automatisch** geschätzt, sobald CAPEX und Verbrauchsparameter bekannt sind. Der Hinweis unterhalb des OPEX-Feldes zeigt die verwendete Formel, z.B. *„1 % CAPEX + 8 × 150 €/Jahr"*.

Die Schätzung setzt sich aus zwei Positionen zusammen:

**Technische Betriebsführung** — 1 % des CAPEX pro Jahr

Umfasst Wartung, Monitoring, Fernüberwachung und Entstörung der PV-Anlage und des Batteriespeichers.

**Abrechnung** — 150 € pro Vertragspartei und Jahr

Als Vertragspartei zählen alle Einheiten, für die eine eigene Messung und Abrechnung anfällt:

| Einheit | Zählt als Vertragspartei |
|---|---|
| Wohneinheiten | Anzahl × Teilnehmerquote |
| Wallboxen (E-Mobilität) | jede einzelne Wallbox |
| Allgemeinstrom | 1 (pauschal, wenn aktiviert) |
| Wärmepumpe | 1 (pauschal, wenn aktiviert) |

*Beispiel: 10 WE × 80 % + 2 Wallboxen = 10 Vertragsparteien → 10 × 150 € = 1.500 €/Jahr Abrechnungskosten.*

**Administrative Betriebsführung** (kein Standardwert) — Versicherungen, Buchführung, Mieterkommunikation. Diesen Betrag tragen Sie bei Bedarf manuell ein.

**Dachpacht (jährl.)** (Standard: 0 €) — Jährliche Kosten für die Dachnutzung (monatliche Rate × 12). Viele Eigentümer überlassen das Dach kostenfrei, da die PV-Anlage den Gebäudewert steigert. Wenn eine Pacht vereinbart ist, tragen Sie hier den Jahresbetrag ein.

**Kosten aufschlüsseln (manuelle Eingabe)**

Klicken Sie auf **„Kosten aufschlüsseln"**, um alle drei Positionen einzeln einzutragen. Das Modal öffnet sich mit der automatischen Schätzung als Ausgangswert. Nach dem Klick auf „Übernehmen" wird der manuelle Wert **dauerhaft gespeichert**, bis Sie auf **„Zurücksetzen"** klicken.

#### Finanzierung

| Parameter | Beschreibung |
|---|---|
| **Kreditbetrag** | Fremdfinanzierter Anteil der Investitionskosten (als % des CAPEX wählbar) |
| **Zins** | Jährlicher Zinssatz (KfW-Förderprogramme prüfen) |
| **Kreditlaufzeit** | Tilgungsdauer in Jahren (typisch 10–20 Jahre) |

---

### Schritt 3 – Ergebnisse & Analyse

#### KPI-Leiste (oben)

Die sechs wichtigsten Kennzahlen werden dauerhaft angezeigt und aktualisieren sich bei jeder Eingabeänderung:

| KPI | Beschreibung |
|---|---|
| **PV-Energieerzeugung** | Geschätzter jährlicher Bruttoertrag (kWh/a) |
| **Autarkiegrad** | Anteil des Strombedarfs aus PV + Speicher |
| **Eigenverbrauchsquote** | Anteil des erzeugten PV-Stroms, der im Gebäude bleibt |
| **Stromgestehungskosten** | LCOE in ct/kWh (Gesamtkosten ÷ erzeugte Energie) |
| **Amortisationszeit** | Jahr des Break-Even-Punkts |
| **Akkum. Einnahmen** | Kumulierter Cashflow nach 20 Jahren |

#### Optimierungsregler

Im Ergebnisbereich stehen zwei Schieberegler zur Verfügung, mit denen Sie die wichtigsten Stellschrauben des Business Case in Echtzeit simulieren können:

- **Verkaufspreis an Mieter** – der stärkste Einfluss auf die Einnahmen
- **Teilnehmerquote** – beeinflusst die verkaufte Strommenge und Grundgebühreneinnahmen

#### Cashflow-Diagramm

Das Balkendiagramm zeigt die jährliche Cashflow-Entwicklung über den Betrachtungszeitraum. Klicken Sie auf einen Balken, um die Detailaufstellung für das jeweilige Jahr zu sehen (Einnahmen, OPEX, Kreditdienst).

#### Monatliche Energieflüsse

Am Ende der Ergebnisseite finden Sie eine Monatsübersicht mit:

- PV-Erzeugung je Monat
- Direktverbrauch, Batterieladung, Netzeinspeisung
- Netzbezug (Bedarf, der nicht durch PV gedeckt wird)

Die Tabelle kann auf- und zugeklappt werden.

---

### Konfiguration speichern und laden

Über die Buttons **„Konfiguration exportieren"** und **„Konfiguration importieren"** können Sie Ihre kompletten Eingaben als JSON-Datei sichern und später wieder laden. Dabei werden alle Parameter inklusive des manuellen CAPEX-Status gespeichert.

---

### Tutorial & Hilfe

Beim ersten Start erscheint ein Willkommen-Dialog mit der Option, eine geführte Tour durch die wichtigsten Funktionen zu starten. Die Tour kann jederzeit über den **„Tour wiederholen"**-Button in der linken Seitenleiste neu gestartet werden.

Für Fragen und Feedback nutzen Sie den **„Feedback & Support"**-Button in der Seitenleiste.

---

<a name="english"></a>
## English

### Overview

The **Immo PV Planner** is an interactive simulation tool for multi-family residential buildings that calculates the economic viability of photovoltaic systems under the **Tenant Electricity** (Mieterstrom) or **GGV** (Communal Building Supply) model. The tool is designed for property owners, managers, and advisors who need a quick, well-founded overview of energy generation, autarky rate, and financial performance of a PV system.

The simulation covers three areas:

1. **Technical Configuration** – PV system, battery storage, consumption
2. **Economic Parameters** – tariffs, investment costs, financing
3. **Results & Analysis** – energy balance, cash flow, monthly energy flows

All KPIs in the top bar update automatically with every input change.

---

### Step 1 – Technical Configuration

#### Location

Enter the building address. It is automatically converted to GPS coordinates and used as the basis for the PV yield simulation via the **EU Commission PVGIS satellite database**. The address is not stored.

#### PV System

The PV system size can be specified either in **kWp** (kilowatt-peak, installed peak power) or in **m² of roof area**. When entered in m², the tool automatically calculates capacity using `(m² ÷ 5) × 0.8`.

A typical multi-family building has a PV system of 30–150 kWp.

#### Battery Storage

Enable battery storage with the toggle and enter the capacity in kWh. A battery significantly increases self-consumption, as surplus PV electricity generated during the day can be stored and used at night.

Rule of thumb: **0.5 kWh storage capacity per kWp of PV capacity**.

#### Expert Mode

By default, the tool uses south orientation (0°) and a 35° tilt angle – typical values for optimal yields in Central Europe. **Expert mode** allows you to customize tilt angle and azimuth individually.

#### Building Consumers

Configure the relevant electricity consumers:

| Parameter | Description |
|---|---|
| **Apartments** | Number of connected tenant units |
| **Participation Rate** | Share of apartments participating in the model (typical: 60–80 %) |
| **Consumption per unit** | Annual electricity consumption per apartment (typical: 1,800–3,500 kWh/yr) |
| **Heat Pump** | Total electrical energy demand of the heat pump (kWh/yr) |
| **EV Charging** | Number of charging points and annual kWh per point |
| **Common Area Electricity** | Stairwells, basement, elevator, etc. (typical: 1,000–5,000 kWh/yr) |

---

### Step 2 – Economic Parameters

#### Operating Model

Choose between two models:

- **Classic Tenant Electricity (Mieterstrom)**: The operator takes over the complete energy supply (PV electricity + purchased residual electricity). They receive the tenant electricity subsidy plus a monthly base fee per unit. The sales price must be at least 10% below the local utility rate.

- **GGV (Communal Building Supply)**: Tenants receive PV electricity as a supplement to their existing electricity contract. During times without PV generation, they continue to draw electricity from their current supplier. The operator receives the agreed per-unit price for each kWh delivered.

#### Tariffs & Fees

| Parameter | Description |
|---|---|
| **Net Tenant Sales Price** | Price per kWh charged to tenants (net, subject to VAT) |
| **Feed-in Tariff** | EEG compensation or direct marketing for exported electricity |
| **Base Fee** | Monthly flat rate per unit (Mieterstrom model only) |
| **Tenant Electricity Subsidy** | Government subsidy per §21 EEG (depends on system size) |
| **Grid Reference Price** | Local utility rate used as a benchmark |

#### Investment Costs (CAPEX) – Automatic Calculation

Investment costs are **automatically calculated** from the configured system size once you have set up Tab 1. Current market average prices are applied based on system size tiers:

**PV System:**

| Size | Average Price |
|---|---|
| up to 20 kWp | 1,400 €/kWp |
| 20–50 kWp | 1,100 €/kWp |
| above 50 kWp | 950 €/kWp |

**Battery Storage:**

| Capacity | Average Price |
|---|---|
| up to 15 kWh | 600 €/kWh |
| 15–30 kWh | 450 €/kWh |
| 30–100 kWh | 350 €/kWh |

The hint below the CAPEX field shows which tier is currently applied and how the amount was calculated (e.g. *"50 kWp × 1,100 €/kWp + 25 kWh × 450 €/kWh"*).

**Break Down Costs (manual entry)**

If you have more precise figures for individual cost items, click **"Break down"**. A modal opens where you can enter the following positions separately:

- PV system incl. inverter
- Battery storage
- Installation & infrastructure (meters, distribution boards, cable routing)
- Consulting & planning costs
- Other costs

The total is applied and the automatic default is **permanently replaced** by your manual value until you click **"Reset to default"**. The modal opens pre-filled with the auto-calculated values as a starting point, which you can adjust freely.

> **Note:** CAPEX values are net amounts (excl. VAT). Check whether your specific purchase falls under the small business regulation or any VAT-exempt scheme.

#### Operating Costs (OPEX) – Automatic Estimate

Annual operating costs are also **automatically estimated** as soon as CAPEX and consumption parameters are known. The hint below the OPEX field shows the formula used, e.g. *"1 % CAPEX + 8 × 150 €/yr"*.

The estimate consists of two line items:

**Technical Operations** — 1% of CAPEX per year

Covers maintenance, monitoring, remote surveillance, and fault clearance of the PV system and battery storage.

**Billing & Metering** — 150 € per metered participant per year

A metered participant is any unit that requires its own meter reading and billing statement:

| Unit | Counts as participant |
|---|---|
| Apartments | count × participation rate |
| Wallboxes (EV charging) | each individual wallbox |
| Common area electricity | 1 (flat, if enabled) |
| Heat pump | 1 (flat, if enabled) |

*Example: 10 units × 80 % + 2 wallboxes = 10 participants → 10 × 150 € = 1,500 €/yr billing costs.*

**Administrative Operations** (no default value) — insurance, accounting, tenant communication. Enter this amount manually if applicable.

**Roof Rent (annual)** (default: 0 €) — Annual cost for roof usage (monthly rate × 12). Many owners provide the roof free of charge since the PV system increases the building's value. If a rent is agreed, enter the annual amount here.

**Break Down Costs (manual entry)**

Click **"Break down"** to enter all three line items individually. The modal opens pre-filled with the automatic estimate as a starting point. After clicking "Apply", the manual value is **permanently saved** until you click **"Reset to default"**.

#### Financing

| Parameter | Description |
|---|---|
| **Loan Amount** | Debt-financed share of investment costs (selectable as % of CAPEX) |
| **Interest Rate** | Annual interest rate (check KfW funding programs) |
| **Loan Term** | Repayment period in years (typical: 10–20 years) |

---

### Step 3 – Results & Analysis

#### KPI Bar (top)

The six most important metrics are permanently displayed and update with every input change:

| KPI | Description |
|---|---|
| **PV Energy Generation** | Estimated annual gross yield (kWh/yr) |
| **Autarky Rate** | Share of electricity demand covered by PV + battery |
| **Self-consumption Rate** | Share of generated PV electricity consumed within the building |
| **LCOE** | Levelized cost of electricity in ct/kWh (total costs ÷ energy generated) |
| **Payback Period** | Year of the break-even point |
| **Accum. Revenue** | Cumulative cash flow over 20 years |

#### Optimization Controls

The results section provides two sliders for real-time scenario analysis of the key business case levers:

- **Tenant Sales Price** – the strongest influence on revenue
- **Participation Rate** – affects electricity volume sold and base fee revenue

#### Cash Flow Chart

The bar chart shows the annual cash flow development over the calculation period. Click on a bar to see the detailed breakdown for that year (revenue, OPEX, loan service).

#### Monthly Energy Flows

At the bottom of the results page you find a monthly overview showing:

- PV generation per month
- Direct self-consumption, battery charging, grid export
- Grid supply (demand not covered by PV)

The detail table can be expanded and collapsed.

---

### Saving and Loading Configurations

The **"Export configuration"** and **"Import configuration"** buttons allow you to save all your inputs as a JSON file and reload them later. This includes all parameters, including the manual CAPEX override status.

---

### Tutorial & Help

On first launch, a welcome dialog appears offering a guided tour through the key features. The tour can be restarted at any time using the **"Restart Tour"** button in the left sidebar.

For questions and feedback, use the **"Feedback & Support"** button in the sidebar.

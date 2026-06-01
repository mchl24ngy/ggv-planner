# Immo PV Planer - Mieterstrom & GGV Konfigurator

[Deutsch](#deutsch) | [English](#english)

---

<a name="deutsch"></a>

## 🇩🇪 Deutsch

### 🚀 Motivation & Hintergrund

Meine Motivation für dieses Projekt ist es, Transparenz in ein Thema zu bringen, das für das Gelingen der Energiewende entscheidend ist. Heute gibt es schon viele PV-Anlagen auf Einfamilienhäuser und Gewerbeimmobilien. Jedoch fast nicht auf Mehrfamilienhäuser, weshalb eine große Gruppe von Menschen nicht von günstiger PV-Energie profitieren kann. Das Stichwort hierfür ist Mieterstrom bzw. Gemeinschaftliche Gebäudeversorgung. Das Modell ist jedoch noch recht neu und wird - wie so oft - unnötig komplex dargestellt.

Es gibt es bereits einige Anbieter am Markt, über die auch Wirtschaftlichkeitsberechnungen für Mieterstrom durchgeführt werden, doch die zugrunde liegenden Zahlen und Rechenwege sind oft eine "Blackbox". Es nicht nachvollziehbar, ob Ergebnisse geschönt und Projekte primär zum Vorteil der Anbieter "reich gerechnet" werden. Das möchte ich mit diesem Online-Rechner ändern.

**Immo PV Planer** ist meine Antwort darauf:

- **Unabhängigkeit:** Ein neutrales Werkzeug ohne Verkaufsabsichten.
- **Transparenz:** Dank Open Source sind alle Kalkulationen für jeden einsehbar und nachprüfbar.
- **Niedrige Einstiegshürden:** Das Tool ist sofort nutzbar, ohne dass Nutzer erst ihre persönlichen Daten hinterlassen müssen (kein Lead-Fishing).
- **Teilhabe:** Dieses Projekt versteht sich als Beitrag zum Open-Source-Gedanken und zur aktiven Teilhabe der Bürger an der dezentralen Energiewende.

### 🎯 Projektziel

Das Projekt baut auf bestehendem Fachwissen auf und soll sich Stück für Stück weiterentwickeln, um eine möglichst gute und realistische Berechnung von Mieterstrom- und GGV-Projekten zu ermöglichen.

Dabei habe ich **bewusst nicht den Anspruch, ein absolutes Experten-Tool** zu entwickeln, sondern es sollte von jedem und jeder genutzt werden, um sein Gebäude schnell durchzurechnen. Dabei muss an der einen oder anderen Stelle auf Vereinfachung gesetzt werden. Aber vielleicht entwickelt sich das Tool ja noch in die Richtung, immer mehr fachliche Tiefe aufzubauen, ohne fachlich zu komplex zu werden.

### 💡 Fachlicher Hintergrund

Das Tool vergleicht zwei wesentliche Modelle:

1. **Mieterstrom:** Klassisches Modell mit Mieterstromzuschlag, aber hohem bürokratischem Aufwand.
2. **Gemeinschaftliche Gebäudeversorgung (GGV):** Das neue Modell aus dem Solarpaket I zur vereinfachten Solarstromverteilung im Haus.

### 🛠 Technischer Stack

- **Framework:** React mit TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts zur Visualisierung von Cashflows und Energieflüssen
- **APIs:** Integration von nötigen APIs für standortgenaue Ertragsdaten, aktuell PVGIS der EU sowie Photon (Komoot/OpenStreetMap) für die Adresszuordnung – kein API-Key erforderlich.

## 🔧 Installation & Setup

1. **Repository klonen**
2. **Abhängigkeiten installieren**: `npm install`
3. **Umgebungsvariablen**: Diese in der Datei `.env` anpassen.
4. **Starten**: `npm run dev`

Detaillierte Informationen zu Umgebungsvariablen und Deployment (Netlify, Vercel, Nginx) findest du in der [Deployment-Dokumentation](docu/deployment.md).

---

<a name="english"></a>

## 🇺🇸 English

### 🚀 Motivation & Background

My motivation for this project is to bring transparency to an issue that is crucial to the success of the energy transition. Today, there are already many PV systems on single-family homes and commercial properties. However, there are almost none on multi-family homes, which is why a large group of people cannot benefit from affordable PV energy. The keyword here is tenant electricity or communal building supply. However, the model is still quite new and, as is so often the case, is presented as unnecessarily complex.

There are already a few providers on the market that also perform profitability calculations for tenant electricity, but the underlying figures and calculation methods are often a “black box.” It is not clear whether results are embellished and projects are “overestimated” primarily to the advantage of the providers. I would like to change that with this online calculator.

**ggv-planner** was created to counter this:

- **Independence:** A neutral tool without hidden sales agendas.
- **Transparency:** Being Open Source, all calculation methods are open for public inspection and verification.
- **Low Barriers:** The tool can be used immediately without the need to leave personal data first (no lead generation).
- **Participation:** This project is rooted in the spirit of Open Source and community participation in the energy transition.

### 🎯 Project Goal

The project builds on existing expertise and aims to evolve step by step to enable the most accurate and realistic calculations possible for such projects.

I deliberately **did not aim to develop an expert tool**, but rather something that anyone could use to quickly calculate the energy consumption of their building. This meant simplifying certain aspects of the tool. But perhaps the tool will evolve to offer greater technical depth without becoming too complex.

### 💡 Functional Background

The tool distinguishes between two primary models in Germany:

1. **Tenant Electricity (Mieterstrom):** Traditional model with subsidies but high administrative effort.
2. **Collective Building Supply (GGV):** The new model from the "Solarpaket I" designed to simplify solar sharing within buildings.

### 🛠 Technical Stack

- **Framework:** React with TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts for visualizing energy flows and financial forecasts
- **APIs:** Integration of necessary APIs for location-specific yield data, currently PVGIS from the EU and Photon (Komoot/OpenStreetMap) for address autocomplete – no API key required.

## 🔧 Installation & Setup

1. **Clone Repository**
2. **Install Packages**: `npm install`
3. **Add Env Variable**: Set variables in file `.env`
4. **Run App**: `npm run dev`

For details on environment variables and deployment options (Netlify, Vercel, Nginx) see the [Deployment Documentation](docu/deployment.md).

---

Dieses Projekt dient der ersten Einschätzung und ersetzt keine detaillierte Fachplanung durch einen zertifizierten Energieberater. / This project is for initial assessment purposes and does not replace professional energy consulting.

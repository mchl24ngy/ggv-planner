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

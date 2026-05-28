import type { SystemParams, ConsumptionParams, EconomicParams, FinancingParams } from '../types';

const APP_ID = 'ggv-planner';
const SCHEMA_VERSION = '1';

function buildFilename(address: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = address
    .replace(/[,/\\]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_À-ɏ-]/g, '')
    .replace(/_+/g, '_')
    .slice(0, 50)
    .replace(/_+$/, '');
  return `${date}_${slug || 'export'}.${ext}`;
}

export interface GgvPlannerExportUi {
  expertMode: boolean;
  pvInputMode: 'kwp' | 'sqm';
  roofAreaM2: number;
}

export interface GgvPlannerExport {
  _meta: {
    appId: typeof APP_ID;
    schemaVersion: string;
    exportedAt: string;
  };
  system: SystemParams;
  consumption: ConsumptionParams;
  economics: EconomicParams;
  financing: FinancingParams;
  ui: GgvPlannerExportUi;
}

/** Picks only keys from `imported` that exist in `defaults`, preserving types. */
function mergeKnown<T>(defaults: T, imported: unknown): T {
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) return defaults;
  const src = imported as Record<string, unknown>;
  const result: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const key of Object.keys(result)) {
    if (key in src && src[key] !== undefined) {
      result[key] = src[key];
    }
  }
  return result as unknown as T;
}

export function exportToJson(
  system: SystemParams,
  consumption: ConsumptionParams,
  economics: EconomicParams,
  financing: FinancingParams,
  ui: GgvPlannerExportUi
): void {
  const payload: GgvPlannerExport = {
    _meta: {
      appId: APP_ID,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
    },
    system,
    consumption,
    economics,
    financing,
    ui,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = buildFilename(system.address, 'json');
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportResult =
  | {
      ok: true;
      system: SystemParams;
      consumption: ConsumptionParams;
      economics: EconomicParams;
      financing: FinancingParams;
      ui: GgvPlannerExportUi;
    }
  | { ok: false; errorKey: 'invalidJson' | 'wrongAppId' };

export async function importFromJson(
  file: File,
  defaults: {
    system: SystemParams;
    consumption: ConsumptionParams;
    economics: EconomicParams;
    financing: FinancingParams;
    ui: GgvPlannerExportUi;
  }
): Promise<ImportResult> {
  let raw: string;
  try {
    raw = await file.text();
  } catch {
    return { ok: false, errorKey: 'invalidJson' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, errorKey: 'invalidJson' };
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as Record<string, unknown>)._meta == null ||
    (parsed as Record<string, unknown>)._meta == null ||
    typeof (parsed as Record<string, unknown>)._meta !== 'object' ||
    ((parsed as Record<string, unknown>)._meta as Record<string, unknown>).appId !== APP_ID
  ) {
    return { ok: false, errorKey: 'wrongAppId' };
  }

  const p = parsed as Partial<GgvPlannerExport>;

  return {
    ok: true,
    system: mergeKnown(defaults.system, p.system),
    consumption: mergeKnown(defaults.consumption, p.consumption),
    economics: mergeKnown(defaults.economics, p.economics),
    financing: mergeKnown(defaults.financing, p.financing),
    ui: mergeKnown(defaults.ui, p.ui),
  };
}

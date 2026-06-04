import { describe, it, expect, vi } from 'vitest';
import {
  calculateMonthlyEnergyFlows,
  fetchPvgisMonthlyYield,
} from '../../src/lib/energyFlowCalculation';
import type { SystemParams, ConsumptionParams } from '../../src/types';

// ---------------------------------------------------------------------------
// Konstanten (gespiegelt aus der Implementierung)
// ---------------------------------------------------------------------------

const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Typische Monatsverteilung des PV-Ertrags in Mitteleuropa (Summe = 1.0)
const TYPICAL_MONTHLY_DISTRIBUTION = [
  0.04, 0.05, 0.08, 0.1, 0.12, 0.13, 0.12, 0.11, 0.09, 0.07, 0.05, 0.04,
];

// ---------------------------------------------------------------------------
// Test-Fixtures
// ---------------------------------------------------------------------------

const mkSystem = (overrides: Partial<SystemParams> = {}): SystemParams => ({
  address: 'Teststraße 1, München',
  locationLat: 48.13,
  locationLon: 11.57,
  inclination: 30,
  azimuth: 0,
  systemLoss: 14,
  pvCapacityKwp: 10,
  hasBattery: false,
  batteryCapacityKwh: 0,
  ...overrides,
});

// totalAnnualConsumption = 10 × 3650 × 1.0 = 36.500 kWh
// dailyNeed = 36.500 / 365 = 100 kWh/Tag (runde Zahl für einfache Arithmetik)
const mkConsumption = (overrides: Partial<ConsumptionParams> = {}): ConsumptionParams => ({
  apartments: 10,
  participationRate: 1.0,
  consumptionPerApartmentKwh: 3650,
  hasHeatPump: false,
  heatPumpConsumptionKwh: 0,
  hasEvCharging: false,
  evChargingPoints: 0,
  evChargingConsumptionPerPointKwh: 0,
  hasGeneralConsumption: false,
  generalConsumptionKwh: 0,
  ...overrides,
});

// Niedrige PV-Erträge: 10 kWh/Tag × Monatstage → immer Defizit (Bedarf = 100 kWh/Tag)
const LOW_MONTHLY_PV = DAYS_PER_MONTH.map((days) => 10 * days);

// Hohe PV-Erträge: 200 kWh/Tag × Monatstage → immer Überschuss (Bedarf = 100 kWh/Tag)
const HIGH_MONTHLY_PV = DAYS_PER_MONTH.map((days) => 200 * days);

// ---------------------------------------------------------------------------
// calculateMonthlyEnergyFlows
// ---------------------------------------------------------------------------

describe('calculateMonthlyEnergyFlows', () => {
  describe('Datenstruktur', () => {
    it('gibt immer genau 12 Monatswerte zurück', () => {
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      expect(result).toHaveLength(12);
    });

    it('Monatsnummern laufen von 1 (Januar) bis 12 (Dezember)', () => {
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      expect(result[0].month).toBe(1);
      expect(result[11].month).toBe(12);
      result.forEach((m, i) => expect(m.month).toBe(i + 1));
    });

    it('Tage je Monat sind korrekt (kein Schaltjahr)', () => {
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      DAYS_PER_MONTH.forEach((days, i) => {
        expect(result[i].daysInMonth).toBe(days);
      });
    });

    it('PV-Ertrag je Monat entspricht dem übergebenen Eingabewert', () => {
      const result = calculateMonthlyEnergyFlows(HIGH_MONTHLY_PV, mkSystem(), mkConsumption());
      result.forEach((m, i) => expect(m.pvYieldKwh).toBe(HIGH_MONTHLY_PV[i]));
    });

    it('täglicher Bedarf ist für alle Monate identisch (gleichmäßige Jahresverteilung)', () => {
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      const firstDayNeed = result[0].dailyNeedKwh;
      result.forEach((m) => expect(m.dailyNeedKwh).toBeCloseTo(firstDayNeed, 10));
    });

    it('täglicher Bedarf = Jahresverbrauch / 365', () => {
      // 10 WE × 3650 kWh × 100% = 36.500 kWh → 100 kWh/Tag
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      expect(result[0].dailyNeedKwh).toBeCloseTo(100, 5);
    });
  });

  describe('Defizitmonat (Tages-PV < Tagesbedarf)', () => {
    // 10 kWh/Tag PV vs. 100 kWh/Tag Bedarf → Defizit = 90 kWh/Tag

    it('gesamter PV-Ertrag wird direkt verbraucht (selfConsumption = pvYield)', () => {
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      result.forEach((m) => {
        expect(m.selfConsumptionKwh).toBeCloseTo(m.pvYieldKwh, 5);
      });
    });

    it('Netzbezug = Defizit × Monatstage', () => {
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      // Defizit = 100 - 10 = 90 kWh/Tag → Januar: 90 × 31 = 2790 kWh
      result.forEach((m) => {
        expect(m.gridSupplyKwh).toBeCloseTo(90 * m.daysInMonth, 5);
      });
    });

    it('keine Einspeisung im Defizitmonat', () => {
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      result.forEach((m) => expect(m.gridExportKwh).toBeCloseTo(0, 5));
    });

    it('keine Batterieladung im Defizitmonat', () => {
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      result.forEach((m) => expect(m.batteryChargeKwh).toBeCloseTo(0, 5));
    });
  });

  describe('Überschussmonat ohne Batterie (Tages-PV > Tagesbedarf)', () => {
    // 200 kWh/Tag PV vs. 100 kWh/Tag Bedarf → Überschuss = 100 kWh/Tag

    it('gesamter Bedarf wird durch PV gedeckt (kein Netzbezug)', () => {
      const result = calculateMonthlyEnergyFlows(HIGH_MONTHLY_PV, mkSystem(), mkConsumption());
      result.forEach((m) => expect(m.gridSupplyKwh).toBeCloseTo(0, 5));
    });

    it('Selbstverbrauch = Bedarf × Monatstage', () => {
      const result = calculateMonthlyEnergyFlows(HIGH_MONTHLY_PV, mkSystem(), mkConsumption());
      result.forEach((m) => expect(m.selfConsumptionKwh).toBeCloseTo(100 * m.daysInMonth, 5));
    });

    it('Überschuss wird vollständig eingespeist: (PV - Bedarf) × Monatstage', () => {
      const result = calculateMonthlyEnergyFlows(HIGH_MONTHLY_PV, mkSystem(), mkConsumption());
      // Überschuss = 200 - 100 = 100 kWh/Tag
      result.forEach((m) => {
        expect(m.gridExportKwh).toBeCloseTo(100 * m.daysInMonth, 5);
      });
    });

    it('keine Batterieladung wenn kein Speicher vorhanden', () => {
      const result = calculateMonthlyEnergyFlows(
        HIGH_MONTHLY_PV,
        mkSystem({ hasBattery: false }),
        mkConsumption()
      );
      result.forEach((m) => expect(m.batteryChargeKwh).toBeCloseTo(0, 5));
    });
  });

  describe('Überschussmonat mit Batterie: Überschuss passt vollständig in Batterie', () => {
    // Überschuss = 100 kWh/Tag, Batterie = 150 kWh → alles in Batterie, keine Einspeisung

    it('keine Netzeinspeisung wenn Batterie den gesamten Überschuss aufnimmt', () => {
      const result = calculateMonthlyEnergyFlows(
        HIGH_MONTHLY_PV,
        mkSystem({ hasBattery: true, batteryCapacityKwh: 150 }),
        mkConsumption()
      );
      result.forEach((m) => expect(m.gridExportKwh).toBeCloseTo(0, 5));
    });

    it('Batterieladung = Überschuss × Monatstage', () => {
      const result = calculateMonthlyEnergyFlows(
        HIGH_MONTHLY_PV,
        mkSystem({ hasBattery: true, batteryCapacityKwh: 150 }),
        mkConsumption()
      );
      result.forEach((m) => expect(m.batteryChargeKwh).toBeCloseTo(100 * m.daysInMonth, 5));
    });
  });

  describe('Überschussmonat mit Batterie: Batterie wird voll, Rest wird eingespeist', () => {
    // Überschuss = 100 kWh/Tag, Batterie = 50 kWh → 50 kWh/Tag in Batterie, 50 kWh/Tag eingespeist

    it('Batterieladung = Kapazität × Monatstage wenn Batterie täglich vollgeladen wird', () => {
      const result = calculateMonthlyEnergyFlows(
        HIGH_MONTHLY_PV,
        mkSystem({ hasBattery: true, batteryCapacityKwh: 50 }),
        mkConsumption()
      );
      result.forEach((m) => expect(m.batteryChargeKwh).toBeCloseTo(50 * m.daysInMonth, 5));
    });

    it('Einspeisung = Rest nach Batterieladung × Monatstage', () => {
      const result = calculateMonthlyEnergyFlows(
        HIGH_MONTHLY_PV,
        mkSystem({ hasBattery: true, batteryCapacityKwh: 50 }),
        mkConsumption()
      );
      // Rest = Überschuss(100) - Batterie(50) = 50 kWh/Tag
      result.forEach((m) => expect(m.gridExportKwh).toBeCloseTo(50 * m.daysInMonth, 5));
    });
  });

  describe('Energieerhaltung', () => {
    it('selfConsumption + batteryCharge + gridExport = pvYield (Defizitmonate)', () => {
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      result.forEach((m) => {
        const sum = m.selfConsumptionKwh + m.batteryChargeKwh + m.gridExportKwh;
        expect(sum).toBeCloseTo(m.pvYieldKwh, 5);
      });
    });

    it('selfConsumption + batteryCharge + gridExport = pvYield (Überschussmonate mit Batterie)', () => {
      const result = calculateMonthlyEnergyFlows(
        HIGH_MONTHLY_PV,
        mkSystem({ hasBattery: true, batteryCapacityKwh: 30 }),
        mkConsumption()
      );
      result.forEach((m) => {
        const sum = m.selfConsumptionKwh + m.batteryChargeKwh + m.gridExportKwh;
        expect(sum).toBeCloseTo(m.pvYieldKwh, 5);
      });
    });

    it('selfConsumption + gridSupply = dailyNeed × daysInMonth (Defizitmonate)', () => {
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), mkConsumption());
      result.forEach((m) => {
        const covered = m.selfConsumptionKwh + m.gridSupplyKwh;
        expect(covered).toBeCloseTo(m.dailyNeedKwh * m.daysInMonth, 5);
      });
    });

    it('selfConsumption + gridSupply = dailyNeed × daysInMonth (Überschussmonate)', () => {
      const result = calculateMonthlyEnergyFlows(HIGH_MONTHLY_PV, mkSystem(), mkConsumption());
      result.forEach((m) => {
        const covered = m.selfConsumptionKwh + m.gridSupplyKwh;
        expect(covered).toBeCloseTo(m.dailyNeedKwh * m.daysInMonth, 5);
      });
    });
  });

  describe('Nullfall: kein PV-Ertrag', () => {
    it('gesamter Bedarf kommt aus dem Netz', () => {
      const zeroPv = new Array(12).fill(0);
      const result = calculateMonthlyEnergyFlows(zeroPv, mkSystem(), mkConsumption());
      result.forEach((m) => {
        expect(m.selfConsumptionKwh).toBeCloseTo(0, 5);
        expect(m.batteryChargeKwh).toBeCloseTo(0, 5);
        expect(m.gridExportKwh).toBeCloseTo(0, 5);
        expect(m.gridSupplyKwh).toBeCloseTo(m.dailyNeedKwh * m.daysInMonth, 5);
      });
    });
  });

  describe('Verbrauchsaggregation (identisch zu calculateEnergyYield)', () => {
    it('täglicher Bedarf beinhaltet alle optionalen Verbraucher', () => {
      // Basis: 5 × 2000 × 1.0 = 10.000 + WP 2000 + EV 1×1000 + Allgemein 365 = 13.365 kWh/Jahr
      // dailyNeed = 13.365 / 365 ≈ 36.62 kWh/Tag
      const con = mkConsumption({
        apartments: 5,
        consumptionPerApartmentKwh: 2000,
        hasHeatPump: true,
        heatPumpConsumptionKwh: 2000,
        hasEvCharging: true,
        evChargingPoints: 1,
        evChargingConsumptionPerPointKwh: 1000,
        hasGeneralConsumption: true,
        generalConsumptionKwh: 365,
      });
      const result = calculateMonthlyEnergyFlows(LOW_MONTHLY_PV, mkSystem(), con);
      const expectedAnnual = 5 * 2000 * 1.0 + 2000 + 1 * 1000 + 365; // 13365
      expect(result[0].dailyNeedKwh).toBeCloseTo(expectedAnnual / 365, 5);
    });
  });
});

// ---------------------------------------------------------------------------
// fetchPvgisMonthlyYield
// ---------------------------------------------------------------------------

describe('fetchPvgisMonthlyYield', () => {
  it('gibt 12 Nullwerte zurück wenn PV-Kapazität 0 kWp ist', async () => {
    const result = await fetchPvgisMonthlyYield(mkSystem({ pvCapacityKwp: 0 }));
    expect(result).toHaveLength(12);
    result.forEach((v) => expect(v).toBe(0));
  });

  it('Fallback ohne Koordinaten: TYPICAL_MONTHLY_DISTRIBUTION × Jahresfallback', async () => {
    // locationLat/Lon = 0 → falsy → Fallback: 10 kWp × 1000 kWh/kWp = 10.000 kWh/Jahr
    const result = await fetchPvgisMonthlyYield(
      mkSystem({ locationLat: 0, locationLon: 0, pvCapacityKwp: 10 })
    );
    expect(result).toHaveLength(12);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(10000, 1);
  });

  it('Fallback-Verteilung: Sommermonate haben mehr Ertrag als Wintermonate', async () => {
    const result = await fetchPvgisMonthlyYield(
      mkSystem({ locationLat: 0, locationLon: 0, pvCapacityKwp: 10 })
    );
    expect(result[5]).toBeGreaterThan(result[0]); // Juni > Januar
    expect(result[5]).toBeGreaterThan(result[11]); // Juni > Dezember
  });

  it('Fallback-Verteilung stimmt mit TYPICAL_MONTHLY_DISTRIBUTION überein', async () => {
    const pvKwp = 10;
    const result = await fetchPvgisMonthlyYield(
      mkSystem({ locationLat: 0, locationLon: 0, pvCapacityKwp: pvKwp })
    );
    TYPICAL_MONTHLY_DISTRIBUTION.forEach((share, i) => {
      expect(result[i]).toBeCloseTo(share * pvKwp * 1000, 5);
    });
  });

  it('Fallback bei API-Fehler gibt typische Monatsverteilung zurück', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Netzwerkfehler')));
    const result = await fetchPvgisMonthlyYield(mkSystem({ pvCapacityKwp: 10 }));
    expect(result).toHaveLength(12);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(10000, 1);
    vi.unstubAllGlobals();
  });

  it('parst PVGIS-Monatsdaten korrekt (E_m je Monat)', async () => {
    const mockMonthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      E_m: (i + 1) * 100, // Jan=100, Feb=200, …, Dez=1200
    }));
    const mockResponse = { outputs: { monthly: { fixed: mockMonthly } } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ json: () => Promise.resolve(mockResponse) })
    );
    const result = await fetchPvgisMonthlyYield(mkSystem({ pvCapacityKwp: 10 }));
    expect(result).toHaveLength(12);
    expect(result[0]).toBe(100);   // Januar
    expect(result[11]).toBe(1200); // Dezember
    vi.unstubAllGlobals();
  });

  it('sortiert PVGIS-Monatsdaten nach Monatsnummer', async () => {
    // PVGIS liefert Monate ungeordnet – Implementierung muss sortieren
    const unsortedMonthly = [
      { month: 12, E_m: 400 },
      { month: 1, E_m: 100 },
      { month: 6, E_m: 900 },
      ...Array.from({ length: 9 }, (_, i) => ({ month: i + 2, E_m: 200 + i * 50 })),
    ].slice(0, 12);
    // Erstelle vollständige 12-Monate-Antwort
    const fullMonthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, E_m: (i + 1) * 80 }));
    fullMonthly.sort(() => Math.random() - 0.5); // zufällig mischen
    const mockResponse = { outputs: { monthly: { fixed: fullMonthly } } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ json: () => Promise.resolve(mockResponse) })
    );
    const result = await fetchPvgisMonthlyYield(mkSystem({ pvCapacityKwp: 10 }));
    // Index 0 = Januar (month=1) → E_m = 1×80 = 80
    expect(result[0]).toBe(80);
    // Index 11 = Dezember (month=12) → E_m = 12×80 = 960
    expect(result[11]).toBe(960);
    vi.unstubAllGlobals();
  });

  it('Fallback wenn PVGIS weniger als 12 Monate zurückgibt', async () => {
    const incompleteMonthly = Array.from({ length: 6 }, (_, i) => ({ month: i + 1, E_m: 500 }));
    const mockResponse = { outputs: { monthly: { fixed: incompleteMonthly } } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ json: () => Promise.resolve(mockResponse) })
    );
    const result = await fetchPvgisMonthlyYield(mkSystem({ pvCapacityKwp: 10 }));
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(10000, 1); // Fallback
    vi.unstubAllGlobals();
  });
});

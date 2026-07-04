import { describe, it, expect, vi } from 'vitest';
import {
  calculateEnergyYield,
  calculateEconomics,
  fetchPvgisYield,
} from '../../src/lib/calculations';
import type {
  SystemParams,
  ConsumptionParams,
  EconomicParams,
  FinancingParams,
  EnergyResults,
} from '../../src/types';

// ---------------------------------------------------------------------------
// Test-Fixtures
// ---------------------------------------------------------------------------

const mkSystem = (overrides: Partial<SystemParams> = {}): SystemParams => ({
  address: 'Teststraße 1, München',
  locationLat: 48.13,
  locationLon: 11.57,
  inclination: 30,
  azimuth: 0,
  mountingType: 'south',
  systemLoss: 14,
  pvCapacityKwp: 10,
  hasBattery: false,
  batteryCapacityKwh: 0,
  ...overrides,
});

const mkConsumption = (overrides: Partial<ConsumptionParams> = {}): ConsumptionParams => ({
  apartments: 10,
  participationRate: 1.0,
  consumptionPerApartmentKwh: 2000,
  hasHeatPump: false,
  heatPumpConsumptionKwh: 0,
  hasEvCharging: false,
  evChargingPoints: 0,
  evChargingConsumptionPerPointKwh: 0,
  hasGeneralConsumption: false,
  generalConsumptionKwh: 0,
  ...overrides,
});

const mkEconomics = (overrides: Partial<EconomicParams> = {}): EconomicParams => ({
  model: 'GGV',
  tenantElectricityRate: 25,
  gridElectricityRate: 30,
  feedInTariff: 8,
  tenantElectricitySubsidy: 2,
  baseFeePerMonth: 5,
  roofRentPerMonth: 0,
  capex: 50000,
  opexPerYear: 1000,
  calculationPeriodYears: 20,
  ...overrides,
});

const mkFinancing = (overrides: Partial<FinancingParams> = {}): FinancingParams => ({
  loanAmount: 0,
  loanTermYears: 20,
  interestRate: 3,
  ...overrides,
});

// Vordefiniertes Energieergebnis für Wirtschaftlichkeitstests:
// selfConsumption=5000 kWh, gridExport=3000 kWh, totalYield=8000 kWh
const mkEnergy = (overrides: Partial<EnergyResults> = {}): EnergyResults => ({
  totalYieldKwh: 8000,
  selfConsumptionKwh: 5000,
  gridSupplyKwh: 15000,
  gridExportKwh: 3000,
  autarkyRate: 25,
  selfConsumptionRate: 62.5,
  totalConsumptionKwh: 20000,
  pvDirectConsumptionKwh: 4000,
  batteryDischargeKwh: 1000,
  ...overrides,
});

// ---------------------------------------------------------------------------
// calculateEnergyYield
// Signatur: calculateEnergyYield(pvYieldKwh, system, consumption)
// ---------------------------------------------------------------------------

describe('calculateEnergyYield', () => {
  describe('Gesamtverbrauch Aggregation', () => {
    it('berechnet Basisverbrauch: Wohneinheiten × kWh/WE × Teilnehmerquote', () => {
      // 10 WE × 2000 kWh × 100% = 20.000 kWh
      const result = calculateEnergyYield(10000, mkSystem(), mkConsumption());
      expect(result.totalConsumptionKwh).toBe(20000);
    });

    it('berücksichtigt Teilnehmerquote korrekt', () => {
      // 10 WE × 2000 kWh × 80% = 16.000 kWh
      const result = calculateEnergyYield(10000, mkSystem(), mkConsumption({ participationRate: 0.8 }));
      expect(result.totalConsumptionKwh).toBe(16000);
    });

    it('addiert Wärmepumpe wenn aktiv', () => {
      // Basis 20.000 + 3.000 = 23.000 kWh
      const result = calculateEnergyYield(
        10000,
        mkSystem(),
        mkConsumption({ hasHeatPump: true, heatPumpConsumptionKwh: 3000 })
      );
      expect(result.totalConsumptionKwh).toBe(23000);
    });

    it('ignoriert Wärmepumpe wenn deaktiviert', () => {
      const result = calculateEnergyYield(
        10000,
        mkSystem(),
        mkConsumption({ hasHeatPump: false, heatPumpConsumptionKwh: 3000 })
      );
      expect(result.totalConsumptionKwh).toBe(20000);
    });

    it('addiert E-Mobilität: Ladepunkte × kWh/Ladepunkt', () => {
      // 2 × 2000 kWh = 4000 kWh → gesamt 24.000 kWh
      const result = calculateEnergyYield(
        10000,
        mkSystem(),
        mkConsumption({ hasEvCharging: true, evChargingPoints: 2, evChargingConsumptionPerPointKwh: 2000 })
      );
      expect(result.totalConsumptionKwh).toBe(24000);
    });

    it('ignoriert E-Mobilität wenn deaktiviert', () => {
      const result = calculateEnergyYield(
        10000,
        mkSystem(),
        mkConsumption({ hasEvCharging: false, evChargingPoints: 2, evChargingConsumptionPerPointKwh: 2000 })
      );
      expect(result.totalConsumptionKwh).toBe(20000);
    });

    it('addiert Allgemeinstrom wenn aktiv', () => {
      const result = calculateEnergyYield(
        10000,
        mkSystem(),
        mkConsumption({ hasGeneralConsumption: true, generalConsumptionKwh: 500 })
      );
      expect(result.totalConsumptionKwh).toBe(20500);
    });

    it('addiert alle optionalen Verbraucher korrekt', () => {
      // 10 × 2000 × 0.8 = 16.000 + 3000 (WP) + 2×1000 (EV) + 500 (Allgemein) = 21.500 kWh
      const result = calculateEnergyYield(
        10000,
        mkSystem(),
        mkConsumption({
          participationRate: 0.8,
          hasHeatPump: true,
          heatPumpConsumptionKwh: 3000,
          hasEvCharging: true,
          evChargingPoints: 2,
          evChargingConsumptionPerPointKwh: 1000,
          hasGeneralConsumption: true,
          generalConsumptionKwh: 500,
        })
      );
      expect(result.totalConsumptionKwh).toBe(21500);
    });
  });

  describe('Nullfälle', () => {
    it('gibt korrekte Nullwerte zurück wenn Verbrauch 0 ist', () => {
      const result = calculateEnergyYield(5000, mkSystem(), mkConsumption({ apartments: 0 }));
      expect(result.totalConsumptionKwh).toBe(0);
      expect(result.selfConsumptionKwh).toBe(0);
      expect(result.gridSupplyKwh).toBe(0);
      expect(result.gridExportKwh).toBe(5000); // gesamter PV-Ertrag wird eingespeist
      expect(result.autarkyRate).toBe(0);
      expect(result.selfConsumptionRate).toBe(0);
      expect(result.pvDirectConsumptionKwh).toBe(0);
      expect(result.batteryDischargeKwh).toBe(0);
    });

    it('gibt korrekte Nullwerte zurück wenn PV-Ertrag 0 ist', () => {
      const result = calculateEnergyYield(0, mkSystem(), mkConsumption());
      expect(result.totalYieldKwh).toBe(0);
      expect(result.selfConsumptionKwh).toBe(0);
      expect(result.gridExportKwh).toBe(0);
      expect(result.gridSupplyKwh).toBe(20000); // gesamter Bedarf aus dem Netz
      expect(result.autarkyRate).toBe(0);
      expect(result.selfConsumptionRate).toBe(0);
    });
  });

  describe('Kleine PV / großer Verbrauch (Eigenverbrauchsquoten-Cap bei 85%)', () => {
    // PV = 3000 kWh, Verbrauch = 30.000 kWh → pvDirectRate = (30000/3000)*0.35 = 3.5 → cap 0.85
    // selfConsumption = 3000 × 0.85 = 2550 kWh
    it('begrenzt Eigenverbrauchsquote auf 85%', () => {
      const result = calculateEnergyYield(
        3000,
        mkSystem(),
        mkConsumption({ consumptionPerApartmentKwh: 3000 })
      );
      expect(result.selfConsumptionKwh).toBeCloseTo(2550, 1);
    });

    it('berechnet Einspeisung korrekt: pvYield - selfConsumption', () => {
      const result = calculateEnergyYield(
        3000,
        mkSystem(),
        mkConsumption({ consumptionPerApartmentKwh: 3000 })
      );
      expect(result.gridExportKwh).toBeCloseTo(450, 1); // 3000 - 2550
    });

    it('berechnet Netzbezug korrekt: totalConsumption - selfConsumption', () => {
      const result = calculateEnergyYield(
        3000,
        mkSystem(),
        mkConsumption({ consumptionPerApartmentKwh: 3000 })
      );
      expect(result.gridSupplyKwh).toBeCloseTo(27450, 1); // 30000 - 2550
    });

    it('berechnet Autarkiegrad: selfConsumption / totalConsumption × 100', () => {
      const result = calculateEnergyYield(
        3000,
        mkSystem(),
        mkConsumption({ consumptionPerApartmentKwh: 3000 })
      );
      expect(result.autarkyRate).toBeCloseTo(8.5, 2); // 2550 / 30000 × 100
    });

    it('berechnet Eigenverbrauchsquote: selfConsumption / pvYield × 100', () => {
      const result = calculateEnergyYield(
        3000,
        mkSystem(),
        mkConsumption({ consumptionPerApartmentKwh: 3000 })
      );
      expect(result.selfConsumptionRate).toBeCloseTo(85, 2); // 2550 / 3000 × 100
    });
  });

  describe('Große PV / kleiner Verbrauch (Eigenverbrauch wird durch Verbrauch begrenzt)', () => {
    // PV = 30.000 kWh, Verbrauch = 2000 kWh (1 WE)
    // pvDirectRate = (2000/30000)*0.35 = 0.02333
    // selfConsumption = 30000 × 0.02333 = 700 kWh (< 2000, kein Cap durch Verbrauch)
    it('berechnet Eigenverbrauch ohne Verbrauchscap korrekt', () => {
      const result = calculateEnergyYield(30000, mkSystem(), mkConsumption({ apartments: 1 }));
      expect(result.selfConsumptionKwh).toBeCloseTo(700, 1);
    });

    it('berechnet Einspeisung bei hohem Überschuss korrekt', () => {
      const result = calculateEnergyYield(30000, mkSystem(), mkConsumption({ apartments: 1 }));
      expect(result.gridExportKwh).toBeCloseTo(29300, 1); // 30000 - 700
    });

    it('berechnet Autarkiegrad bei kleinem Verbrauch korrekt', () => {
      const result = calculateEnergyYield(30000, mkSystem(), mkConsumption({ apartments: 1 }));
      expect(result.autarkyRate).toBeCloseTo(35, 2); // 700 / 2000 × 100
    });
  });

  describe('Energieerhaltung', () => {
    it('gridExport + selfConsumption = pvYield', () => {
      const pvYield = 10000;
      const result = calculateEnergyYield(pvYield, mkSystem(), mkConsumption());
      expect(result.gridExportKwh + result.selfConsumptionKwh).toBeCloseTo(pvYield, 5);
    });

    it('gridSupply + selfConsumption = totalConsumption', () => {
      const result = calculateEnergyYield(10000, mkSystem(), mkConsumption());
      expect(result.gridSupplyKwh + result.selfConsumptionKwh).toBeCloseTo(
        result.totalConsumptionKwh,
        5
      );
    });

    it('selfConsumption darf totalConsumption nicht übersteigen', () => {
      // Sehr große PV → selfConsumption wird auf Verbrauch gedeckelt
      const result = calculateEnergyYield(
        100000,
        mkSystem(),
        mkConsumption({ apartments: 1, consumptionPerApartmentKwh: 500 })
      );
      expect(result.selfConsumptionKwh).toBeLessThanOrEqual(result.totalConsumptionKwh + 0.001);
    });

    it('pvDirectConsumption + batteryDischarge = selfConsumption', () => {
      const result = calculateEnergyYield(
        10000,
        mkSystem({ hasBattery: true, batteryCapacityKwh: 20 }),
        mkConsumption({ apartments: 1, consumptionPerApartmentKwh: 2000 })
      );
      expect(result.pvDirectConsumptionKwh + result.batteryDischargeKwh).toBeCloseTo(
        result.selfConsumptionKwh,
        5
      );
    });
  });

  describe('Batteriespeicher', () => {
    it('ohne Batterie: batteryDischargeKwh = 0', () => {
      const result = calculateEnergyYield(10000, mkSystem({ hasBattery: false }), mkConsumption());
      expect(result.batteryDischargeKwh).toBe(0);
    });

    it('mit Batterie erhöht sich der Autarkiegrad gegenüber ohne Batterie', () => {
      const con = mkConsumption({ apartments: 1, consumptionPerApartmentKwh: 2000 });
      const resultOhne = calculateEnergyYield(10000, mkSystem({ hasBattery: false }), con);
      const resultMit = calculateEnergyYield(
        10000,
        mkSystem({ hasBattery: true, batteryCapacityKwh: 20 }),
        con
      );
      expect(resultMit.autarkyRate).toBeGreaterThan(resultOhne.autarkyRate);
    });

    it('Autarkiegrad 100% wenn PV+Batterie den gesamten Bedarf deckt', () => {
      // PV = 10.000 kWh, Verbrauch = 2.000 kWh → genug für vollständige Eigenversorgung
      const result = calculateEnergyYield(
        10000,
        mkSystem({ hasBattery: true, batteryCapacityKwh: 20 }),
        mkConsumption({ apartments: 1, consumptionPerApartmentKwh: 2000 })
      );
      expect(result.autarkyRate).toBeCloseTo(100, 1);
      expect(result.gridSupplyKwh).toBeCloseTo(0, 1);
    });

    it('Batterie hat keinen Einfluss wenn Kapazität 0 ist', () => {
      const con = mkConsumption();
      const resultOhne = calculateEnergyYield(10000, mkSystem({ hasBattery: false }), con);
      const resultMitNull = calculateEnergyYield(
        10000,
        mkSystem({ hasBattery: true, batteryCapacityKwh: 0 }),
        con
      );
      expect(resultMitNull.selfConsumptionKwh).toBeCloseTo(resultOhne.selfConsumptionKwh, 5);
    });
  });

  describe('Gültige Wertebereiche', () => {
    it('autarkyRate liegt zwischen 0 und 100', () => {
      const result = calculateEnergyYield(10000, mkSystem(), mkConsumption());
      expect(result.autarkyRate).toBeGreaterThanOrEqual(0);
      expect(result.autarkyRate).toBeLessThanOrEqual(100);
    });

    it('selfConsumptionRate liegt zwischen 0 und 100', () => {
      const result = calculateEnergyYield(10000, mkSystem(), mkConsumption());
      expect(result.selfConsumptionRate).toBeGreaterThanOrEqual(0);
      expect(result.selfConsumptionRate).toBeLessThanOrEqual(100);
    });

    it('alle Energiemengen sind nicht negativ', () => {
      const result = calculateEnergyYield(10000, mkSystem(), mkConsumption());
      expect(result.selfConsumptionKwh).toBeGreaterThanOrEqual(0);
      expect(result.gridSupplyKwh).toBeGreaterThanOrEqual(0);
      expect(result.gridExportKwh).toBeGreaterThanOrEqual(0);
      expect(result.pvDirectConsumptionKwh).toBeGreaterThanOrEqual(0);
      expect(result.batteryDischargeKwh).toBeGreaterThanOrEqual(0);
    });
  });
});

// ---------------------------------------------------------------------------
// calculateEconomics
// ---------------------------------------------------------------------------

describe('calculateEconomics', () => {
  describe('Cashflow-Plan Struktur', () => {
    it('enthält genau so viele Einträge wie Betrachtungsjahre', () => {
      const result = calculateEconomics(mkEnergy(), mkEconomics(), mkFinancing(), mkConsumption());
      expect(result.cashflowPlan).toHaveLength(20);
    });

    it('Jahresnummern laufen von 1 bis calculationPeriodYears', () => {
      const result = calculateEconomics(mkEnergy(), mkEconomics(), mkFinancing(), mkConsumption());
      expect(result.cashflowPlan[0].year).toBe(1);
      expect(result.cashflowPlan[19].year).toBe(20);
    });
  });

  describe('GGV-Modell – Einnahmen', () => {
    // selfConsumption=5000 kWh, tenantElectricityRate=25 ct → 5000 × 0.25 = 1250 €
    // gridExport=3000 kWh, feedInTariff=8 ct → 3000 × 0.08 = 240 €
    it('berechnet Mieterstromerträge korrekt (ct/kWh → €)', () => {
      const result = calculateEconomics(mkEnergy(), mkEconomics(), mkFinancing(), mkConsumption());
      expect(result.cashflowPlan[0].revenueTenantElectricity).toBeCloseTo(1250, 2);
    });

    it('berechnet Einspeisevergütung korrekt', () => {
      const result = calculateEconomics(mkEnergy(), mkEconomics(), mkFinancing(), mkConsumption());
      expect(result.cashflowPlan[0].revenueFeedIn).toBeCloseTo(240, 2);
    });

    it('GGV-Modell: keine Grundgebühr', () => {
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ model: 'GGV' }),
        mkFinancing(),
        mkConsumption()
      );
      expect(result.cashflowPlan[0].revenueBaseFee).toBe(0);
    });

    it('GGV-Modell: kein Mieterstromzuschlag', () => {
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ model: 'GGV' }),
        mkFinancing(),
        mkConsumption()
      );
      expect(result.cashflowPlan[0].revenueSubsidy).toBe(0);
    });

    it('GGV-Gesamteinnahmen Jahr 1: 1250 + 240 = 1490 €', () => {
      const result = calculateEconomics(mkEnergy(), mkEconomics(), mkFinancing(), mkConsumption());
      expect(result.cashflowPlan[0].totalRevenue).toBeCloseTo(1490, 2);
    });
  });

  describe('Mieterstrom-Modell – Zusatzeinnahmen', () => {
    // apartments=10, participationRate=1.0, baseFeePerMonth=5
    // baseFee = 10 × 1.0 × 5 × 12 = 600 €/Jahr
    it('berechnet jährliche Grundgebühr korrekt', () => {
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ model: 'Mieterstrom' }),
        mkFinancing(),
        mkConsumption()
      );
      expect(result.cashflowPlan[0].revenueBaseFee).toBeCloseTo(600, 2);
    });

    it('berechnet Mieterstromzuschlag: selfConsumption × Zuschlag/kWh', () => {
      // 5000 kWh × (2 ct / 100) = 100 €
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ model: 'Mieterstrom', tenantElectricitySubsidy: 2 }),
        mkFinancing(),
        mkConsumption()
      );
      expect(result.cashflowPlan[0].revenueSubsidy).toBeCloseTo(100, 2);
    });

    it('Mieterstrom-Modell hat höhere Gesamteinnahmen als GGV', () => {
      const energy = mkEnergy();
      const fin = mkFinancing();
      const con = mkConsumption();
      const mieterstrom = calculateEconomics(energy, mkEconomics({ model: 'Mieterstrom' }), fin, con);
      const ggv = calculateEconomics(energy, mkEconomics({ model: 'GGV' }), fin, con);
      expect(mieterstrom.cashflowPlan[0].totalRevenue).toBeGreaterThan(
        ggv.cashflowPlan[0].totalRevenue
      );
    });
  });

  describe('OPEX und Dachpacht', () => {
    it('berücksichtigt jährliche OPEX korrekt', () => {
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ opexPerYear: 1000 }),
        mkFinancing(),
        mkConsumption()
      );
      expect(result.cashflowPlan[0].opex).toBe(1000);
    });

    it('addiert monatliche Dachpacht zu OPEX: 100 €/Monat → 1200 €/Jahr', () => {
      // opexPerYear=1000 + roofRent=100×12=1200 → totalOpex=2200 €
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ opexPerYear: 1000, roofRentPerMonth: 100 }),
        mkFinancing(),
        mkConsumption()
      );
      expect(result.cashflowPlan[0].opex).toBeCloseTo(2200, 2);
    });
  });

  describe('Kreditfinanzierung und Annuität', () => {
    it('ohne Kredit: keine Kreditrate und keine Zinsen', () => {
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics(),
        mkFinancing({ loanAmount: 0 }),
        mkConsumption()
      );
      expect(result.cashflowPlan[0].loanInstallment).toBe(0);
      expect(result.cashflowPlan[0].interestPaid).toBe(0);
    });

    it('Annuität Jahr 1 entspricht der Annuitätenformel', () => {
      // loanAmount=50.000, 10 Jahre, 5% → A = 50000 × (0.05×1.05^10)/(1.05^10-1) ≈ 6475.23 €
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ calculationPeriodYears: 15 }),
        mkFinancing({ loanAmount: 50000, loanTermYears: 10, interestRate: 5 }),
        mkConsumption()
      );
      expect(result.cashflowPlan[0].loanInstallment).toBeCloseTo(6475.23, 1);
    });

    it('Zinsen Jahr 1 = Restschuld × Zinssatz', () => {
      // 50.000 × 5% = 2.500 €
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ calculationPeriodYears: 15 }),
        mkFinancing({ loanAmount: 50000, loanTermYears: 10, interestRate: 5 }),
        mkConsumption()
      );
      expect(result.cashflowPlan[0].interestPaid).toBeCloseTo(2500, 2);
    });

    it('Zinsen sinken mit fortschreitender Tilgung', () => {
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics(),
        mkFinancing({ loanAmount: 50000, loanTermYears: 10, interestRate: 5 }),
        mkConsumption()
      );
      expect(result.cashflowPlan[4].interestPaid).toBeLessThan(result.cashflowPlan[0].interestPaid);
    });

    it('Kredit ist nach Laufzeit vollständig getilgt (Restschuld ≈ 0)', () => {
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ calculationPeriodYears: 15 }),
        mkFinancing({ loanAmount: 50000, loanTermYears: 10, interestRate: 5 }),
        mkConsumption()
      );
      expect(result.cashflowPlan[9].loanRemaining).toBeCloseTo(0, 0); // Ende Jahr 10
    });

    it('nach Kreditlaufzeit: keine weitere Ratenzahlung', () => {
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ calculationPeriodYears: 15 }),
        mkFinancing({ loanAmount: 50000, loanTermYears: 10, interestRate: 5 }),
        mkConsumption()
      );
      expect(result.cashflowPlan[10].loanInstallment).toBe(0); // Jahr 11
    });

    it('zinsloses Darlehen: konstante Tilgungsrate (Kapital / Jahre)', () => {
      // 50.000 / 10 = 5.000 €/Jahr Tilgung, keine Zinsen
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ calculationPeriodYears: 15 }),
        mkFinancing({ loanAmount: 50000, loanTermYears: 10, interestRate: 0 }),
        mkConsumption()
      );
      expect(result.cashflowPlan[0].interestPaid).toBeCloseTo(0, 5);
      expect(result.cashflowPlan[0].principalPaid).toBeCloseTo(5000, 2);
      expect(result.cashflowPlan[9].loanRemaining).toBeCloseTo(0, 2);
    });
  });

  describe('LCOE – Stromgestehungskosten', () => {
    it('berechnet LCOE korrekt: (CAPEX + OPEX-Lifetime + Zinsen) / Lifetime-Ertrag × 100', () => {
      // CAPEX=50.000, OPEX=1000/yr×20=20.000, Zinsen=0 → Kosten=70.000
      // Lifetime-Ertrag = 8000 × 20 = 160.000 kWh
      // LCOE = 70.000 / 160.000 × 100 = 43,75 ct/kWh
      const result = calculateEconomics(mkEnergy(), mkEconomics(), mkFinancing(), mkConsumption());
      expect(result.lcoe).toBeCloseTo(43.75, 2);
    });

    it('LCOE steigt durch Zinszahlungen', () => {
      const ohneZins = calculateEconomics(mkEnergy(), mkEconomics(), mkFinancing({ loanAmount: 0 }), mkConsumption());
      const mitZins = calculateEconomics(
        mkEnergy(),
        mkEconomics(),
        mkFinancing({ loanAmount: 30000, loanTermYears: 10, interestRate: 5 }),
        mkConsumption()
      );
      expect(mitZins.lcoe).toBeGreaterThan(ohneZins.lcoe);
    });

    it('LCOE steigt durch Dachpacht', () => {
      // Dachpacht=100 €/Monat → +1200 €/Jahr → +24.000 € über 20 Jahre
      // Neues LCOE = (50000 + 20000 + 24000) / 160000 × 100 = 58,75 ct/kWh
      const ohnePacht = calculateEconomics(mkEnergy(), mkEconomics({ roofRentPerMonth: 0 }), mkFinancing(), mkConsumption());
      const mitPacht = calculateEconomics(mkEnergy(), mkEconomics({ roofRentPerMonth: 100 }), mkFinancing(), mkConsumption());
      expect(mitPacht.lcoe).toBeGreaterThan(ohnePacht.lcoe);
      expect(mitPacht.lcoe).toBeCloseTo(58.75, 2);
    });
  });

  describe('Amortisationszeit (Break-Even)', () => {
    it('ermittelt korrekte Amortisationszeit', () => {
      // CAPEX=5.000, kein Kredit, keine OPEX
      // Einnahmen: 2000 kWh × 25 ct = 500 €/Jahr → Break-Even nach 10 Jahren (-5000 + 10×500 = 0)
      const result = calculateEconomics(
        mkEnergy({ selfConsumptionKwh: 2000, gridExportKwh: 0, totalYieldKwh: 2000 }),
        mkEconomics({ capex: 5000, opexPerYear: 0, calculationPeriodYears: 20 }),
        mkFinancing({ loanAmount: 0 }),
        mkConsumption()
      );
      expect(result.amortizationYears).toBe(10);
    });

    it('gibt null zurück wenn Break-Even nicht im Betrachtungszeitraum erreicht wird', () => {
      // Sehr hohe CAPEX bei niedrigen Einnahmen
      const result = calculateEconomics(
        mkEnergy({ selfConsumptionKwh: 100, gridExportKwh: 0, totalYieldKwh: 100 }),
        mkEconomics({ capex: 100000, opexPerYear: 0, calculationPeriodYears: 20 }),
        mkFinancing({ loanAmount: 0 }),
        mkConsumption()
      );
      expect(result.amortizationYears).toBeNull();
    });
  });

  describe('accumulatedCashflow', () => {
    it('ist die Summe aller jährlichen Cashflows', () => {
      const result = calculateEconomics(mkEnergy(), mkEconomics(), mkFinancing(), mkConsumption());
      const manualSum = result.cashflowPlan.reduce((sum, cf) => sum + cf.cashflow, 0);
      expect(result.accumulatedCashflow).toBeCloseTo(manualSum, 5);
    });
  });

  describe('Kumulativer Cashflow', () => {
    it('startet mit negativem Eigenkapitaleinsatz (CAPEX - Kredit)', () => {
      // CAPEX=50.000, kein Kredit → Eigenkapital=50.000 → initial=-50.000
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ capex: 50000 }),
        mkFinancing({ loanAmount: 0 }),
        mkConsumption()
      );
      const year1Cashflow = result.cashflowPlan[0].cashflow;
      expect(result.cashflowPlan[0].cumulativeCashflow).toBeCloseTo(-50000 + year1Cashflow, 2);
    });

    it('Kredit reduziert den Eigenkapitaleinsatz', () => {
      // CAPEX=50.000, Kredit=30.000 → Eigenkapital=20.000 → initial=-20.000
      const result = calculateEconomics(
        mkEnergy(),
        mkEconomics({ capex: 50000 }),
        mkFinancing({ loanAmount: 30000 }),
        mkConsumption()
      );
      const year1Cashflow = result.cashflowPlan[0].cashflow;
      expect(result.cashflowPlan[0].cumulativeCashflow).toBeCloseTo(-20000 + year1Cashflow, 2);
    });
  });
});

// ---------------------------------------------------------------------------
// fetchPvgisYield
// ---------------------------------------------------------------------------

describe('fetchPvgisYield', () => {
  it('gibt 0 zurück wenn PV-Kapazität 0 kWp ist', async () => {
    const result = await fetchPvgisYield(mkSystem({ pvCapacityKwp: 0 }));
    expect(result).toBe(0);
  });

  it('Fallback ohne Koordinaten: pvCapacityKwp × 1000 kWh/kWp', async () => {
    // locationLat/Lon = 0 → falsy → Fallback
    const result = await fetchPvgisYield(
      mkSystem({ locationLat: 0, locationLon: 0, pvCapacityKwp: 10 })
    );
    expect(result).toBe(10000);
  });

  it('Fallback bei API-Fehler: pvCapacityKwp × 1000', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Netzwerkfehler')));
    const result = await fetchPvgisYield(mkSystem({ pvCapacityKwp: 8 }));
    expect(result).toBe(8000);
    vi.unstubAllGlobals();
  });

  it('parst PVGIS-Antwort korrekt (outputs.totals.fixed.E_y)', async () => {
    const mockResponse = { outputs: { totals: { fixed: { E_y: 9500 } } } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ json: () => Promise.resolve(mockResponse) })
    );
    const result = await fetchPvgisYield(mkSystem({ pvCapacityKwp: 10 }));
    expect(result).toBe(9500);
    vi.unstubAllGlobals();
  });

  it('Fallback wenn PVGIS-Antwort kein E_y enthält', async () => {
    const mockResponse = { outputs: {} };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ json: () => Promise.resolve(mockResponse) })
    );
    const result = await fetchPvgisYield(mkSystem({ pvCapacityKwp: 5 }));
    expect(result).toBe(5000); // Fallback
    vi.unstubAllGlobals();
  });

  describe('Ost-West-Montage', () => {
    it('stellt zwei Anfragen (Ost -90°, West +90°) mit je halber kWp und summiert die Erträge', async () => {
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(async (url: string) => {
          expect(url).toContain('aspect=-90');
          expect(url).toContain('peakpower=5');
          return { json: () => Promise.resolve({ outputs: { totals: { fixed: { E_y: 4000 } } } }) };
        })
        .mockImplementationOnce(async (url: string) => {
          expect(url).toContain('aspect=90');
          expect(url).toContain('peakpower=5');
          return { json: () => Promise.resolve({ outputs: { totals: { fixed: { E_y: 4500 } } } }) };
        });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchPvgisYield(mkSystem({ pvCapacityKwp: 10, mountingType: 'eastWest' }));

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toBe(8500);
      vi.unstubAllGlobals();
    });
  });
});

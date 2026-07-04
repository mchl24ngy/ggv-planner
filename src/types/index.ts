export interface SystemParams {
  address: string; // Adresse zur Geokodierung
  locationLat: number; // Breitengrad (PVGIS)
  locationLon: number; // Längengrad (PVGIS)
  inclination: number; // Neigungswinkel in Grad (0-90)
  azimuth: number; // Ausrichtung in Grad (0=Süd, -90=Ost, 90=West), nur bei mountingType 'south' relevant
  mountingType: 'south' | 'eastWest'; // Montageart: einheitliche Ausrichtung (azimuth) oder Ost-West-Montage (je 50% Ost/West)
  systemLoss: number; // Systemverluste in % (z.B. 14)
  pvCapacityKwp: number; // PV-Leistung in kWp
  hasBattery: boolean; // Batteriespeicher vorhanden?
  batteryCapacityKwh: number; // Kapazität in kWh
}

export interface ConsumptionParams {
  apartments: number; // Anzahl der WE
  participationRate: number; // Teilnehmerquote 0–1 (Anteil der am Modell teilnehmenden WE)
  consumptionPerApartmentKwh: number; // kWh pro Jahr/WE
  hasHeatPump: boolean; // Wärmepumpe vorhanden?
  heatPumpConsumptionKwh: number; // Wärmepumpen-Bedarf kWh
  hasEvCharging: boolean; // E-Mobilität vorhanden?
  evChargingPoints: number; // Anzahl Ladepunkte
  evChargingConsumptionPerPointKwh: number; // Energiebedarf pro Ladepunkt in kWh
  hasGeneralConsumption: boolean; // Allgemeinstrom vorhanden?
  generalConsumptionKwh: number; // Allgemeinstrom kWh
}

export interface EconomicParams {
  model: 'Mieterstrom' | 'GGV';
  tenantElectricityRate: number; // Verkaufs-Tarif an Mieter (ct/kWh)
  gridElectricityRate: number; // Referenzpreis Grundversorger (ct/kWh)
  feedInTariff: number; // EEG-Vergütung für Einspeisung (ct/kWh)
  tenantElectricitySubsidy: number; // Mieterstromzuschlag (variabel) (ct/kWh)
  baseFeePerMonth: number; // Grundgebühr pro Monat/WE (€)
  roofRentPerMonth: number; // Monatliche Dachpacht (€)
  capex: number; // Investitionskosten (€)
  opexPerYear: number; // Jährliche Betriebskosten (€)
  calculationPeriodYears: number; // Betrachtungszeitraum in Jahren (z.B. 20)
}

export interface FinancingParams {
  loanAmount: number; // €
  loanTermYears: number; // Jahre
  interestRate: number; // % p.a.
}

export interface SimulationInputs {
  system: SystemParams;
  consumption: ConsumptionParams;
  economics: EconomicParams;
  financing: FinancingParams;
}

export interface EnergyResults {
  totalYieldKwh: number; // Erzeugte Energie gesamt via PVGIS
  selfConsumptionKwh: number; // Eigenverbrauch (PV + Batterie)
  gridSupplyKwh: number; // Netzbezug
  gridExportKwh: number; // Netzeinspeisung
  autarkyRate: number; // Autarkiegrad (%)
  selfConsumptionRate: number; // Eigenverbrauchsquote (%)
  totalConsumptionKwh: number; // Gesamtverbrauch
  pvDirectConsumptionKwh: number; // Direktverbrauch PV
  batteryDischargeKwh: number; // Batterie-Entladung
}

export interface YearlyCashflow {
  year: number;
  revenueTenantElectricity: number;
  revenueFeedIn: number;
  revenueBaseFee: number;
  revenueSubsidy: number;
  totalRevenue: number;
  opex: number;
  loanInstallment: number;
  interestPaid: number;
  principalPaid: number;
  loanRemaining: number;
  cashflow: number;
  cumulativeCashflow: number;
  lcoe: number | null; // Nur im ersten Jahr relevant oder global berechnet
}

export interface EconomicResults {
  lcoe: number; // Stromgestehungskosten (€/kWh)
  amortizationYears: number | null; // Amortisationszeit in Jahren
  accumulatedCashflow: number; // Summe aller jährlichen Cashflows vor Steuern über den Betrachtungszeitraum
  cashflowPlan: YearlyCashflow[];
}

export interface MonthlyEnergyFlow {
  month: number; // Monatsnummer 1–12
  daysInMonth: number; // Tage des Monats
  pvYieldKwh: number; // Monatlicher PV-Ertrag aus PVGIS (kWh)
  dailyPvKwh: number; // Durchschnittlicher täglicher PV-Ertrag (kWh/Tag)
  dailyNeedKwh: number; // Täglicher Energiebedarf (konstant, kWh/Tag)
  selfConsumptionKwh: number; // Direkt selbst verbrauchter PV-Strom (kWh/Monat)
  batteryChargeKwh: number; // In den Speicher geladene Energie (kWh/Monat)
  gridExportKwh: number; // Ins Netz eingespeiste Energie (kWh/Monat)
  gridSupplyKwh: number; // Aus dem Netz bezogene Energie (kWh/Monat)
}

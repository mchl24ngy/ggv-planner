import {
  SystemParams,
  ConsumptionParams,
  EconomicParams,
  FinancingParams,
  EnergyResults,
  EconomicResults,
  YearlyCashflow,
} from '../types';

/**
 * Holt den jährlichen Gesamtertrag aus der PVGIS-API
 */
export async function fetchPvgisYield(system: SystemParams): Promise<number> {
  const { locationLat, locationLon, pvCapacityKwp, systemLoss, inclination, azimuth } = system;

  if (pvCapacityKwp === 0) return 0;
  if (!locationLat || !locationLon) {
    // Fallback Approximation wenn keine Koordinaten da sind (~1000 kWh/kWp)
    return pvCapacityKwp * 1000;
  }

  try {
    const pvgisBase = import.meta.env.VITE_PVGIS_BASE_URL ?? '/pvgis-api/api/v5_2';
    const url = `${pvgisBase}/PVcalc?lat=${locationLat}&lon=${locationLon}&peakpower=${pvCapacityKwp}&loss=${systemLoss}&angle=${inclination}&aspect=${azimuth}&outputformat=json`;
    const response = await fetch(url);
    const data = await response.json();

    // PVGIS v5.2 JSON Response structure: data.outputs.totals.fixed.E_y
    const yearlyYield = data?.outputs?.totals?.fixed?.E_y;
    return yearlyYield || pvCapacityKwp * 1000; // Fallback falls API keine Daten liefert
  } catch (err) {
    console.error('Error fetching PVGIS data:', err);
    return pvCapacityKwp * 1000;
  }
}

/**
 * Berechnet Ertrag, Eigenverbrauch und Netzbezug
 */
export function calculateEnergyYield(
  pvYieldKwh: number,
  system: SystemParams,
  consumption: ConsumptionParams
): EnergyResults {
  // Gesamtverbrauch berechnen (nur teilnehmende WE fließen in das Modell ein)
  const totalConsumptionKwh =
    consumption.apartments *
      consumption.consumptionPerApartmentKwh *
      consumption.participationRate +
    (consumption.hasHeatPump ? consumption.heatPumpConsumptionKwh : 0) +
    (consumption.hasEvCharging
      ? consumption.evChargingPoints * consumption.evChargingConsumptionPerPointKwh
      : 0) +
    (consumption.hasGeneralConsumption ? consumption.generalConsumptionKwh : 0);

  if (totalConsumptionKwh === 0) {
    return {
      totalConsumptionKwh: 0,
      totalYieldKwh: pvYieldKwh,
      selfConsumptionKwh: 0,
      gridSupplyKwh: 0,
      gridExportKwh: pvYieldKwh,
      autarkyRate: 0,
      selfConsumptionRate: 0,
      pvDirectConsumptionKwh: 0,
      batteryDischargeKwh: 0,
    };
  }

  // Faustformel/Approximation: Grundautarkie ohne Speicher (typischerweise ~30-40% des regulären Verbrauchs, weniger für WP/E-Auto)
  // Batterieanteil verschiebt dies weiter nach oben.

  // Basiseigenverbrauch (sehr vereinfachte Heuristik für SaaS-Demozwecke statt 15min-Profile)
  let pvDirectConsumptionRate = pvYieldKwh > 0 ? (totalConsumptionKwh / pvYieldKwh) * 0.35 : 0;

  let batteryDischargeRate = 0;
  if (system.hasBattery && system.batteryCapacityKwh > 0) {
    // Batterie-Einfluss (Kapazität im Verhältnis zum Verbrauch)
    const speicherFaktor = system.batteryCapacityKwh / (totalConsumptionKwh / 365); // Speichertage
    batteryDischargeRate = Math.min(speicherFaktor * 0.4, 0.4); // max +40% durch Speicher
  }

  // Cap bei realistischen Maxima (zusammen max ca. 80-85% ohne Saisonspeicher) und physikalischem Limit
  const totalRate = Math.min(pvDirectConsumptionRate + batteryDischargeRate, 0.85);
  pvDirectConsumptionRate = Math.min(pvDirectConsumptionRate, 0.85);
  batteryDischargeRate = Math.min(batteryDischargeRate, totalRate - pvDirectConsumptionRate);

  let pvDirectConsumptionKwh = pvYieldKwh * pvDirectConsumptionRate;
  let batteryDischargeKwh = pvYieldKwh * batteryDischargeRate;
  let selfConsumptionKwh = pvDirectConsumptionKwh + batteryDischargeKwh;

  // Darf Verbrauch nicht übersteigen
  if (selfConsumptionKwh > totalConsumptionKwh) {
    const ratio = totalConsumptionKwh / selfConsumptionKwh;
    selfConsumptionKwh = totalConsumptionKwh;
    pvDirectConsumptionKwh *= ratio;
    batteryDischargeKwh *= ratio;
  }

  const gridExportKwh = Math.max(0, pvYieldKwh - selfConsumptionKwh);
  const gridSupplyKwh = Math.max(0, totalConsumptionKwh - selfConsumptionKwh);

  const autarkyRate = (selfConsumptionKwh / totalConsumptionKwh) * 100;
  const actualSelfConsumptionRate = pvYieldKwh > 0 ? (selfConsumptionKwh / pvYieldKwh) * 100 : 0;

  return {
    totalConsumptionKwh,
    totalYieldKwh: pvYieldKwh,
    selfConsumptionKwh,
    gridSupplyKwh,
    gridExportKwh,
    autarkyRate,
    selfConsumptionRate: actualSelfConsumptionRate,
    pvDirectConsumptionKwh,
    batteryDischargeKwh,
  };
}

/**
 * Berechnet die Annuität für den Kredit
 */
function calculateAnnuity(principal: number, years: number, interestRatePercent: number) {
  if (principal <= 0 || years <= 0) return { installment: 0, interest: 0, principal: 0 };
  if (interestRatePercent === 0)
    return { installment: principal / years, interest: 0, principal: principal / years };

  const r = interestRatePercent / 100;
  const factor = Math.pow(1 + r, years);
  const installment = principal * ((r * factor) / (factor - 1));

  return { installment };
}

/**
 * Berechnet Cashflow und Wirtschaftlichkeit über die Laufzeit
 */
export function calculateEconomics(
  energy: EnergyResults,
  economics: EconomicParams,
  financing: FinancingParams,
  consumption: ConsumptionParams
): EconomicResults {
  const { calculationPeriodYears } = economics;

  const cashflowPlan: YearlyCashflow[] = [];

  // LCOE Berechnen: (CAPEX + Sum(OPEX) + Zinsen) / Sum(Ertrag) (vereinfacht ohne Diskontierung)
  const { installment } = calculateAnnuity(
    financing.loanAmount,
    financing.loanTermYears,
    financing.interestRate
  );

  let remainingLoan = financing.loanAmount;
  let totalInterestPaid = 0;
  let cumulativeCashflow = -(economics.capex - financing.loanAmount); // Eigenkapital-Einsatz in Jahr 0 abziehen

  for (let year = 1; year <= calculationPeriodYears; year++) {
    // Kredit Berechnungen
    let interestPaid = 0;
    let principalPaid = 0;
    let currentInstallment = 0;

    if (year <= financing.loanTermYears && remainingLoan > 0) {
      interestPaid = remainingLoan * (financing.interestRate / 100);
      principalPaid = installment - interestPaid;

      if (principalPaid > remainingLoan) {
        principalPaid = remainingLoan;
      }

      remainingLoan -= principalPaid;
      currentInstallment = interestPaid + principalPaid;
      totalInterestPaid += interestPaid;
    }

    // Einnahmen generieren (ct in Euro umrechnen via /100)
    const revenueTenantElectricity =
      energy.selfConsumptionKwh * (economics.tenantElectricityRate / 100);
    const revenueFeedIn = energy.gridExportKwh * (economics.feedInTariff / 100);

    let revenueBaseFee = 0;
    let revenueSubsidy = 0;

    // Spezifische Mieterstrom-Einnahmen
    if (economics.model === 'Mieterstrom') {
      revenueBaseFee =
        consumption.apartments * consumption.participationRate * economics.baseFeePerMonth * 12;
      revenueSubsidy = energy.selfConsumptionKwh * (economics.tenantElectricitySubsidy / 100);
    }

    const totalRevenue = revenueTenantElectricity + revenueFeedIn + revenueBaseFee + revenueSubsidy;
    const annualRoofRent = (economics.roofRentPerMonth ?? 0) * 12;
    const totalOpex = economics.opexPerYear + annualRoofRent;
    const cashflow = totalRevenue - totalOpex - currentInstallment;

    cumulativeCashflow += cashflow;

    cashflowPlan.push({
      year,
      revenueTenantElectricity,
      revenueFeedIn,
      revenueBaseFee,
      revenueSubsidy,
      totalRevenue,
      opex: totalOpex,
      loanInstallment: currentInstallment,
      interestPaid,
      principalPaid,
      loanRemaining: remainingLoan,
      cashflow,
      cumulativeCashflow,
      lcoe: null,
    });
  }

  // Stromgestehungskosten (LCOE) vereinfacht
  const totalLifetimeYield = energy.totalYieldKwh * calculationPeriodYears;
  let lcoe = 0;
  if (totalLifetimeYield > 0) {
    const totalLifetimeOpex =
      (economics.opexPerYear + (economics.roofRentPerMonth ?? 0) * 12) * calculationPeriodYears;
    const totalCosts = economics.capex + totalLifetimeOpex + totalInterestPaid;
    lcoe = (totalCosts / totalLifetimeYield) * 100; // in Cent/kWh
  }

  // Amortisationszeit (Break-Even) berechnen
  let amortizationYears: number | null = null;
  for (const cf of cashflowPlan) {
    if (cf.cumulativeCashflow >= 0 && amortizationYears === null) {
      amortizationYears = cf.year;
    }
  }

  const accumulatedCashflow = cashflowPlan.reduce((sum, cf) => sum + cf.cashflow, 0);

  return {
    lcoe,
    amortizationYears,
    accumulatedCashflow,
    cashflowPlan,
  };
}

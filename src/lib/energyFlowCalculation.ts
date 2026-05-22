/**
 * energyFlowCalculation.ts
 *
 * Core calculation of monthly energy flows for GGV/tenant electricity systems.
 *
 * Algorithm documentation: docu/energy-flow-algorithm.md
 *
 * This file contains the two-stage calculation logic:
 *   1. Fetching monthly PV yield data from the PVGIS API (EU satellite data)
 *   2. Calculating energy flows per month on a daily basis
 *
 * Calculation steps (according to specification):
 *   Step 1 : Annual energy demand / 365 = daily demand (constant for all months)
 *   Step 3 : Monthly PV yield from PVGIS (varies per month)
 *   Step 4 : Daily PV yield = monthly yield / days in month
 *   Step 5 : Difference = daily PV yield − daily demand
 *   Step 6.1: If difference < 0 → grid supply = |difference| per day
 *   Step 6.2: If difference ≥ 0 → remaining energy = difference − battery size
 *   Step 7.1: If remaining energy < 0 → energy goes into battery (no export)
 *   Step 7.2: If remaining energy ≥ 0 → battery full, remainder is fed into grid
 *   Step 8 : Daily values × number of days in month = monthly energy amounts
 *
 * Simplifying assumptions of this model:
 *   - Battery capacity is treated as a daily buffer (charging during the day,
 *     discharging at night). This is a plausible approximation for monthly balances.
 *   - No seasonal carry-over of state of charge between months.
 *   - Daily consumption is evenly distributed throughout the year.
 */

import { SystemParams, ConsumptionParams, MonthlyEnergyFlow } from '../types';

// Days per month (standard/non-leap year, January = index 0)
const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Typical monthly distribution of PV yield in Central Europe (normalised to 1.0).
 * Used as a fallback when the PVGIS API is unreachable or no coordinates are provided.
 * Source: Average global radiation distribution for Germany (DWD).
 */
const TYPICAL_MONTHLY_DISTRIBUTION = [
  0.04, // January – very few sunshine hours
  0.05, // February
  0.08, // March – start of spring
  0.1, // April
  0.12, // May
  0.13, // June – solar maximum
  0.12, // July
  0.11, // August
  0.09, // September
  0.07, // October
  0.05, // November
  0.04, // December – very few sunshine hours
];

/**
 * Step 3: Fetches monthly PV yield data from the PVGIS API.
 *
 * The PVGIS endpoint PVcalc returns, in addition to the annual total (E_y),
 * monthly values in outputs.monthly.fixed[] with:
 *   - month: month number (1 = January … 12 = December)
 *   - E_m:   monthly energy yield in kWh
 *   - E_d:   average daily yield in kWh/day
 *
 * The same API endpoint as fetchPvgisYield is used (no second HTTP request needed),
 * since the PVGIS response always includes monthly data.
 *
 * @param system  System parameters (coordinates, capacity, losses, tilt, azimuth)
 * @returns       Array of 12 monthly yields in kWh [Jan, Feb, …, Dec]
 */
export async function fetchPvgisMonthlyYield(system: SystemParams): Promise<number[]> {
  const { locationLat, locationLon, pvCapacityKwp, systemLoss, inclination, azimuth } = system;

  // Fallback: distribute annual estimate using typical monthly distribution
  const fallbackAnnual = pvCapacityKwp * 1000;
  const fallback = TYPICAL_MONTHLY_DISTRIBUTION.map((share) => share * fallbackAnnual);

  // If no PV system is present, set all months to 0
  if (pvCapacityKwp === 0) return new Array(12).fill(0);

  // Without coordinates, no location-specific yield can be calculated
  if (!locationLat || !locationLon) return fallback;

  try {
    const pvgisBase = import.meta.env.VITE_PVGIS_BASE_URL ?? '/pvgis-api/api/v5_2';

    // Same URL as in fetchPvgisYield – the response already contains monthly data
    const url =
      `${pvgisBase}/PVcalc` +
      `?lat=${locationLat}` +
      `&lon=${locationLon}` +
      `&peakpower=${pvCapacityKwp}` +
      `&loss=${systemLoss}` +
      `&angle=${inclination}` +
      `&aspect=${azimuth}` +
      `&outputformat=json`;

    const response = await fetch(url);
    const data = await response.json();

    // PVGIS v5.2 response structure: outputs.monthly.fixed is an array of 12 objects
    const monthlyRaw = data?.outputs?.monthly?.fixed as
      | Array<{ month: number; E_m: number }>
      | undefined;

    // Validation: exactly 12 monthly values must be present
    if (!monthlyRaw || monthlyRaw.length !== 12) return fallback;

    // Sort by month number (PVGIS delivers 1=Jan…12=Dec, should already be sorted)
    // and convert to a simple array [Jan, Feb, …, Dec] (index 0 = January)
    return monthlyRaw.sort((a, b) => a.month - b.month).map((m) => m.E_m);
  } catch (err) {
    console.error('Error fetching PVGIS monthly data:', err);
    return fallback;
  }
}

/**
 * Steps 1–8: Calculates the monthly energy flows for all 12 months.
 *
 * The model operates on a daily basis and scales the results
 * to the respective number of days in each month (step 8).
 *
 * @param monthlyPvKwh  Array of 12 monthly PV yields in kWh (from PVGIS)
 * @param system        System parameters (incl. battery capacity)
 * @param consumption   Consumption parameters (all consumer groups)
 * @returns             Array of 12 MonthlyEnergyFlow objects [Jan…Dec]
 */
export function calculateMonthlyEnergyFlows(
  monthlyPvKwh: number[],
  system: SystemParams,
  consumption: ConsumptionParams
): MonthlyEnergyFlow[] {
  // Step 1: Calculate annual energy demand (identical to calculateEnergyYield)
  // Only participating housing units (participation rate) are included in the model
  const totalAnnualConsumptionKwh =
    consumption.apartments *
      consumption.consumptionPerApartmentKwh *
      consumption.participationRate +
    (consumption.hasHeatPump ? consumption.heatPumpConsumptionKwh : 0) +
    (consumption.hasEvCharging
      ? consumption.evChargingPoints * consumption.evChargingConsumptionPerPointKwh
      : 0) +
    (consumption.hasGeneralConsumption ? consumption.generalConsumptionKwh : 0);

  // Step 1 (continued): Daily demand = annual demand / 365 days
  // Simplification: even distribution over the year (no seasonal load profile)
  const dailyNeedKwh = totalAnnualConsumptionKwh / 365;

  // Battery capacity as a daily buffer: the battery can absorb at most its full
  // capacity in surplus per day (charging during the day, discharging at night)
  const batteryCapacityKwh = system.hasBattery ? system.batteryCapacityKwh : 0;

  // Steps 3–8: Calculate energy flows for each of the 12 months
  return monthlyPvKwh.map((monthlyPv, index): MonthlyEnergyFlow => {
    const daysInMonth = DAYS_PER_MONTH[index];

    // Step 4: Average daily PV yield for this month
    // (PVGIS monthly yield distributed evenly across the days of the month)
    const dailyPvKwh = daysInMonth > 0 ? monthlyPv / daysInMonth : 0;

    // Step 5: Daily energy balance
    // Positive = PV surplus, negative = PV deficit (more consumption than generation)
    const dailyDiff = dailyPvKwh - dailyNeedKwh;

    // Daily values for the four energy flows
    let dailyGridSupply = 0; // grid supply (only on deficit)
    let dailyBatteryCharge = 0; // battery charge (only on surplus)
    let dailyGridExport = 0; // grid export (only when battery is full)
    let dailySelfConsumption = 0; // direct PV self-consumption (without battery)

    if (dailyDiff < 0) {
      // Step 6.1: Deficit – PV yield is not enough for the daily demand
      // All PV power is consumed immediately; the gap is covered by the grid
      dailySelfConsumption = dailyPvKwh;
      dailyGridSupply = -dailyDiff; // absolute deficit = grid supply
    } else {
      // Step 6.2: Surplus – PV yield exceeds daily demand
      // PV covers the full demand first
      dailySelfConsumption = dailyNeedKwh;

      // Step 6.2: Remaining energy after demand coverage = surplus for storage/export
      const surplusAfterDemand = dailyDiff;
      const remainingAfterBattery = surplusAfterDemand - batteryCapacityKwh;

      if (remainingAfterBattery < 0) {
        // Step 7.1: Surplus fits entirely into the battery
        // No power is fed into the grid
        dailyBatteryCharge = surplusAfterDemand;
      } else {
        // Step 7.2: Battery is full; remaining surplus is exported to the grid
        dailyBatteryCharge = batteryCapacityKwh;
        dailyGridExport = remainingAfterBattery;
      }
    }

    // Step 8: Daily values × number of days in month = monthly energy amounts
    return {
      month: index + 1,
      daysInMonth,
      pvYieldKwh: monthlyPv,
      dailyPvKwh,
      dailyNeedKwh,
      selfConsumptionKwh: dailySelfConsumption * daysInMonth,
      batteryChargeKwh: dailyBatteryCharge * daysInMonth,
      gridExportKwh: dailyGridExport * daysInMonth,
      gridSupplyKwh: dailyGridSupply * daysInMonth,
    };
  });
}

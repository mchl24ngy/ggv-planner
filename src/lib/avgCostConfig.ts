export interface CostTier {
  upTo: number;
  pricePerUnit: number;
}

// PV: €/kWp — change here to update all auto-calculated defaults
export const PV_COST_TIERS: CostTier[] = [
  { upTo: 20, pricePerUnit: 1400 },
  { upTo: 50, pricePerUnit: 1100 },
  { upTo: Infinity, pricePerUnit: 950 },
];

// Battery storage: €/kWh — change here to update all auto-calculated defaults
export const BATTERY_COST_TIERS: CostTier[] = [
  { upTo: 15, pricePerUnit: 600 },
  { upTo: 30, pricePerUnit: 450 },
  { upTo: Infinity, pricePerUnit: 350 },
];

// OPEX constants — change here to update all auto-calculated defaults
export const TECH_MANAGEMENT_RATE = 0.01; // 1 % of CAPEX per year
export const BILLING_COST_PER_PARTICIPANT = 100; // €/year per metered participant

export interface BillingParams {
  apartments: number;
  participationRate: number;
  hasEvCharging: boolean;
  evChargingPoints: number;
  hasGeneralConsumption: boolean;
  hasHeatPump: boolean;
}

export function getTierForValue(tiers: CostTier[], value: number): CostTier {
  return tiers.find((t) => value <= t.upTo) ?? tiers[tiers.length - 1];
}

export function calcDefaultPvCost(kwp: number): number {
  return Math.round(kwp * getTierForValue(PV_COST_TIERS, kwp).pricePerUnit);
}

export function calcDefaultBatteryCost(kwh: number): number {
  return Math.round(kwh * getTierForValue(BATTERY_COST_TIERS, kwh).pricePerUnit);
}

export function calcDefaultCapex(pvKwp: number, hasBattery: boolean, batteryKwh: number): number {
  return calcDefaultPvCost(pvKwp) + (hasBattery ? calcDefaultBatteryCost(batteryKwh) : 0);
}

export function calcBillingParticipants(p: BillingParams): number {
  const apartments = Math.round(p.apartments * p.participationRate);
  const wallboxes = p.hasEvCharging ? p.evChargingPoints : 0;
  const generalConsumption = p.hasGeneralConsumption ? 1 : 0;
  const heatPump = p.hasHeatPump ? 1 : 0;
  return apartments + wallboxes + generalConsumption + heatPump;
}

export function calcDefaultTechManagementCost(capex: number): number {
  return Math.round(capex * TECH_MANAGEMENT_RATE);
}

export function calcDefaultBillingCost(p: BillingParams): number {
  return calcBillingParticipants(p) * BILLING_COST_PER_PARTICIPANT;
}

export function calcDefaultOpex(capex: number, p: BillingParams): number {
  return calcDefaultTechManagementCost(capex) + calcDefaultBillingCost(p);
}

import React from 'react';
import { EnergyResults, EconomicResults } from '../types';
import { useLanguage } from '../i18n/useLanguage';
import { Tooltip } from './Tooltip';

interface KPIDisplayProps {
  energy: EnergyResults;
  economics: EconomicResults;
  isConfigured?: boolean;
}

export const KPIDisplay: React.FC<KPIDisplayProps> = ({
  energy,
  economics,
  isConfigured = true,
}) => {
  const { t } = useLanguage();

  const placeholder = <span className="text-3xl font-bold text-slate-300">—</span>;

  return (
    <div
      data-tutorial="kpi-display"
      className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6"
    >
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <span className="text-sm font-medium text-slate-500 mb-1 flex items-center">
          {t.kpiYield}
          <Tooltip text={t.tooltipKpiYield} />
        </span>
        {isConfigured ? (
          <span className="text-3xl font-bold text-blue-800">
            {(energy.totalYieldKwh / 1000).toFixed(1)}{' '}
            <span className="text-lg font-normal text-slate-500">MWh/a</span>
          </span>
        ) : (
          placeholder
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <span className="text-sm font-medium text-slate-500 mb-1 flex items-center">
          {t.kpiAutarky}
          <Tooltip text={t.tooltipKpiAutarky} />
        </span>
        {isConfigured ? (
          <span className="text-3xl font-bold text-blue-600">
            {energy.autarkyRate.toFixed(1)} <span className="text-lg font-normal">%</span>
          </span>
        ) : (
          placeholder
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <span className="text-sm font-medium text-slate-500 mb-1 flex items-center">
          {t.kpiSelfConsumption}
          <Tooltip text={t.tooltipKpiSelfConsumption} />
        </span>
        {isConfigured ? (
          <span className="text-3xl font-bold text-blue-600">
            {energy.selfConsumptionRate.toFixed(1)} <span className="text-lg font-normal">%</span>
          </span>
        ) : (
          placeholder
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <span className="text-sm font-medium text-slate-500 mb-1 flex items-center">
          {t.kpiLcoe}
          <Tooltip text={t.tooltipKpiLcoe} />
        </span>
        {isConfigured ? (
          <span className="text-3xl font-bold text-emerald-800">
            {economics.lcoe.toFixed(2)} <span className="text-lg font-normal">ct/kWh</span>
          </span>
        ) : (
          placeholder
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <span className="text-sm font-medium text-slate-500 mb-1 flex items-center">
          {t.kpiAmortization}
          <Tooltip text={t.tooltipKpiAmortization} />
        </span>
        {isConfigured ? (
          <span className="text-3xl font-bold text-emerald-400">
            {economics.amortizationYears ? economics.amortizationYears : '>20'}{' '}
            <span className="text-lg font-normal">{t.kpiYears}</span>
          </span>
        ) : (
          placeholder
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <span className="text-sm font-medium text-slate-500 mb-1 flex items-center">
          {t.kpiAccumulatedCashflow}
          <Tooltip text={t.tooltipKpiAccumulatedCashflow} />
        </span>
        {isConfigured ? (
          <span className="text-3xl font-bold text-emerald-400">
            {(economics.accumulatedCashflow / 1000).toFixed(1)}{' '}
            <span className="text-lg font-normal">T€</span>
          </span>
        ) : (
          placeholder
        )}
      </div>
    </div>
  );
};

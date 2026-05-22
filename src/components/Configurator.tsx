import { useState, useEffect } from 'react';
import {
  SystemParams,
  ConsumptionParams,
  EconomicParams,
  FinancingParams,
  EnergyResults,
  EconomicResults,
} from '../types';
import { fetchPvgisYield, calculateEnergyYield, calculateEconomics } from '../lib/calculations';
import { KPIDisplay } from './KPIDisplay';
import { EnergyMixChart } from './charts/EnergyMixChart';
import { CashflowChart } from './charts/CashflowChart';
import { TenantSavingsChart } from './charts/TenantSavingsChart';
import { Tooltip } from './Tooltip';
import { BreakdownModal } from './BreakdownModal';
import { AddressAutocomplete } from './AddressAutocomplete';
import { useLanguage } from '../i18n/useLanguage';
import {
  Calculator,
  Battery,
  Home,
  Zap,
  Euro,
  LineChart,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Info,
  List,
} from 'lucide-react';

export const Configurator: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);

  // State: Inputs
  const [system, setSystem] = useState<SystemParams>({
    address: 'Berlin, Germany',
    locationLat: 52.52,
    locationLon: 13.405,
    inclination: 30,
    azimuth: 0,
    systemLoss: 14,
    pvCapacityKwp: 50,
    hasBattery: true,
    batteryCapacityKwh: 20,
  });

  const [consumption, setConsumption] = useState<ConsumptionParams>({
    apartments: 10,
    participationRate: 1.0,
    consumptionPerApartmentKwh: 1800,
    hasHeatPump: false,
    heatPumpConsumptionKwh: 10000,
    hasEvCharging: false,
    evChargingPoints: 2,
    evChargingConsumptionPerPointKwh: 2000,
    hasGeneralConsumption: false,
    generalConsumptionKwh: 2000,
  });

  const [economics, setEconomics] = useState<EconomicParams>({
    model: 'Mieterstrom',
    tenantElectricityRate: 25,
    gridElectricityRate: 35,
    feedInTariff: 5,
    tenantElectricitySubsidy: 2.1,
    baseFeePerMonth: 10,
    capex: 75000,
    opexPerYear: 1500,
    calculationPeriodYears: 20,
  });

  const [financing, setFinancing] = useState<FinancingParams>({
    loanAmount: 50000,
    loanTermYears: 10,
    interestRate: 4.5,
  });

  const [loanPercentage, setLoanPercentage] = useState(Math.round((50000 / 75000) * 100));

  const [capexBreakdown, setCapexBreakdown] = useState<Record<string, number>>({
    pvSystem: 0,
    battery: 0,
    installation: 0,
    consulting: 0,
    other: 0,
  });
  const [opexBreakdown, setOpexBreakdown] = useState<Record<string, number>>({
    techManagement: 0,
    billing: 0,
    adminManagement: 0,
  });
  const [showCapexModal, setShowCapexModal] = useState(false);
  const [showOpexModal, setShowOpexModal] = useState(false);

  // Snapshot der Kundeneingaben beim Betreten von Tab 3 — Basis für ±50%-Optimierungsbereiche
  const [optimizationBase, setOptimizationBase] = useState({
    tenantElectricityRate: economics.tenantElectricityRate,
    batteryCapacityKwh: system.batteryCapacityKwh,
    hasBattery: system.hasBattery,
    participationRate: consumption.participationRate,
  });

  // State: Results (with dummy defaults)
  const [energy, setEnergy] = useState<EnergyResults>({
    totalYieldKwh: 0,
    selfConsumptionKwh: 0,
    gridSupplyKwh: 0,
    gridExportKwh: 0,
    autarkyRate: 0,
    selfConsumptionRate: 0,
    totalConsumptionKwh: 0,
    pvDirectConsumptionKwh: 0,
    batteryDischargeKwh: 0,
  });

  const [ecoResults, setEcoResults] = useState<EconomicResults>({
    lcoe: 0,
    amortizationYears: null,
    roi: 0,
    cashflowPlan: [],
  });

  // Effect: Recalculate everything when inputs change
  useEffect(() => {
    const runSimulation = async () => {
      setIsLoading(true);
      const pvYield = await fetchPvgisYield(system);
      const newEnergy = calculateEnergyYield(pvYield, system, consumption);
      setEnergy(newEnergy);
      const newEco = calculateEconomics(newEnergy, economics, financing, consumption);
      setEcoResults(newEco);
      setIsLoading(false);
    };

    const timeout = setTimeout(() => {
      runSimulation();
    }, 500);

    return () => clearTimeout(timeout);
  }, [system, consumption, economics, financing]);

  // Kreditbetrag aus Prozentsatz und CAPEX ableiten
  useEffect(() => {
    setFinancing((prev) => ({
      ...prev,
      loanAmount: Math.round((economics.capex * loanPercentage) / 100),
    }));
  }, [economics.capex, loanPercentage]);

  // Beim Wechsel zu Tab 3 aktuelle Kundeneingaben als ±50%-Referenz einfrieren
  useEffect(() => {
    if (activeTab === 3) {
      setOptimizationBase({
        tenantElectricityRate: economics.tenantElectricityRate,
        batteryCapacityKwh: system.batteryCapacityKwh,
        hasBattery: system.hasBattery,
        participationRate: consumption.participationRate,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const inputClass =
    'w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-colors outline-none focus:border-blue-500';
  const inputClassEco =
    'w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500';

  return (
    <div className="w-full">
      {/* Header / KPIs */}
      <KPIDisplay energy={energy} economics={ecoResults} />

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="md:w-64 bg-slate-50 border-r border-slate-200 flex flex-row md:flex-col">
          <button
            onClick={() => setActiveTab(1)}
            className={`flex-1 md:flex-none flex items-center gap-3 p-4 md:px-6 md:py-5 text-left transition-colors font-medium text-sm ${activeTab === 1 ? 'bg-blue-50 text-blue-700 border-b-2 md:border-b-0 md:border-r-2 border-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Zap size={20} className={activeTab === 1 ? 'text-blue-600' : 'text-slate-400'} />
            <span className="hidden md:block">{t.tab1}</span>
          </button>

          <button
            onClick={() => setActiveTab(2)}
            className={`flex-1 md:flex-none flex items-center gap-3 p-4 md:px-6 md:py-5 text-left transition-colors font-medium text-sm ${activeTab === 2 ? 'bg-blue-50 text-blue-700 border-b-2 md:border-b-0 md:border-r-2 border-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Euro size={20} className={activeTab === 2 ? 'text-blue-600' : 'text-slate-400'} />
            <span className="hidden md:block">{t.tab2}</span>
          </button>

          <button
            onClick={() => setActiveTab(3)}
            className={`flex-1 md:flex-none flex items-center gap-3 p-4 md:px-6 md:py-5 text-left transition-colors font-medium text-sm ${activeTab === 3 ? 'bg-blue-50 text-blue-700 border-b-2 md:border-b-0 md:border-r-2 border-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <LineChart size={20} className={activeTab === 3 ? 'text-blue-600' : 'text-slate-400'} />
            <span className="hidden md:block">{t.tab3}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 md:p-8 relative">
          {isLoading && (
            <div className="absolute top-4 right-6 items-center gap-2 text-blue-500 font-medium text-sm hidden md:flex">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              {t.loading}
            </div>
          )}

          {/* TAB 1: Technical */}
          {activeTab === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calculator className="text-blue-500" />
                {t.tab1Title}
              </h2>

              <div className="flex items-start gap-2 p-3 mb-6 rounded-lg bg-blue-50 border border-blue-100 text-sm text-slate-600">
                <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <span>
                  {t.infoExpertHint}{' '}
                  <a
                    href="https://www.bundesnetzagentur.de/899948"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t.infoExpertLinkLabel}
                  </a>
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* PV System */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    {t.sectionPV}
                  </h3>

                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      {t.labelAddress}
                      <Tooltip text={t.tooltipAddress} />
                    </label>
                    <AddressAutocomplete
                      defaultValue={system.address}
                      placeholder={t.placeholderAddress}
                      onSelect={(address: string, lat: number, lon: number) =>
                        setSystem((s) => ({ ...s, address, locationLat: lat, locationLon: lon }))
                      }
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {t.addressCoords
                        .replace('{lat}', system.locationLat.toFixed(4))
                        .replace('{lon}', system.locationLon.toFixed(4))}
                    </p>
                  </div>

                  <div>
                    <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                      <span className="flex items-center">
                        {t.labelPvCapacity}
                        <Tooltip text={t.tooltipPvCapacity} />
                      </span>
                      <span className="text-blue-600 font-semibold">
                        {system.pvCapacityKwp} kWp
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="5"
                      value={system.pvCapacityKwp}
                      onChange={(e) =>
                        setSystem({ ...system, pvCapacityKwp: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2 w-full">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={system.hasBattery}
                          onChange={(e) => setSystem({ ...system, hasBattery: e.target.checked })}
                        />
                        <div
                          className={`block w-10 h-6 rounded-full transition-colors ${system.hasBattery ? 'bg-blue-500' : 'bg-slate-300'}`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${system.hasBattery ? 'transform translate-x-4' : ''}`}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        <Battery size={16} /> {t.labelBattery}
                        <Tooltip text={t.tooltipBattery} />
                      </span>
                    </label>

                    {system.hasBattery && (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="number"
                          value={system.batteryCapacityKwh}
                          onChange={(e) =>
                            setSystem({ ...system, batteryCapacityKwh: Number(e.target.value) })
                          }
                          className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                        <span className="text-sm text-slate-600">{t.labelBatteryCapacity}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Consumption */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    {t.sectionConsumption}
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <Home size={14} className="mr-1" /> {t.labelApartments}
                        <Tooltip text={t.tooltipApartments} />
                      </label>
                      <input
                        type="number"
                        value={consumption.apartments}
                        onChange={(e) =>
                          setConsumption({ ...consumption, apartments: Number(e.target.value) })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                        <span className="flex items-center">
                          {t.labelParticipationRate}
                          <Tooltip text={t.tooltipParticipationRate} />
                        </span>
                        <span className="text-blue-600 font-semibold">
                          {Math.round(consumption.participationRate * 100)} %
                        </span>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={Math.round(consumption.participationRate * 100)}
                        onChange={(e) =>
                          setConsumption({
                            ...consumption,
                            participationRate: Number(e.target.value) / 100,
                          })
                        }
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>5 %</span>
                        <span>100 %</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        {t.labelConsumptionPerApartment}
                        <Tooltip text={t.tooltipConsumptionPerApartment} />
                      </label>
                      <input
                        type="number"
                        value={consumption.consumptionPerApartmentKwh}
                        onChange={(e) =>
                          setConsumption({
                            ...consumption,
                            consumptionPerApartmentKwh: Number(e.target.value),
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2 w-full">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={consumption.hasGeneralConsumption}
                          onChange={(e) =>
                            setConsumption({
                              ...consumption,
                              hasGeneralConsumption: e.target.checked,
                            })
                          }
                        />
                        <div
                          className={`block w-10 h-6 rounded-full transition-colors ${consumption.hasGeneralConsumption ? 'bg-blue-500' : 'bg-slate-300'}`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${consumption.hasGeneralConsumption ? 'transform translate-x-4' : ''}`}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        {t.labelGeneralConsumption}
                        <Tooltip text={t.tooltipGeneralConsumption} />
                      </span>
                    </label>

                    {consumption.hasGeneralConsumption && (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="number"
                          value={consumption.generalConsumptionKwh}
                          onChange={(e) =>
                            setConsumption({
                              ...consumption,
                              generalConsumptionKwh: Number(e.target.value),
                            })
                          }
                          className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                        <span className="text-sm text-slate-600">kWh</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pt-2 w-full">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={consumption.hasHeatPump}
                          onChange={(e) =>
                            setConsumption({ ...consumption, hasHeatPump: e.target.checked })
                          }
                        />
                        <div
                          className={`block w-10 h-6 rounded-full transition-colors ${consumption.hasHeatPump ? 'bg-blue-500' : 'bg-slate-300'}`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${consumption.hasHeatPump ? 'transform translate-x-4' : ''}`}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        {t.labelHeatPump}
                        <Tooltip text={t.tooltipHeatPump} />
                      </span>
                    </label>

                    {consumption.hasHeatPump && (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="number"
                          value={consumption.heatPumpConsumptionKwh}
                          onChange={(e) =>
                            setConsumption({
                              ...consumption,
                              heatPumpConsumptionKwh: Number(e.target.value),
                            })
                          }
                          className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                        <span className="text-sm text-slate-600">kWh</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-2 w-full">
                    <label className="flex items-center gap-2 cursor-pointer w-full">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={consumption.hasEvCharging}
                          onChange={(e) =>
                            setConsumption({ ...consumption, hasEvCharging: e.target.checked })
                          }
                        />
                        <div
                          className={`block w-10 h-6 rounded-full transition-colors ${consumption.hasEvCharging ? 'bg-blue-500' : 'bg-slate-300'}`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${consumption.hasEvCharging ? 'transform translate-x-4' : ''}`}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        {t.labelEV}
                        <Tooltip text={t.tooltipEV} />
                      </span>
                    </label>

                    {consumption.hasEvCharging && (
                      <div className="pl-12 grid grid-cols-2 gap-4 w-full">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            {t.labelEVCount}
                          </label>
                          <input
                            type="number"
                            value={consumption.evChargingPoints}
                            onChange={(e) =>
                              setConsumption({
                                ...consumption,
                                evChargingPoints: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            {t.labelEVConsumptionPerPointKwh}
                          </label>
                          <input
                            type="number"
                            value={consumption.evChargingConsumptionPerPointKwh}
                            onChange={(e) =>
                              setConsumption({
                                ...consumption,
                                evChargingConsumptionPerPointKwh: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setActiveTab(2)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t.btnNext}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Economics */}
          {activeTab === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Euro className="text-slate-500" />
                {t.tab2Title}
              </h2>

              <div className="flex items-start gap-2 p-3 mb-6 rounded-lg bg-blue-50 border border-blue-100 text-sm text-slate-600">
                <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <span>
                  {t.infoExpertHint}{' '}
                  <a
                    href="https://www.bundesnetzagentur.de/899948"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t.infoExpertLinkLabel}
                  </a>
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Model selection */}
                <div className="col-span-1 lg:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="flex items-center text-sm font-semibold text-slate-800 mb-3">
                    {t.sectionModel}
                  </label>
                  <div className="flex gap-4">
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${economics.model === 'Mieterstrom' ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                    >
                      <input
                        type="radio"
                        name="model"
                        className="sr-only"
                        checked={economics.model === 'Mieterstrom'}
                        onChange={() => setEconomics({ ...economics, model: 'Mieterstrom' })}
                      />
                      {t.modelMieterstrom}
                      <Tooltip text={t.tooltipModelMieterstrom} />
                    </label>
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${economics.model === 'GGV' ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                    >
                      <input
                        type="radio"
                        name="model"
                        className="sr-only"
                        checked={economics.model === 'GGV'}
                        onChange={() => setEconomics({ ...economics, model: 'GGV' })}
                      />
                      {t.modelGGV}
                      <Tooltip text={t.tooltipModelGGV} />
                    </label>
                  </div>
                </div>

                {/* Tariffs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    {t.sectionTariffs}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        {t.labelTenantRate}
                        <Tooltip text={t.tooltipTenantRate} />
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={economics.tenantElectricityRate}
                        onChange={(e) =>
                          setEconomics({
                            ...economics,
                            tenantElectricityRate: Number(e.target.value),
                          })
                        }
                        className={inputClassEco}
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        {t.labelFeedIn}
                        <Tooltip text={t.tooltipFeedIn} />
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={economics.feedInTariff}
                        onChange={(e) =>
                          setEconomics({ ...economics, feedInTariff: Number(e.target.value) })
                        }
                        className={inputClassEco}
                      />
                    </div>
                  </div>

                  {economics.model === 'Mieterstrom' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          {t.labelBaseFee}
                          <Tooltip text={t.tooltipBaseFee} />
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={economics.baseFeePerMonth}
                          onChange={(e) =>
                            setEconomics({ ...economics, baseFeePerMonth: Number(e.target.value) })
                          }
                          className={inputClassEco}
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          {t.labelSubsidy}
                          <Tooltip text={t.tooltipSubsidy} />
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={economics.tenantElectricitySubsidy}
                          onChange={(e) =>
                            setEconomics({
                              ...economics,
                              tenantElectricitySubsidy: Number(e.target.value),
                            })
                          }
                          className={inputClassEco}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          {t.labelGridRate}
                          <Tooltip text={t.tooltipGridRate} />
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={economics.gridElectricityRate}
                          onChange={(e) =>
                            setEconomics({
                              ...economics,
                              gridElectricityRate: Number(e.target.value),
                            })
                          }
                          className={inputClassEco}
                        />
                      </div>
                      <div></div>
                    </div>
                  </div>
                </div>

                {/* Financing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">
                    {t.sectionFinancing}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        {t.labelCapex}
                        <Tooltip text={t.tooltipCapex} />
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={economics.capex}
                        onChange={(e) =>
                          setEconomics({ ...economics, capex: Number(e.target.value) })
                        }
                        className={inputClassEco}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCapexModal(true)}
                        className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <List size={12} />
                        {t.breakdownOpen}
                      </button>
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        {t.labelOpex}
                        <Tooltip text={t.tooltipOpex} />
                      </label>
                      <input
                        type="number"
                        step="50"
                        value={economics.opexPerYear}
                        onChange={(e) =>
                          setEconomics({ ...economics, opexPerYear: Number(e.target.value) })
                        }
                        className={inputClassEco}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpexModal(true)}
                        className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <List size={12} />
                        {t.breakdownOpen}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                      {t.labelLoanAmount}
                      <Tooltip text={t.tooltipLoanAmount} />
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={loanPercentage}
                        onChange={(e) => setLoanPercentage(Number(e.target.value))}
                        className="flex-1 h-2 accent-blue-600 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                        {loanPercentage}% → {financing.loanAmount.toLocaleString('de-DE')} €
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1 px-0.5">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        {t.labelInterestRate}
                        <Tooltip text={t.tooltipInterestRate} />
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={financing.interestRate}
                        onChange={(e) =>
                          setFinancing({ ...financing, interestRate: Number(e.target.value) })
                        }
                        className={inputClassEco}
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        {t.labelLoanTerm}
                        <Tooltip text={t.tooltipLoanTerm} />
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={financing.loanTermYears}
                        onChange={(e) =>
                          setFinancing({ ...financing, loanTermYears: Number(e.target.value) })
                        }
                        className={inputClassEco}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setActiveTab(3)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t.btnNext}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Results */}
          {activeTab === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <LineChart className="text-blue-500" />
                {t.tab3Title}
              </h2>

              {/* Optimization Panel */}
              <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                <h3 className="text-base font-semibold text-green-800 mb-1 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-green-600" />
                  {t.sectionOptimize}
                </h3>
                <p className="text-sm text-green-700 mb-4">{t.optimizeDescription}</p>
                {(() => {
                  // ±50% um die Kundeneingabe aus Tab 1/2, auf sinnvolle Schritte gerundet
                  const rateBase = optimizationBase.tenantElectricityRate;
                  const rateMin = Math.max(1, Math.round(rateBase * 0.5 * 2) / 2);
                  const rateMax = Math.round(rateBase * 1.5 * 2) / 2;

                  // Batterie: min immer 0 (= kein Speicher), max +50% des konfigurierten Wertes
                  const battBase = optimizationBase.hasBattery
                    ? optimizationBase.batteryCapacityKwh
                    : 20;
                  const battMax = Math.max(30, Math.round((battBase * 1.5) / 5) * 5);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Slider: Verkaufspreis */}
                      <div>
                        <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                          <span className="flex items-center">
                            {t.labelOptTenantRate}
                            <Tooltip text={t.tooltipOptTenantRate} />
                          </span>
                          <span className="text-green-700 font-semibold">
                            {economics.tenantElectricityRate.toFixed(1)} ct/kWh
                          </span>
                        </label>
                        <input
                          type="range"
                          min={rateMin}
                          max={rateMax}
                          step="0.5"
                          value={economics.tenantElectricityRate}
                          onChange={(e) =>
                            setEconomics({
                              ...economics,
                              tenantElectricityRate: Number(e.target.value),
                            })
                          }
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-600"
                          style={{ background: '#bbf7d0' }}
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>{rateMin.toFixed(1)} ct (−50 %)</span>
                          <span>+50 % {rateMax.toFixed(1)} ct</span>
                        </div>
                      </div>

                      {/* Slider: Batteriespeicher */}
                      <div>
                        <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                          <span className="flex items-center gap-1">
                            <Battery size={14} />
                            {t.labelOptBattery}
                            <Tooltip text={t.tooltipOptBattery} />
                          </span>
                          <span className="text-green-700 font-semibold">
                            {system.hasBattery && system.batteryCapacityKwh > 0
                              ? `${system.batteryCapacityKwh} kWh`
                              : t.noBattery}
                          </span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={battMax}
                          step="5"
                          value={system.hasBattery ? system.batteryCapacityKwh : 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSystem({ ...system, hasBattery: val > 0, batteryCapacityKwh: val });
                          }}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-600"
                          style={{ background: '#bbf7d0' }}
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>{t.noBattery}</span>
                          <span>+50 % {battMax} kWh</span>
                        </div>
                      </div>

                      {/* Slider: Teilnehmerquote */}
                      <div>
                        <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                          <span className="flex items-center">
                            {t.labelOptParticipation}
                            <Tooltip text={t.tooltipOptParticipation} />
                          </span>
                          <span className="text-green-700 font-semibold">
                            {Math.round(consumption.participationRate * 100)} %
                          </span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={Math.round(consumption.participationRate * 100)}
                          onChange={(e) =>
                            setConsumption({
                              ...consumption,
                              participationRate: Number(e.target.value) / 100,
                            })
                          }
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-600"
                          style={{ background: '#bbf7d0' }}
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>0 %</span>
                          <span>100 %</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {ecoResults.cashflowPlan.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                    <h3 className="font-semibold text-slate-700 mb-4 text-center">
                      {t.chartEnergyTitle}
                    </h3>
                    <EnergyMixChart energy={energy} />
                    <div className="mt-4 text-sm text-slate-600 space-y-2 w-full px-4">
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span>{t.labelPvYield}</span>{' '}
                        <span className="font-medium">{energy.totalYieldKwh.toFixed(0)} kWh</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span>{t.labelTotalConsumption}</span>{' '}
                        <span className="font-medium">
                          {energy.totalConsumptionKwh.toFixed(0)} kWh
                        </span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span>{t.labelGridExport}</span>{' '}
                        <span className="font-medium text-slate-500">
                          {energy.gridExportKwh.toFixed(0)} kWh
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 w-full border-t border-slate-200 pt-4">
                      <h3 className="font-semibold text-slate-700 mb-1 text-center text-sm">
                        {t.chartTenantSavingsTitle}
                      </h3>
                      <p className="text-xs text-slate-400 mb-2 text-center">
                        {t.chartTenantSavingsSubtitle}
                      </p>
                      <TenantSavingsChart
                        consumptionPerApartmentKwh={consumption.consumptionPerApartmentKwh}
                        gridElectricityRate={economics.gridElectricityRate}
                        tenantElectricityRate={economics.tenantElectricityRate}
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <h3 className="font-semibold text-slate-700 mb-4">
                      {t.chartCashflowTitle.replace(
                        '{years}',
                        String(economics.calculationPeriodYears)
                      )}
                    </h3>
                    <CashflowChart
                      data={ecoResults.cashflowPlan}
                      selectedIndex={selectedYearIndex}
                      onBarClick={(idx: number) => setSelectedYearIndex(idx)}
                    />

                    {ecoResults.cashflowPlan.length > 0 && (
                      <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                          <h4 className="font-semibold text-slate-700">
                            {t.tableTitle.replace(
                              '{year}',
                              String(
                                ecoResults.cashflowPlan[selectedYearIndex]?.year ??
                                  selectedYearIndex + 1
                              )
                            )}
                          </h4>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedYearIndex((i) => i - 1)}
                              disabled={selectedYearIndex === 0}
                              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              onClick={() => setSelectedYearIndex((i) => i + 1)}
                              disabled={selectedYearIndex === ecoResults.cashflowPlan.length - 1}
                              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-2 font-medium">{t.tablePosition}</th>
                                <th className="px-4 py-2 font-medium text-right">
                                  {t.tableAmount}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-100">
                                <td className="px-4 py-2 font-medium text-slate-700">
                                  {t.tableRevenue}
                                </td>
                                <td className="px-4 py-2 text-right text-blue-600 font-medium">
                                  {ecoResults.cashflowPlan[selectedYearIndex]?.totalRevenue.toFixed(
                                    2
                                  )}
                                </td>
                              </tr>
                              {economics.model === 'Mieterstrom' && (
                                <>
                                  <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <td className="px-4 py-1.5 pl-8 text-slate-500 text-xs">
                                      {t.tableMieterstrom}
                                    </td>
                                    <td className="px-4 py-1.5 text-right text-slate-500 text-xs">
                                      {ecoResults.cashflowPlan[
                                        selectedYearIndex
                                      ]?.revenueTenantElectricity.toFixed(2)}
                                    </td>
                                  </tr>
                                  <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <td className="px-4 py-1.5 pl-8 text-slate-500 text-xs">
                                      {t.tableBaseFee}
                                    </td>
                                    <td className="px-4 py-1.5 text-right text-slate-500 text-xs">
                                      {ecoResults.cashflowPlan[
                                        selectedYearIndex
                                      ]?.revenueBaseFee.toFixed(2)}
                                    </td>
                                  </tr>
                                  <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <td className="px-4 py-1.5 pl-8 text-slate-500 text-xs">
                                      {t.tableSubsidy}
                                    </td>
                                    <td className="px-4 py-1.5 text-right text-slate-500 text-xs">
                                      {ecoResults.cashflowPlan[
                                        selectedYearIndex
                                      ]?.revenueSubsidy.toFixed(2)}
                                    </td>
                                  </tr>
                                </>
                              )}
                              <tr className="border-b border-slate-100 bg-slate-50/50">
                                <td className="px-4 py-1.5 pl-8 text-slate-500 text-xs">
                                  {t.tableFeedIn}
                                </td>
                                <td className="px-4 py-1.5 text-right text-slate-500 text-xs">
                                  {ecoResults.cashflowPlan[
                                    selectedYearIndex
                                  ]?.revenueFeedIn.toFixed(2)}
                                </td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="px-4 py-2 font-medium text-slate-700">
                                  {t.tableOpex}
                                </td>
                                <td className="px-4 py-2 text-right text-slate-600">
                                  -{ecoResults.cashflowPlan[selectedYearIndex]?.opex.toFixed(2)}
                                </td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="px-4 py-2 font-medium text-slate-700">
                                  {t.tableAnnuity}
                                </td>
                                <td className="px-4 py-2 text-right text-slate-600">
                                  -
                                  {ecoResults.cashflowPlan[
                                    selectedYearIndex
                                  ]?.loanInstallment.toFixed(2)}
                                </td>
                              </tr>
                              {(ecoResults.cashflowPlan[selectedYearIndex]?.loanInstallment ?? 0) >
                                0 && (
                                <>
                                  <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <td className="px-4 py-1.5 pl-8 text-slate-500 text-xs">
                                      {t.tableInterest}
                                    </td>
                                    <td className="px-4 py-1.5 text-right text-slate-500 text-xs">
                                      -
                                      {ecoResults.cashflowPlan[
                                        selectedYearIndex
                                      ]?.interestPaid.toFixed(2)}
                                    </td>
                                  </tr>
                                  <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <td className="px-4 py-1.5 pl-8 text-slate-500 text-xs">
                                      {t.tablePrincipal}
                                    </td>
                                    <td className="px-4 py-1.5 text-right text-slate-500 text-xs">
                                      -
                                      {ecoResults.cashflowPlan[
                                        selectedYearIndex
                                      ]?.principalPaid.toFixed(2)}
                                    </td>
                                  </tr>
                                </>
                              )}
                              <tr className="bg-blue-50">
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                  {t.tableCashflow}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-800">
                                  {ecoResults.cashflowPlan[selectedYearIndex]?.cashflow.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  {t.noData}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BreakdownModal
        isOpen={showCapexModal}
        title={t.breakdownCapexTitle}
        hint={t.breakdownHint}
        unit="€"
        step={500}
        items={[
          {
            key: 'pvSystem',
            label: t.breakdownCapexPvSystem,
            tooltip: t.tooltipBreakdownCapexPvSystem,
          },
          {
            key: 'battery',
            label: t.breakdownCapexBattery,
            tooltip: t.tooltipBreakdownCapexBattery,
          },
          {
            key: 'installation',
            label: t.breakdownCapexInstallation,
            tooltip: t.tooltipBreakdownCapexInstallation,
          },
          {
            key: 'consulting',
            label: t.breakdownCapexConsulting,
            tooltip: t.tooltipBreakdownCapexConsulting,
          },
          { key: 'other', label: t.breakdownCapexOther, tooltip: t.tooltipBreakdownCapexOther },
        ]}
        values={capexBreakdown}
        totalLabel={t.breakdownTotal}
        applyLabel={t.breakdownApply}
        cancelLabel={t.breakdownCancel}
        onChangeValue={(key, value) => setCapexBreakdown({ ...capexBreakdown, [key]: value })}
        onApply={(total) => {
          setEconomics({ ...economics, capex: total });
          setShowCapexModal(false);
        }}
        onClose={() => setShowCapexModal(false)}
      />

      <BreakdownModal
        isOpen={showOpexModal}
        title={t.breakdownOpexTitle}
        hint={t.breakdownHint}
        unit="€"
        step={50}
        items={[
          {
            key: 'techManagement',
            label: t.breakdownOpexTechManagement,
            tooltip: t.tooltipBreakdownOpexTechManagement,
          },
          { key: 'billing', label: t.breakdownOpexBilling, tooltip: t.tooltipBreakdownOpexBilling },
          {
            key: 'adminManagement',
            label: t.breakdownOpexAdminManagement,
            tooltip: t.tooltipBreakdownOpexAdminManagement,
          },
        ]}
        values={opexBreakdown}
        totalLabel={t.breakdownTotal}
        applyLabel={t.breakdownApply}
        cancelLabel={t.breakdownCancel}
        onChangeValue={(key, value) => setOpexBreakdown({ ...opexBreakdown, [key]: value })}
        onApply={(total) => {
          setEconomics({ ...economics, opexPerYear: total });
          setShowOpexModal(false);
        }}
        onClose={() => setShowOpexModal(false)}
      />
    </div>
  );
};

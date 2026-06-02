import { useState, useEffect, useRef } from 'react';
import {
  SystemParams,
  ConsumptionParams,
  EconomicParams,
  FinancingParams,
  EnergyResults,
  EconomicResults,
  MonthlyEnergyFlow,
} from '../types';
import { fetchPvgisYield, calculateEnergyYield, calculateEconomics } from '../lib/calculations';
import { fetchPvgisMonthlyYield, calculateMonthlyEnergyFlows } from '../lib/energyFlowCalculation';
import { KPIDisplay } from './KPIDisplay';
import { EnergyMixChart } from './charts/EnergyMixChart';
import { CashflowChart } from './charts/CashflowChart';
import { TenantSavingsChart } from './charts/TenantSavingsChart';
import { MonthlyEnergyFlowChart } from './charts/MonthlyEnergyFlowChart';
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
  ChevronDown,
  Info,
  List,
  FileDown,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { exportToJson, importFromJson } from '../lib/jsonExport';
import type { GgvPlannerExportUi } from '../lib/jsonExport';
import { WelcomeModal } from './WelcomeModal';
import { TutorialWalkthrough, EVENTS, STATUS, ACTIONS } from './TutorialWalkthrough';
import type { EventData, Controls } from './TutorialWalkthrough';

export const Configurator: React.FC = () => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);

  // State: Inputs
  const [system, setSystem] = useState<SystemParams>({
    address: 'Berlin, Germany',
    locationLat: 52.52,
    locationLon: 13.405,
    inclination: 35,
    azimuth: 0,
    systemLoss: 14,
    pvCapacityKwp: 50,
    hasBattery: true,
    batteryCapacityKwh: 25,
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
    tenantElectricityRate: 20,
    gridElectricityRate: 35,
    feedInTariff: 5,
    tenantElectricitySubsidy: 2.1,
    baseFeePerMonth: 10,
    roofRentPerMonth: 50,
    capex: 75000,
    opexPerYear: 1500,
    calculationPeriodYears: 20,
  });

  const [financing, setFinancing] = useState<FinancingParams>({
    loanAmount: 50000,
    loanTermYears: 10,
    interestRate: 4.5,
  });

  const [expertMode, setExpertMode] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  // Tutorial state
  const [showWelcomeModal, setShowWelcomeModal] = useState(
    () => localStorage.getItem('ggv-tutorial-dismissed') !== 'true'
  );
  const [tutorialRunning, setTutorialRunning] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const pendingStepRef = useRef<number | null>(null);

  type JsonNotification = {
    type: 'success' | 'error';
    messageKey: 'jsonImportErrorInvalidJson' | 'jsonImportErrorWrongAppId' | 'jsonImportSuccess';
  } | null;
  const [jsonNotification, setJsonNotification] = useState<JsonNotification>(null);

  const showJsonNotification = (
    type: 'success' | 'error',
    messageKey: 'jsonImportErrorInvalidJson' | 'jsonImportErrorWrongAppId' | 'jsonImportSuccess'
  ) => {
    setJsonNotification({ type, messageKey });
    setTimeout(() => setJsonNotification(null), 4000);
  };

  const handleExportJson = () => {
    const ui: GgvPlannerExportUi = { expertMode, pvInputMode, roofAreaM2 };
    exportToJson(system, consumption, economics, financing, ui);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const defaults: GgvPlannerExportUi = { expertMode, pvInputMode, roofAreaM2 };
    const result = await importFromJson(file, {
      system,
      consumption,
      economics,
      financing,
      ui: defaults,
    });

    if (!result.ok) {
      showJsonNotification(
        'error',
        result.errorKey === 'wrongAppId'
          ? 'jsonImportErrorWrongAppId'
          : 'jsonImportErrorInvalidJson'
      );
      return;
    }

    setSystem(result.system);
    setConsumption(result.consumption);
    setEconomics(result.economics);
    setFinancing(result.financing);
    setExpertMode(result.ui.expertMode);
    setPvInputMode(result.ui.pvInputMode);
    setRoofAreaM2(result.ui.roofAreaM2);
    const newLoanPct =
      result.economics.capex > 0
        ? Math.round((result.financing.loanAmount / result.economics.capex) * 100)
        : 0;
    setLoanPercentage(Math.min(100, Math.max(0, newLoanPct)));
    showJsonNotification('success', 'jsonImportSuccess');
  };

  const handleExpertModeToggle = (enabled: boolean) => {
    setExpertMode(enabled);
    if (!enabled) {
      setSystem((s) => ({ ...s, inclination: 35, azimuth: 0 }));
    }
  };

  const handleExportPdf = async () => {
    setIsPdfExporting(true);
    try {
      const { exportToPdf } = await import('../lib/pdfExport');
      await exportToPdf(system, consumption, economics, financing, energy, ecoResults, lang);
    } finally {
      setIsPdfExporting(false);
    }
  };

  const [pvInputMode, setPvInputMode] = useState<'kwp' | 'sqm'>('kwp');
  // kWp = (m² / 5) * 0.8  →  m² = kWp / 0.8 * 5 = kWp * 6.25
  const [roofAreaM2, setRoofAreaM2] = useState(Math.round(50 * 6.25));

  const leanKwpFromArea = (m2: number) => Math.round((m2 / 5) * 0.8 * 10) / 10;

  const handleRoofAreaChange = (m2: number) => {
    setRoofAreaM2(m2);
    setSystem((s) => ({ ...s, pvCapacityKwp: leanKwpFromArea(m2) }));
  };

  const handlePvModeSwitch = (mode: 'kwp' | 'sqm') => {
    if (mode === 'sqm') {
      setRoofAreaM2(Math.round(system.pvCapacityKwp * 6.25));
    }
    setPvInputMode(mode);
  };

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
    accumulatedCashflow: 0,
    cashflowPlan: [],
  });

  const [monthlyFlows, setMonthlyFlows] = useState<MonthlyEnergyFlow[]>([]);
  const [isMonthlyTableExpanded, setIsMonthlyTableExpanded] = useState(true);

  // Effect: Recalculate everything when inputs change
  useEffect(() => {
    const runSimulation = async () => {
      setIsLoading(true);

      // Jährliche und monatliche PV-Daten parallel aus PVGIS abrufen
      const [pvYield, monthlyPvKwh] = await Promise.all([
        fetchPvgisYield(system),
        fetchPvgisMonthlyYield(system),
      ]);

      const newEnergy = calculateEnergyYield(pvYield, system, consumption);
      setEnergy(newEnergy);

      const newEco = calculateEconomics(newEnergy, economics, financing, consumption);
      setEcoResults(newEco);

      // Monatliche Energieflüsse auf Basis der PVGIS-Monatsdaten berechnen
      const newMonthlyFlows = calculateMonthlyEnergyFlows(monthlyPvKwh, system, consumption);
      setMonthlyFlows(newMonthlyFlows);

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

  // Resume tutorial after tab change (needed when navigating to Tab 3 for the results step)
  useEffect(() => {
    if (pendingStepRef.current !== null) {
      const nextStep = pendingStepRef.current;
      pendingStepRef.current = null;
      const timer = setTimeout(() => {
        setTutorialStepIndex(nextStep);
        setTutorialRunning(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const startTutorial = () => {
    setActiveTab(1);
    setTutorialStepIndex(0);
    setTutorialRunning(true);
    setShowWelcomeModal(false);
    localStorage.setItem('ggv-tutorial-dismissed', 'true');
  };

  const dismissTutorial = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('ggv-tutorial-dismissed', 'true');
  };

  const handleTutorialCallback = (data: EventData, controls: Controls) => {
    const { action, index, status, type } = data;

    if (type === EVENTS.STEP_AFTER) {
      const isForward = action === ACTIONS.NEXT || action === ACTIONS.START;
      if (isForward && index === 4) {
        // After Tab2-sidebar step: navigate to Tab 3, pause, then resume at results step
        setTutorialRunning(false);
        pendingStepRef.current = 5;
        setActiveTab(3);
      } else if (!isForward && index === 5) {
        // Going back from results step to Tab2-sidebar step
        setTutorialRunning(false);
        pendingStepRef.current = 4;
        setActiveTab(1);
      } else {
        setTutorialStepIndex(index + (isForward ? 1 : -1));
      }
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setTutorialRunning(false);
      setTutorialStepIndex(0);
      // Suppress unused-variable warning for controls in terminal states
      void controls;
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-colors outline-none focus:border-blue-500';
  const inputClassEco =
    'w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500';

  return (
    <div className="w-full">
      {showWelcomeModal && <WelcomeModal onStart={startTutorial} onSkip={dismissTutorial} />}
      <TutorialWalkthrough
        run={tutorialRunning}
        stepIndex={tutorialStepIndex}
        onCallback={handleTutorialCallback}
      />

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
            data-tutorial="tab2-sidebar-button"
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

          {/* Restart tutorial button */}
          <button
            onClick={startTutorial}
            title={t.tutorialBtnRestart}
            className="hidden md:flex items-center gap-2 mt-auto px-6 py-4 text-slate-400 hover:text-blue-500 transition-colors text-xs font-medium border-t border-slate-200"
          >
            <HelpCircle size={16} />
            <span>{t.tutorialBtnRestart}</span>
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

                  <div data-tutorial="address-input">
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
                    {/* Mode toggle */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center text-sm font-medium text-slate-700">
                        {pvInputMode === 'kwp' ? t.labelPvCapacity : t.labelRoofArea}
                        <Tooltip
                          text={pvInputMode === 'kwp' ? t.tooltipPvCapacity : t.tooltipRoofArea}
                        />
                      </span>
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => handlePvModeSwitch('kwp')}
                          className={`px-2.5 py-1 transition-colors ${pvInputMode === 'kwp' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                          {t.pvInputToggleKwp}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePvModeSwitch('sqm')}
                          className={`px-2.5 py-1 transition-colors ${pvInputMode === 'sqm' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                          {t.pvInputToggleSqm}
                        </button>
                      </div>
                    </div>

                    {pvInputMode === 'kwp' ? (
                      <>
                        <div className="flex justify-end mb-1">
                          <span className="text-blue-600 font-semibold text-sm">
                            {system.pvCapacityKwp} kWp
                          </span>
                        </div>
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
                      </>
                    ) : (
                      <>
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={roofAreaM2}
                          onChange={(e) => handleRoofAreaChange(Number(e.target.value))}
                          className={inputClass}
                        />
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          {t.pvCapacityFromArea.replace('{kwp}', String(system.pvCapacityKwp))}
                        </p>
                        <a
                          href={`https://www.google.com/maps/@${system.locationLat},${system.locationLon},19z/data=!3m1!1e3`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mt-1.5 hover:underline"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M15 3h6v6" />
                            <path d="M10 14 21 3" />
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          </svg>
                          {t.roofAreaMapsLink}
                        </a>
                      </>
                    )}
                  </div>

                  <div
                    data-tutorial="battery-section"
                    className="flex items-center gap-3 pt-2 w-full"
                  >
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
                      <span
                        data-tutorial="battery-tooltip"
                        className="text-sm font-medium text-slate-700 flex items-center gap-1"
                      >
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

                  {/* Expert mode toggle */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={expertMode}
                          onChange={(e) => handleExpertModeToggle(e.target.checked)}
                        />
                        <div
                          className={`block w-10 h-6 rounded-full transition-colors ${expertMode ? 'bg-blue-500' : 'bg-slate-300'}`}
                        />
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${expertMode ? 'transform translate-x-4' : ''}`}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        {t.expertModeLabel}
                        <Tooltip text={t.tooltipExpertMode} />
                      </span>
                    </label>

                    {!expertMode && (
                      <p className="text-xs text-slate-400 mt-1 ml-12">{t.expertModeDefault}</p>
                    )}

                    {expertMode && (
                      <div className="mt-3 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                          <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                            <span className="flex items-center">
                              {t.labelInclination}
                              <Tooltip text={t.tooltipInclination} />
                            </span>
                            <span className="text-blue-600 font-semibold">
                              {system.inclination}°
                            </span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="90"
                            step="5"
                            value={system.inclination}
                            onChange={(e) =>
                              setSystem({ ...system, inclination: Number(e.target.value) })
                            }
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>0°</span>
                            <span>45°</span>
                            <span>90°</span>
                          </div>
                        </div>

                        <div>
                          <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                            <span className="flex items-center">
                              {t.labelAzimuth}
                              <Tooltip text={t.tooltipAzimuth} />
                            </span>
                            <span className="text-blue-600 font-semibold">{system.azimuth}°</span>
                          </label>
                          <input
                            type="range"
                            min="-90"
                            max="90"
                            step="5"
                            value={system.azimuth}
                            onChange={(e) =>
                              setSystem({ ...system, azimuth: Number(e.target.value) })
                            }
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>{t.azimuthEast}</span>
                            <span>{t.azimuthSouth}</span>
                            <span>{t.azimuthWest}</span>
                          </div>
                        </div>
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

              <div className="mt-8 space-y-3">
                {jsonNotification && (
                  <div
                    className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border ${
                      jsonNotification.type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {jsonNotification.type === 'success' ? (
                      <CheckCircle size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    {t[jsonNotification.messageKey]}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-sm">
                      <Upload size={16} />
                      {t.btnImportJson}
                      <input
                        type="file"
                        accept=".json"
                        className="sr-only"
                        onChange={handleImportJson}
                      />
                    </label>
                    <button
                      onClick={handleExportJson}
                      className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm"
                    >
                      <Download size={16} />
                      {t.btnExportJson}
                    </button>
                  </div>
                  <button
                    data-tutorial="next-button-tab1"
                    onClick={() => setActiveTab(2)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t.btnNext}
                    <ChevronRight size={18} />
                  </button>
                </div>
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
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          {t.labelRoofRent}
                          <Tooltip text={t.tooltipRoofRent} />
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={economics.roofRentPerMonth}
                          onChange={(e) =>
                            setEconomics({
                              ...economics,
                              roofRentPerMonth: Number(e.target.value),
                            })
                          }
                          className={inputClassEco}
                        />
                      </div>
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

              <div className="mt-8 space-y-3">
                {jsonNotification && (
                  <div
                    className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border ${
                      jsonNotification.type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {jsonNotification.type === 'success' ? (
                      <CheckCircle size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    {t[jsonNotification.messageKey]}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-sm">
                      <Upload size={16} />
                      {t.btnImportJson}
                      <input
                        type="file"
                        accept=".json"
                        className="sr-only"
                        onChange={handleImportJson}
                      />
                    </label>
                    <button
                      onClick={handleExportJson}
                      className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm"
                    >
                      <Download size={16} />
                      {t.btnExportJson}
                    </button>
                  </div>
                  <button
                    onClick={() => setActiveTab(3)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t.btnNext}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Results */}
          {activeTab === 3 && (
            <div
              data-tutorial="results-section"
              className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <LineChart className="text-blue-500" />
                  {t.tab3Title}
                </h2>
                <button
                  onClick={handleExportPdf}
                  disabled={isPdfExporting || ecoResults.cashflowPlan.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPdfExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <FileDown size={16} />
                  )}
                  {isPdfExporting ? t.pdfExporting : t.btnExportPdf}
                </button>
              </div>

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

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div
                    id="pdf-chart-energy-col"
                    className="lg:col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center"
                  >
                    <div id="pdf-chart-pie" className="w-full flex flex-col items-center">
                      <h3 className="font-semibold text-slate-700 mb-4 text-center">
                        {t.chartEnergyTitle}
                      </h3>
                      <EnergyMixChart energy={energy} />
                    </div>
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

                    {monthlyFlows.length > 0 && (
                      <button
                        onClick={() =>
                          document
                            .getElementById('monthly-energy-flows')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                      >
                        <ChevronDown size={13} />
                        {t.btnMonthlyDetail}
                      </button>
                    )}
                    <div
                      id="pdf-chart-savings"
                      className="mt-6 w-full border-t border-slate-200 pt-4"
                    >
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
                    <div id="pdf-chart-cashflow">
                      <CashflowChart
                        data={ecoResults.cashflowPlan}
                        selectedIndex={selectedYearIndex}
                        onBarClick={(idx: number) => setSelectedYearIndex(idx)}
                      />
                    </div>

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

              {/* Monatliche Energieflüsse – volle Breite, ganz unten in Tab 3 */}
              <div
                id="monthly-energy-flows"
                className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-700 text-base">{t.monthlyFlowTitle}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t.monthlyFlowSubtitle}</p>
                </div>

                {monthlyFlows.length > 0 ? (
                  <>
                    <div id="pdf-chart-monthly" className="p-4">
                      <MonthlyEnergyFlowChart data={monthlyFlows} />
                    </div>

                    {/* Ausklappbare Detailtabelle */}
                    <div className="border-t border-slate-200">
                      <button
                        onClick={() => setIsMonthlyTableExpanded((v) => !v)}
                        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <span>
                          {t.monthlyFlowTableMonth} – {t.monthlyFlowTitle}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform duration-200 ${isMonthlyTableExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isMonthlyTableExpanded && (
                        <div className="overflow-x-auto border-t border-slate-100">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500">
                              <tr>
                                <th className="px-3 py-2 font-medium">{t.monthlyFlowTableMonth}</th>
                                <th className="px-3 py-2 font-medium text-right text-green-700">
                                  {t.monthlyFlowTablePvYield}
                                </th>
                                <th className="px-3 py-2 font-medium text-right text-slate-500">
                                  {t.monthlyFlowTableDailyPv}
                                </th>
                                <th className="px-3 py-2 font-medium text-right text-slate-500">
                                  {t.monthlyFlowTableDailyNeed}
                                </th>
                                <th className="px-3 py-2 font-medium text-right text-green-600">
                                  {t.monthlyFlowTableSelfConsumption}
                                </th>
                                <th className="px-3 py-2 font-medium text-right text-blue-600">
                                  {t.monthlyFlowTableBattery}
                                </th>
                                <th className="px-3 py-2 font-medium text-right text-slate-500">
                                  {t.monthlyFlowTableGridExport}
                                </th>
                                <th className="px-3 py-2 font-medium text-right text-red-500">
                                  {t.monthlyFlowTableGridSupply}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthlyFlows.map((m) => (
                                <tr
                                  key={m.month}
                                  className="border-t border-slate-100 hover:bg-slate-50"
                                >
                                  <td className="px-3 py-1.5 font-medium text-slate-700">
                                    {lang === 'de'
                                      ? [
                                          'Jan',
                                          'Feb',
                                          'Mär',
                                          'Apr',
                                          'Mai',
                                          'Jun',
                                          'Jul',
                                          'Aug',
                                          'Sep',
                                          'Okt',
                                          'Nov',
                                          'Dez',
                                        ][m.month - 1]
                                      : [
                                          'Jan',
                                          'Feb',
                                          'Mar',
                                          'Apr',
                                          'May',
                                          'Jun',
                                          'Jul',
                                          'Aug',
                                          'Sep',
                                          'Oct',
                                          'Nov',
                                          'Dec',
                                        ][m.month - 1]}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-green-700 font-medium">
                                    {m.pvYieldKwh.toFixed(0)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-slate-500">
                                    {m.dailyPvKwh.toFixed(1)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-slate-500">
                                    {m.dailyNeedKwh.toFixed(1)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-green-600">
                                    {m.selfConsumptionKwh.toFixed(0)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-blue-600">
                                    {m.batteryChargeKwh.toFixed(0)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-slate-500">
                                    {m.gridExportKwh.toFixed(0)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-red-500 font-medium">
                                    {m.gridSupplyKwh.toFixed(0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-200 text-slate-600 font-semibold">
                              <tr>
                                <td className="px-3 py-2">∑</td>
                                <td className="px-3 py-2 text-right text-green-700">
                                  {monthlyFlows.reduce((s, m) => s + m.pvYieldKwh, 0).toFixed(0)}
                                </td>
                                <td className="px-3 py-2" />
                                <td className="px-3 py-2" />
                                <td className="px-3 py-2 text-right text-green-600">
                                  {monthlyFlows
                                    .reduce((s, m) => s + m.selfConsumptionKwh, 0)
                                    .toFixed(0)}
                                </td>
                                <td className="px-3 py-2 text-right text-blue-600">
                                  {monthlyFlows
                                    .reduce((s, m) => s + m.batteryChargeKwh, 0)
                                    .toFixed(0)}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-500">
                                  {monthlyFlows.reduce((s, m) => s + m.gridExportKwh, 0).toFixed(0)}
                                </td>
                                <td className="px-3 py-2 text-right text-red-500">
                                  {monthlyFlows.reduce((s, m) => s + m.gridSupplyKwh, 0).toFixed(0)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    {t.monthlyFlowNoData}
                  </div>
                )}
              </div>
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

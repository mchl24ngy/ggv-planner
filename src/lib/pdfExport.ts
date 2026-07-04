import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import html2canvas from 'html2canvas';

function buildFilename(address: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = address
    .replace(/[,/\\]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_À-ɏ-]/g, '')
    .replace(/_+/g, '_')
    .slice(0, 50)
    .replace(/_+$/, '');
  return `${date}_${slug || 'export'}.pdf`;
}
import type {
  SystemParams,
  ConsumptionParams,
  EconomicParams,
  FinancingParams,
  EnergyResults,
  EconomicResults,
} from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_W = 297; // A4 landscape mm
const PAGE_H = 210;
const M = 12; // outer margin
const COL_GAP = 6;
const HALF_W = (PAGE_W - 2 * M - COL_GAP) / 2;
const CONTENT_W = PAGE_W - 2 * M;

/** Y where chart content starts on chart pages — enough room below the 10 mm header. */
const CHART_TOP = 17;
const CHART_H = PAGE_H - CHART_TOP - M; // usable height below header

// ─── Image capture ────────────────────────────────────────────────────────────

interface Capture {
  dataUrl: string;
  ar: number; // naturalWidth / naturalHeight
}

async function captureElement(id: string): Promise<Capture | null> {
  const el = document.getElementById(id);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  try {
    const canvas = await html2canvas(el, {
      scale: 1.5, // good sharpness; JPEG handles the rest
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });
    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.82), // ~10–15× smaller than PNG
      ar: rect.width / rect.height,
    };
  } catch {
    return null;
  }
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

/** Fit image in a box maintaining aspect ratio. Top-aligned, horizontally centred. */
function fitImage(pdf: jsPDF, capture: Capture, x: number, y: number, maxW: number, maxH: number) {
  let w = maxW;
  let h = w / capture.ar;
  if (h > maxH) {
    h = maxH;
    w = h * capture.ar;
  }
  pdf.addImage(capture.dataUrl, 'JPEG', x + (maxW - w) / 2, y, w, h);
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────

function pageHeader(pdf: jsPDF, title: string, page: number, total: number, date: string) {
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, PAGE_W, 10, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Immo PV Planer', M, 6.5);
  pdf.text(title, PAGE_W / 2, 6.5, { align: 'center' });
  pdf.text(`${date} | ${page}/${total}`, PAGE_W - M, 6.5, { align: 'right' });
  pdf.setTextColor(30, 41, 59);
}

function chartLabel(pdf: jsPDF, text: string, cx: number, y: number) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(51, 65, 85);
  pdf.text(text, cx, y, { align: 'center' });
  pdf.setTextColor(30, 41, 59);
}

function sectionLabel(pdf: jsPDF, text: string, y: number, x = M) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(37, 99, 235);
  pdf.text(text, x, y);
  pdf.setTextColor(30, 41, 59);
}

const HEAD_STYLE = {
  fillColor: [37, 99, 235] as [number, number, number],
  textColor: 255 as unknown as [number, number, number],
  fontStyle: 'bold' as const,
  fontSize: 8.5,
};
const ROW_STYLE = { fontSize: 8.5, cellPadding: 2 };
const ALT_ROW = { fillColor: [248, 250, 252] as [number, number, number] };
const KEY_COL = {
  fontStyle: 'bold' as const,
  textColor: [71, 85, 105] as [number, number, number],
};

// ─── Main export ──────────────────────────────────────────────────────────────

export async function exportToPdf(
  system: SystemParams,
  consumption: ConsumptionParams,
  economics: EconomicParams,
  financing: FinancingParams,
  energy: EnergyResults,
  ecoResults: EconomicResults,
  lang: 'de' | 'en'
): Promise<void> {
  const isDE = lang === 'de';
  const loc = isDE ? 'de-DE' : 'en-US';
  const today = new Date().toLocaleDateString(loc, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const TOTAL = 4;

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ─── PAGE 1: Input Data ──────────────────────────────────────────────────
  pageHeader(pdf, isDE ? 'Projektübersicht' : 'Project Overview', 1, TOTAL, today);

  const startY = CHART_TOP; // same gap as chart pages
  sectionLabel(pdf, isDE ? '1. Technische Daten' : '1. Technical Data', startY);

  const techRows: string[][] = [
    [isDE ? 'Standort' : 'Location', system.address],
    [isDE ? 'PV-Leistung' : 'PV Capacity', `${system.pvCapacityKwp} kWp`],
    [
      isDE ? 'Batteriespeicher' : 'Battery Storage',
      system.hasBattery
        ? `${isDE ? 'Ja' : 'Yes'}, ${system.batteryCapacityKwh} kWh`
        : isDE
          ? 'Nein'
          : 'No',
    ],
    [isDE ? 'Neigungswinkel' : 'Tilt Angle', `${system.inclination}°`],
    [
      isDE ? 'Ausrichtung (Azimut)' : 'Azimuth',
      system.mountingType === 'eastWest'
        ? isDE
          ? 'Ost-West (50% / 50%)'
          : 'East-West (50% / 50%)'
        : `${system.azimuth}°`,
    ],
    [isDE ? 'Systemverluste' : 'System Losses', `${system.systemLoss} %`],
    [isDE ? 'Wohneinheiten' : 'Apartments', `${consumption.apartments}`],
    [
      isDE ? 'Teilnehmerquote' : 'Participation Rate',
      `${Math.round(consumption.participationRate * 100)} %`,
    ],
    [
      isDE ? 'Verbrauch pro WE' : 'Consumption/Unit',
      `${consumption.consumptionPerApartmentKwh.toLocaleString(loc)} kWh`,
    ],
    ...(consumption.hasHeatPump
      ? [
          [
            isDE ? 'Wärmepumpe' : 'Heat Pump',
            `${consumption.heatPumpConsumptionKwh.toLocaleString(loc)} kWh`,
          ],
        ]
      : []),
    ...(consumption.hasEvCharging
      ? [
          [
            isDE ? 'E-Mobilität' : 'EV Charging',
            `${consumption.evChargingPoints} × ${consumption.evChargingConsumptionPerPointKwh.toLocaleString(loc)} kWh`,
          ],
        ]
      : []),
    ...(consumption.hasGeneralConsumption
      ? [
          [
            isDE ? 'Allgemeinstrom' : 'Common Area',
            `${consumption.generalConsumptionKwh.toLocaleString(loc)} kWh`,
          ],
        ]
      : []),
  ];

  autoTable(pdf, {
    startY: startY + 3,
    head: [[isDE ? 'Parameter' : 'Parameter', isDE ? 'Wert' : 'Value']],
    body: techRows,
    margin: { left: M, right: M + HALF_W + COL_GAP },
    styles: ROW_STYLE,
    headStyles: HEAD_STYLE,
    alternateRowStyles: ALT_ROW,
    columnStyles: { 0: KEY_COL },
  });

  sectionLabel(
    pdf,
    isDE ? '2. Wirtschaftliche Daten' : '2. Economic Data',
    startY,
    M + HALF_W + COL_GAP
  );

  const modelLabel =
    economics.model === 'Mieterstrom'
      ? isDE
        ? 'Klassischer Mieterstrom'
        : 'Classic Tenant Electricity'
      : isDE
        ? 'GGV (Gemeinschaftl. Gebäudeversorgung)'
        : 'GGV (Communal Building Supply)';

  const econRows: string[][] = [
    [isDE ? 'Betriebsmodell' : 'Model', modelLabel],
    [
      isDE ? 'Verkaufspreis Mieter' : 'Tenant Sales Price',
      `${economics.tenantElectricityRate} ct/kWh`,
    ],
    [
      isDE ? 'Referenzpreis Netz' : 'Grid Reference Price',
      `${economics.gridElectricityRate} ct/kWh`,
    ],
    [isDE ? 'Einspeisevergütung' : 'Feed-in Tariff', `${economics.feedInTariff} ct/kWh`],
    ...(economics.model === 'Mieterstrom'
      ? [
          [isDE ? 'Grundgebühr' : 'Base Fee', `${economics.baseFeePerMonth} €/Mo.`],
          [
            isDE ? 'Mieterstromzuschlag' : 'Tenant Elec. Subsidy',
            `${economics.tenantElectricitySubsidy} ct/kWh`,
          ],
        ]
      : []),
    [isDE ? 'Monatl. Dachpacht' : 'Monthly Roof Rent', `${economics.roofRentPerMonth} €`],
    ['CAPEX', `${economics.capex.toLocaleString(loc)} €`],
    ['OPEX', `${economics.opexPerYear.toLocaleString(loc)} €/${isDE ? 'Jahr' : 'Year'}`],
    [isDE ? 'Kreditbetrag' : 'Loan Amount', `${financing.loanAmount.toLocaleString(loc)} €`],
    [isDE ? 'Zinssatz' : 'Interest Rate', `${financing.interestRate} % p.a.`],
    [
      isDE ? 'Kreditlaufzeit' : 'Loan Term',
      `${financing.loanTermYears} ${isDE ? 'Jahre' : 'Years'}`,
    ],
    [
      isDE ? 'Betrachtungszeitraum' : 'Calc. Period',
      `${economics.calculationPeriodYears} ${isDE ? 'Jahre' : 'Years'}`,
    ],
  ];

  autoTable(pdf, {
    startY: startY + 3,
    head: [[isDE ? 'Parameter' : 'Parameter', isDE ? 'Wert' : 'Value']],
    body: econRows,
    margin: { left: M + HALF_W + COL_GAP, right: M },
    styles: ROW_STYLE,
    headStyles: HEAD_STYLE,
    alternateRowStyles: ALT_ROW,
    columnStyles: { 0: KEY_COL },
  });

  // KPI block beneath both tables
  const lastY: number =
    (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? PAGE_H - 30;
  const kpiY = lastY + 6;

  if (kpiY < PAGE_H - 25) {
    sectionLabel(pdf, isDE ? 'Ergebnis-KPIs' : 'Result KPIs', kpiY);

    autoTable(pdf, {
      startY: kpiY + 3,
      head: [
        [
          isDE ? 'Kennzahl' : 'KPI',
          isDE ? 'Wert' : 'Value',
          isDE ? 'Kennzahl' : 'KPI',
          isDE ? 'Wert' : 'Value',
        ],
      ],
      body: [
        [
          isDE ? 'PV-Energieerzeugung' : 'PV Energy Generation',
          `${energy.totalYieldKwh.toFixed(0)} kWh`,
          isDE ? 'Autarkiegrad' : 'Autarky Rate',
          `${(energy.autarkyRate * 100).toFixed(1)} %`,
        ],
        [
          isDE ? 'Eigenverbrauchsquote' : 'Self-consumption Rate',
          `${(energy.selfConsumptionRate * 100).toFixed(1)} %`,
          isDE ? 'Stromgestehungskosten (LCOE)' : 'LCOE',
          `${ecoResults.lcoe.toFixed(4)} €/kWh`,
        ],
        [
          isDE ? 'Amortisationszeit' : 'Payback Period',
          ecoResults.amortizationYears
            ? `${ecoResults.amortizationYears} ${isDE ? 'Jahre' : 'Years'}`
            : isDE
              ? 'Außerhalb Zeitraum'
              : 'Outside period',
          isDE ? 'Akkum. Einnahmen' : 'Accum. Revenue',
          `${ecoResults.accumulatedCashflow.toLocaleString(loc, { maximumFractionDigits: 0 })} €`,
        ],
      ],
      margin: { left: M, right: M },
      styles: ROW_STYLE,
      headStyles: {
        fillColor: [100, 116, 139] as [number, number, number],
        textColor: 255 as unknown as [number, number, number],
        fontStyle: 'bold' as const,
        fontSize: 8.5,
      },
      alternateRowStyles: ALT_ROW,
      columnStyles: { 0: KEY_COL, 2: KEY_COL },
    });
  }

  // ─── Capture all charts in parallel ──────────────────────────────────────
  const [cashflowCapture, pieCapture, savingsCapture, monthlyCapture] = await Promise.all([
    captureElement('pdf-chart-cashflow'),
    captureElement('pdf-chart-pie'),
    captureElement('pdf-chart-savings'),
    captureElement('pdf-chart-monthly'),
  ]);

  // ─── PAGE 2: Cashflow chart — full width gives natural wide proportions ───
  pdf.addPage();
  pageHeader(
    pdf,
    isDE
      ? `Cashflow-Entwicklung (${economics.calculationPeriodYears} Jahre)`
      : `Cashflow Development (${economics.calculationPeriodYears} Years)`,
    2,
    TOTAL,
    today
  );
  chartLabel(
    pdf,
    isDE
      ? `Cashflow-Entwicklung über ${economics.calculationPeriodYears} Jahre`
      : `Cashflow Development over ${economics.calculationPeriodYears} Years`,
    PAGE_W / 2,
    CHART_TOP - 1
  );
  if (cashflowCapture) {
    fitImage(pdf, cashflowCapture, M, CHART_TOP + 2, CONTENT_W, CHART_H - 2);
  }

  // ─── PAGE 3: Cashflow table (was page 4) ─────────────────────────────────
  pdf.addPage();
  pageHeader(
    pdf,
    isDE
      ? `Cashflow-Plan (${economics.calculationPeriodYears} Jahre)`
      : `Cashflow Plan (${economics.calculationPeriodYears} Years)`,
    3,
    TOTAL,
    today
  );

  if (ecoResults.cashflowPlan.length > 0) {
    const cfHead = [
      isDE ? 'Jahr' : 'Year',
      isDE ? 'Einnahmen (€)' : 'Revenue (€)',
      'OPEX (€)',
      isDE ? 'Annuität (€)' : 'Loan Inst. (€)',
      isDE ? 'Cashflow (€)' : 'Cashflow (€)',
      isDE ? 'Kum. Cashflow (€)' : 'Cumul. Cashflow (€)',
    ];

    const cfBody = ecoResults.cashflowPlan.map((row) => [
      String(row.year),
      row.totalRevenue.toFixed(0),
      `-${row.opex.toFixed(0)}`,
      row.loanInstallment > 0 ? `-${row.loanInstallment.toFixed(0)}` : '–',
      `${row.cashflow >= 0 ? '+' : ''}${row.cashflow.toFixed(0)}`,
      `${row.cumulativeCashflow >= 0 ? '+' : ''}${row.cumulativeCashflow.toFixed(0)}`,
    ]);

    autoTable(pdf, {
      startY: 14,
      head: [cfHead],
      body: cfBody,
      margin: { left: M, right: M },
      styles: { fontSize: 9, cellPadding: 2.5, halign: 'right' },
      headStyles: { ...HEAD_STYLE, halign: 'center' },
      columnStyles: { 0: { halign: 'center', fontStyle: 'bold' } },
      alternateRowStyles: ALT_ROW,
      didParseCell: (data) => {
        if (data.section !== 'body') return;
        const raw = String(data.cell.raw ?? '');
        if (data.column.index === 4) {
          data.cell.styles.textColor = raw.startsWith('-') ? [220, 38, 38] : [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 5) {
          data.cell.styles.textColor = raw.startsWith('-') ? [220, 38, 38] : [22, 163, 74];
        }
      },
    });
  }

  // ─── PAGE 4: Energy charts — pie + savings side by side, monthly below ───
  pdf.addPage();
  pageHeader(pdf, isDE ? 'Energiediagramme' : 'Energy Charts', 4, TOTAL, today);

  // Split vertically: top 60 % for the two energy charts, bottom 40 % for monthly
  const topH = Math.round(CHART_H * 0.6); // ≈ 109 mm
  const botH = CHART_H - topH - COL_GAP; // ≈ 65 mm

  const halfW = (CONTENT_W - COL_GAP) / 2; // ≈ 130 mm each column
  const rightX = M + halfW + COL_GAP;
  const botY = CHART_TOP + topH + COL_GAP;

  // Labels
  chartLabel(
    pdf,
    isDE ? 'Jahres-Energiebilanz' : 'Annual Energy Balance',
    M + halfW / 2,
    CHART_TOP - 1
  );
  chartLabel(pdf, isDE ? 'Mieter-Ersparnis' : 'Tenant Savings', rightX + halfW / 2, CHART_TOP - 1);
  chartLabel(pdf, isDE ? 'Monatliche Energieflüsse' : 'Monthly Energy Flows', PAGE_W / 2, botY - 1);

  if (pieCapture) {
    fitImage(pdf, pieCapture, M, CHART_TOP + 2, halfW, topH - 2);
  }
  if (savingsCapture) {
    fitImage(pdf, savingsCapture, rightX, CHART_TOP + 2, halfW, topH - 2);
  }
  if (monthlyCapture) {
    fitImage(pdf, monthlyCapture, M, botY + 2, CONTENT_W, botH - 2);
  }

  pdf.save(buildFilename(system.address));
}

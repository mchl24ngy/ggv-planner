export type Lang = 'de' | 'en';

export const translations = {
  de: {
    // App header
    appTitle: 'Immo PV Planer',
    appSubtitle: 'Interaktives Simulationsmodell für Immobilien',
    openSource: 'Open Source',
    projectOnGithub: 'Immo PV Planer @ Github',
    myWebsite: 'Meine Website',

    // KPI Labels
    kpiYield: 'PV Energieerzeugung',
    kpiAutarky: 'Autarkiegrad',
    kpiSelfConsumption: 'Eigenverbrauchsquote',
    kpiLcoe: 'Stromgestehungskosten',
    kpiAmortization: 'Amortisationszeit',
    kpiAccumulatedCashflow: 'Akkum. Einnahmen (20 J.)',
    kpiYears: 'Jahre',
    tooltipKpiYield:
      'Geschätze jährlicher PV-Bruttoertrag laut EU-Satellitendaten (PVGIS-Simulation). Abhängig von Standort, Anlagenleistung, Neigungswinkel und Systemverlusten.',
    tooltipKpiAutarky:
      'Ungefährerer Anteil des Gesamtstrombedarfs, der durch PV-Direktverbrauch inkl. Batteriezwischenspeicherung gedeckt wird. Je höher, desto weniger Energie wird aus dem Netz bezugen.',
    tooltipKpiSelfConsumption:
      'Anteil des erzeugten PV-Stroms, der direkt im Gebäude verbraucht wird (inkl. Batteriespeicher). Je höher, desto weniger Überschuss wird ins Netz eingespeist.',
    tooltipKpiLcoe:
      'Ermittelte Stromgestehungskosten: Gesamtkosten der Anlage über die Laufzeit (CAPEX + OPEX + Zinsen) dividiert durch die erzeugte Energiemenge.',
    tooltipKpiAmortization:
      'Jahr, in dem die Anlage abbezahlt ist (Break-Even-Punkt). Danach müssen nur noch die Betriebskosten (Software, Wartung) bezahlt werden, der Rest bleibt als Überschuss.',
    tooltipKpiAccumulatedCashflow:
      'Summe aller jährlichen Cashflows vor Steuern über den gesamten Betrachtungszeitraum (20 Jahre). Entspricht den kumulierten Nettoeinnahmen nach Betriebskosten und Kreditdienst.',

    // Tabs
    tab1: '1. Technische Daten',
    tab2: '2. Wirtschaftliche Daten',
    tab3: '3. Ergebnisse',

    btnNext: 'Weiter',

    // Loading
    loading: 'Berechne...',

    // Expert hint banner (Tab 1 + Tab 2)
    infoExpertHint:
      'Dieses Tool setzt grundlegendes Verständnis der verwendeten Fachbegriffe voraus. Wir empfehlen, sich auf offiziellen Seiten zu informieren:',
    infoExpertLinkLabel: 'Informationen der Bundesnetzagentur',

    // Tab 1: Technical
    tab1Title: 'Technische Konfiguration',
    sectionPV: 'Photovoltaik-Anlage',
    sectionConsumption: 'Verbraucher im Gebäude',

    labelAddress: 'Standort / Adresse',
    placeholderAddress: 'z.B. Berlin, Deutschland',
    addressCoords: 'Breite: {lat}, Länge: {lon}',
    tooltipAddress:
      'Die Adresse wird in GPS-Koordinaten umgerechnet und dient der Abschätzung des jährlichen PV-Ertrags. Sie wird nicht gespeichert.',

    labelPvCapacity: 'PV-Leistung (kWp)',
    tooltipPvCapacity:
      'Die installierte Peakleistung der PV-Anlage in Kilowatt-Peak. Ein typisches Mehrfamilienhaus hat 30–150 kWp.',
    pvInputToggleKwp: 'kWp',
    pvInputToggleSqm: 'm² Dachfläche',
    labelRoofArea: 'Nutzbare Dachfläche (m²)',
    tooltipRoofArea:
      'Die für PV nutzbare Dachfläche. Daraus wird die Anlagenleistung berechnet: (m² ÷ 5) × 0,8 Nutzungsfaktor (basierend auf 200 Wp/m² Modulleistung und 80% Flächennutzung für Abstände, Verschattung etc.).',
    pvCapacityFromArea: 'Berechnete Leistung: {kwp} kWp',
    roofAreaMapsLink: 'Dachfläche in Google Maps ausmessen (Satellitenansicht)',

    expertModeLabel: 'Expertenmodus (Dachneigung & Ausrichtung)',
    tooltipExpertMode:
      'Im Standardmodus werden Südausrichtung (0°) und ein Anstellwinkel von 35° angenommen – typische Werte für optimale Erträge in Mitteleuropa. Im Expertenmodus können diese Werte individuell angepasst werden.',
    labelInclination: 'Neigungswinkel (°)',
    tooltipInclination:
      'Neigung der PV-Module zur Horizontalen. 0° = flach (Flachdach), 30–40° = optimal für Mitteleuropa, 90° = senkrecht (Fassade).',
    labelAzimuth: 'Ausrichtung (Azimut)',
    tooltipAzimuth:
      'Himmelsrichtung der PV-Module. 0° = Süd (optimal), −90° = Ost, +90° = West. Abweichungen von Süd reduzieren den Jahresertrag.',
    azimuthEast: 'Ost',
    azimuthSouth: 'Süd',
    azimuthWest: 'West',
    expertModeDefault: 'Standard: Süd, 35°',

    labelBattery: 'Batteriespeicher',
    labelBatteryCapacity: 'kWh',
    tooltipBattery:
      'Ein Batteriespeicher erhöht die Eigenverbrauchsquote erheblich, da überschüssiger PV-Strom gespeichert und nachts genutzt werden kann. Faustformel istt: 0,5 kWh Speicher pro kWp PV-Leistung.',

    labelApartments: 'Wohneinheiten',
    tooltipApartments:
      'Anzahl der angeschlossenen Mietparteien. Je mehr Wohneinheiten, desto größer der Gesamtstromverbrauch.',

    labelParticipationRate: 'Teilnehmerquote WE',
    tooltipParticipationRate:
      'Anteil der Wohneinheiten, die aktiv am Mieterstrom- bzw. GGV-Modell teilnehmen. Nicht alle Mieter wollen teilnehmen. Erfahrungswerte liegen bei 60-80%.',

    labelConsumptionPerApartment: 'Verbrauch/WE (kWh)',
    tooltipConsumptionPerApartment:
      'Durchschnittlicher Jahresstromverbrauch pro Wohneinheit. Typisch: 2.000–3.500 kWh/a für Haushalte ohne Wärmenutzung.',

    labelHeatPump: 'Wärmepumpe: gesamter, elektr. Energiebedarf (kWh/a)',
    tooltipHeatPump:
      'Der elektr. Energiebedarf ist sehr inviduell und hängt vom Gebäude, der Größe von Wohnung und Wärmepumpe so Verhalter der Bewohner ab. Richtwert: 1.500-5.000 kWh/a und Wohnung.',

    labelEV: 'E-Mobilität: Wallboxen & elektr. Energiebedarf (kWh/a)',
    labelEVCount: 'Anzahl Wallboxen',
    labelEVConsumptionPerPointKwh: 'jährl. kWh pro Ladepunkt',

    tooltipEV:
      'Gesamter Jahresstromverbrauch für das Laden von Elektrofahrzeugen. Ca. 2.000 kWh/a pro Fahrzeug (bei 20kWh/100km und jährl. Fahrleistung von 10.000km).',

    labelGeneralConsumption: 'Allgemeinstrom (kWh/a)',
    tooltipGeneralConsumption:
      'Stromverbrauch für gemeinschaftlich genutzte Bereiche wie Treppenhaus, Keller, Außenbeleuchtung oder Aufzug. Typisch: 1.000–5.000 kWh/a je nach Gebäudegröße.',

    // Tab 2: Economic
    tab2Title: 'Wirtschaftliche Parameter',
    sectionModel: 'Betriebsmodell wählen',
    modelMieterstrom: 'Klassischer Mieterstrom',
    modelGGV: 'GGV (Gemeinschaftl. Gebäudeversorgung)',
    sectionTariffs: 'Einnahmen & Stromtarife',
    sectionFinancing: 'Ausgaben & Finanzierung',

    labelTenantRate: 'Netto-Verkaufspreis Mieter (ct)',
    tooltipTenantRate:
      'Der ct/kWh-Preis, den der Betreiber an die Mieter für den Mieterstrom berechnet. Muss mindestens 10% unter dem lokalen Grundversorger-Tarif liegen. Dieser ist umsatzsteuerpflichtig, daher Netto-Angabe.',

    labelFeedIn: 'Einspeisevergütung (ct)',
    tooltipFeedIn:
      'Vergütung für nicht im Gebäude verbrauchten Strom. Dies kann die EEG-Einspeisevergütung sein, aber auch Direktvermarkung (PPA) oder Energie-Sharing mit Nachbargebäuden. EEG-Vergütung in 2026: 5-7 ct/kWh, je nach Anlagengröße.',

    labelBaseFee: 'Messentgelt/Grundgebühr (€/Mo)',
    tooltipBaseFee:
      'Monatliche Grundgebühr pro Wohneinheit für die Bereitstellung des Messdienstleistungs- und Abrechnungsservice. Nur im Mieterstrom-Modell.',

    labelSubsidy: 'Mieterstromzuschlag (ct)',
    tooltipSubsidy:
      'Staatliche Förderung pro kWh an Mieter geliefertem Strom (gemäß § 21 EEG). Wird regelmäßig angepasst und variiert je nach Anlagengröße - in 2026: 1,59ct/kWh - 2.57ct/kWh.',

    labelGridRate: 'Referenzpreis Netz (ct/kWh)',
    tooltipGridRate:
      'Lokaler Grundversorger-Tarif als Referenz. Dieser muss min. 10% über dem Verkaufspreis an Mieter liegen. Wird im Tool u.a. zur Berechnung der Mietereinsparungen verwendet.',

    labelRoofRent: 'mtl. Dachpacht (€)',
    tooltipRoofRent:
      'Monatliche Pacht für die Nutzung des Daches. Preise je qm oder je kWp. Üblich sind Werte zwischen 50 ct und 1 € pro kWp. Da durch die PV-Anlage das Haus aufgewertet wird, wird das Dach von manchen Eigentümern auch kostenfrei überlassen.',

    labelCapex: 'Investmentkosten CAPEX (€ netto)',
    tooltipCapex:
      'Gesamte Investitionskosten der Anlage (Netto, ohne MwSt.). Inkl. Module, Wechselrichter, Montage, Elektrik und ggf. Speicher.',
    capexAutoLabel: 'Preisindikation',
    capexCustomLabel: 'Manuell angepasst',
    capexResetDefault: 'Zurücksetzen',

    labelOpex: 'Betriebskosten OPEX (€ pro Jahr)',
    tooltipOpex:
      'Jährliche Betriebskosten: Wartung, Versicherung, Zählerabrechnung, Softwaregebühren, etc. Typisch: 1–2% des CAPEX p.a.',
    opexAutoLabel: 'Preisindikation',
    opexCustomLabel: 'Manuell angepasst',
    opexResetDefault: 'Zurücksetzen',

    // Breakdown modal – shared UI
    breakdownOpen: 'Eigene Preise eingeben',
    breakdownApply: 'Übernehmen',
    breakdownCancel: 'Abbrechen',
    breakdownTotal: 'Gesamtbetrag',
    breakdownHint:
      'Geben Sie die Einzelpositionen ein. Der berechnete Gesamtbetrag wird in das Eingabefeld übernommen.',
    breakdownCapexTitle: 'Investitionskosten aufschlüsseln',
    breakdownOpexTitle: 'Betriebskosten aufschlüsseln',

    // Breakdown modal – CAPEX items
    breakdownCapexPvSystem: 'PV-Anlage inkl. Wechselrichter',
    tooltipBreakdownCapexPvSystem:
      'Kosten für PV-Module, Wechselrichter und deren direkte Montage. Richtwert: 800–1.200 €/kWp je nach Anlagengröße.',
    breakdownCapexBattery: 'Batteriespeicher',
    tooltipBreakdownCapexBattery:
      'Anschaffungs- und Installationskosten des Batteriespeichers inkl. Inbetriebnahme. Richtwert: 700–1.200 €/kWh Speicherkapazität.',
    breakdownCapexInstallation: 'Installation & Infrastruktur',
    tooltipBreakdownCapexInstallation:
      'Elektroinstallation, Zählerinfrastruktur (Unterzähler, Messkonzept), Kabelwege und Unterverteiler.',
    breakdownCapexConsulting: 'Beratung & Planungskosten',
    tooltipBreakdownCapexConsulting:
      'Planungsleistungen, Gutachten, rechtliche Beratung für das Mieterstrom- oder GGV-Modell sowie Kosten für Netzanmeldung.',
    breakdownCapexOther: 'Sonstige Kosten',
    tooltipBreakdownCapexOther:
      'Anmeldegebühren, Genehmigungen, Rücklagen für unvorhergesehene Ausgaben oder weitere projektspezifische Posten.',

    // Breakdown modal – OPEX items
    breakdownOpexTechManagement: 'Technische Betriebsführung',
    tooltipBreakdownOpexTechManagement:
      'Wartung der PV-Anlage und des Batteriespeichers, Monitoring, Fernüberwachung und Entstörung. Richtwert: 0,5–1 % des CAPEX p.a.',
    breakdownOpexBilling: 'Abrechnung',
    tooltipBreakdownOpexBilling:
      'Zählerablesung, Verbrauchserfassung und Jahresabrechnung an Mieter. Richtwert: 5–15 €/Zähler/Monat.',
    breakdownOpexAdminManagement: 'Administrative Betriebsführung',
    tooltipBreakdownOpexAdminManagement:
      'Verwaltungsaufwand, Versicherungen (Ertrags- und Haftpflicht), Buchführung und Kommunikation mit Mietern.',
    breakdownOpexRoofRent: 'Dachpacht (jährl.)',
    tooltipBreakdownOpexRoofRent:
      'Jährliche Dachpacht: monatliche Pachtrate × 12. Wird intern als monatlicher Wert in der Wirtschaftlichkeitsberechnung geführt. Bei kostenfreier Dachüberlassung: 0 lassen.',

    labelLoanAmount: 'Kreditbetrag (€)',
    tooltipLoanAmount:
      'Der fremdfinanzierte Anteil der Investitionskosten. Der Rest ist das aufzubringende Eigenkapital.',

    labelInterestRate: 'Zins (% p.a.)',
    tooltipInterestRate:
      'Jährlicher Zinssatz des Investitionsdarlehens. Für Projekte dieser Art gibt es häufig günstige KfW-Förderprogramme.',

    labelLoanTerm: 'Kreditlaufzeit (Jahre)',
    tooltipLoanTerm: 'Tilgungsdauer des Darlehens in Jahren. Typisch 10–20 Jahre für Solaranlagen.',

    // Tab 3: Results
    tab3Title: 'Ergebnisse & Analyse',
    chartEnergyTitle: 'Jahres-Energiebilanz',
    chartCashflowTitle: 'Cashflow-Entwicklung über {years} Jahre',
    chartTenantSavingsTitle: 'Mieter-Ersparnis gegenüber Grundversorger (pro WE/Jahr)',
    chartTenantSavingsSubtitle:
      'Ersparnis = (Referenzpreis Netz − Verkaufspreis Mieter) × Verbrauch/WE',
    labelPvYield: 'PV-Erzeugung:',
    labelTotalConsumption: 'Gesamtbedarf:',
    labelGridExport: 'Netzeinspeisung:',
    noData: 'Keine Daten zur Visualisierung vorhanden.',

    // Detail table
    tableTitle: 'Details für Jahr {year}',
    tablePosition: 'Position',
    tableAmount: 'Betrag (€)',
    tableRevenue: 'Einnahmen (Gesamt)',
    tableMieterstrom: '- Mieterstrom',
    tableBaseFee: '- Grundgebühr',
    tableSubsidy: '- Mieterstromzuschlag',
    tableFeedIn: '- Einspeisung',
    tableOpex: 'Betriebskosten (OPEX)',
    tableAnnuity: 'Annuität (Gesamt)',
    tableInterest: '- Zinsen',
    tablePrincipal: '- Tilgung',
    tableCashflow: 'Cashflow vor Steuern',
    tableDepreciation: 'Abschreibung (AfA)',
    tableDepreciationLinear: 'Linear',
    tableDepreciationDegressive: 'Degressiv',
    tableDepreciationNote: 'nicht cashflow-wirksam',

    // Tooltip model hint
    tooltipModelMieterstrom:
      'Im Mieterstrom übernimmt der Vermieter/Betreiber die gesamte Energieversorung. Dies besteht aus PV-Strom sowie extern zugekauften Reststrom für die Zeit, wo PV & Speicher keine Energie liefern. Dafür erhält der Betreiber zusätzlich zum Arbeitspreis die Grundgebühr. Dafür muss der Preis unter dem des Grundversorgers liegen.',
    tooltipModelGGV:
      'Beim Gemeinschaftliche Gebäudeversorgung (GGV) erhalten Mietpartein den PV-Strom zusätzlich. In der Zeit ohne PV-Strom beziehen sie weiter Strom aus ihrem bestehenden Stromvertrag. Der Betreiber erhält für jede verkaufte kWh seinen vereinbarten Arbeitspreis.',

    // Tab 3 Optimization
    sectionOptimize: 'Optimierungsregler',
    optimizeDescription:
      'Die drei wichtigsten Stellschrauben für den Business Case – Änderungen wirken sofort auf alle Kennzahlen.',
    labelOptTenantRate: 'Verkaufspreis an Mieter',
    labelOptBattery: 'Batteriespeicher',
    labelOptParticipation: 'Teilnehmerquote WE',
    noBattery: 'Kein Speicher',
    tooltipOptTenantRate:
      'Der Verkaufspreis ist der stärkste Hebel für die Einnahmen: jeder Cent mehr multipliziert sich mit der gesamten verkauften Strommenge. Er muss jedoch mindestens 10 % unter dem lokalen Grundversorger-Tarif liegen.',
    tooltipOptBattery:
      'Ein größerer Speicher erhöht den Eigenverbrauchsanteil und damit die verkaufte Menge an Mieterstrom – hat aber auch Einfluss auf den CAPEX. Prüfen Sie, ob die Mehrinvestition durch die Mehrerträge gedeckt wird.',
    tooltipOptParticipation:
      'Je höher die Teilnehmerquote, desto mehr Mieter beziehen Strom aus der Anlage – und desto höher sind Grundgebühr- und Mieterstromeinnahmen. In der Praxis liegt die Quote selten bei 100 %.',

    // Tab 3: Monatliche Energieflüsse
    monthlyFlowTitle: 'Monatliche Energieflüsse',
    monthlyFlowSubtitle:
      'Tagesbilanz: PV-Ertrag vs. Verbrauch – skaliert auf Monatswerte. Grün/Gelb/Blau = PV-Nutzung; Rot = Netzbezug.',
    monthlyFlowDirectConsumption: 'Direktverbrauch',
    monthlyFlowBatteryCharge: 'Batterieladung',
    monthlyFlowGridExport: 'Netzeinspeisung',
    monthlyFlowGridSupply: 'Netzbezug',
    monthlyFlowTableMonth: 'Monat',
    monthlyFlowTablePvYield: 'PV-Ertrag',
    monthlyFlowTableDailyPv: 'PV/Tag',
    monthlyFlowTableDailyNeed: 'Bedarf/Tag',
    monthlyFlowTableSelfConsumption: 'Direktverbrauch',
    monthlyFlowTableBattery: 'Batterieladung',
    monthlyFlowTableGridExport: 'Netzeinspeisung',
    monthlyFlowTableGridSupply: 'Netzbezug',
    monthlyFlowNoData: 'Monatliche Energieflüsse werden nach der ersten Berechnung angezeigt.',
    btnMonthlyDetail: 'Monatliche Details anzeigen',
    cashflowRevenue: 'Einnahmen p.a.',
    cashflowOpex: 'Betriebskosten (OPEX)',
    cashflowInterest: 'Zinsen',
    cashflowPrincipal: 'Tilgung',
    energyMixPv: 'PV-Erzeugung',
    energyMixBattery: 'Batteriebezug',
    energyMixGrid: 'Netzbezug',
    energyMixTooltipLabel: 'Energie',
    tenantSavingsLabel: 'Ersparnis p.a.',
    tenantSavingsTooltip: 'Ersparnis p.a.',
    scenarioMinus50: '-50%',
    scenarioBase: 'Basis',
    scenarioPlus50: '+50%',

    // PDF Export
    btnExportPdf: 'PDF exportieren (beta)',
    pdfExporting: 'PDF wird erstellt…',

    // JSON Export / Import
    btnExportJson: 'Konfiguration exportieren',
    btnImportJson: 'Konfiguration importieren',
    jsonImportErrorInvalidJson:
      'Die Datei konnte nicht gelesen werden. Bitte prüfen Sie, ob es sich um eine gültige JSON-Datei handelt.',
    jsonImportErrorWrongAppId:
      'Die hochgeladene Datei stammt nicht aus diesem Tool und kann nicht importiert werden.',
    jsonImportSuccess: 'Konfiguration erfolgreich importiert.',

    // Tutorial
    tutorialWelcomeTitle: 'Willkommen beim Immo PV Planer!',
    tutorialWelcomeText:
      'Möchten Sie eine kurze Einführung in die wichtigsten Funktionen erhalten?',
    tutorialBtnStart: 'Tour starten',
    tutorialBtnSkip: 'Direkt starten',
    tutorialBtnRestart: 'Tour wiederholen',
    supportBtnLabel: 'Feedback & Support',
    tutorialLocaleBack: 'Zurück',
    tutorialLocaleClose: 'Schließen',
    tutorialLocaleLast: 'Fertig',
    tutorialLocaleNext: 'Weiter',
    tutorialLocaleOpen: 'Tour öffnen',
    tutorialLocaleSkip: 'Überspringen',

    tutorialStep1Title: 'Standort eingeben',
    tutorialStep1Content:
      'Geben Sie hier die Adresse des Gebäudes ein. Für den Standort wird der jährlichen PV-Ertrags ermittelt.',
    tutorialStep2Title: 'Batteriespeicher konfigurieren',
    tutorialStep2Content:
      'Geben Sie die Werte ein, wenn Sie sie haben. Sie können aber auch erst einmal die Standardwerte verwenden, die bereits ausgefüllt sind.',
    tutorialStep3Title: 'Info-Tooltips nutzen',
    tutorialStep3Content:
      'Diese kleinen (i)-Icons erklären jeden Parameter im Detail. Fahren Sie mit der Maus darüber, um mehr Informationen zu erhalten.',
    tutorialStep4Title: 'Weiter zum nächsten Bereich',
    tutorialStep4Content:
      'Mit dem Weiter-Button gelangen Sie zum nächsten Tab. Alle Eingaben werden sofort neu berechnet. Sie können links über die drei Tabs jederzeit frei zwischen den Bereichen wechseln.',
    tutorialStep5Title: 'Freie Navigation zwischen Bereichen',
    tutorialStep5Content:
      'Über die linke Seitenleiste können Sie jederzeit direkt zwischen den drei Bereichen wechseln: Technische Daten, Wirtschaftliche Daten und Ergebnisse.',
    tutorialStep6Title: 'Ergebnisse & Analyse',
    tutorialStep6Content:
      'Hier sehen Sie alle Ergebnisse auf einen Blick: Energiemix, Cashflow-Entwicklung, Mietereinsparungen und monatliche Energieflüsse. Alle Diagramme aktualisieren sich automatisch bei jeder Eingabeänderung.',
    tutorialStep7Title: 'Projekt-KPIs auf einen Blick',
    tutorialStep7Content:
      'Die KPI-Leiste zeigt die sechs wichtigsten Kennzahlen dauerhaft: PV-Ertrag, Autarkiegrad, Eigenverbrauchsquote, Stromgestehungskosten, Amortisationszeit und kumulierte Einnahmen über 20 Jahre.',
  },

  en: {
    // App header
    appTitle: 'Immo PV Planner',
    appSubtitle: 'Interactive simulation model for real estate',
    openSource: 'Open Source',
    projectOnGithub: 'Immo PV Planer @ Github',
    myWebsite: 'My Website',

    // KPI Labels
    kpiYield: 'PV Energy Generation',
    kpiAutarky: 'Autarky Rate',
    kpiSelfConsumption: 'Self-consumption Rate',
    kpiLcoe: 'LCOE (Levelized Cost of Electricity)',
    kpiAmortization: 'Payback Period',
    kpiAccumulatedCashflow: 'Accum. Revenue (20 Y.)',
    kpiYears: 'Years',
    tooltipKpiYield:
      'Estimated annual gross PV yield based on EU satellite data (PVGIS simulation). Depends on location, system capacity, tilt angle, and system losses.',
    tooltipKpiAutarky:
      'Approximate share of total electricity demand covered by direct PV consumption incl. battery storage. The higher the autarky rate, the less energy is drawn from the grid.',
    tooltipKpiSelfConsumption:
      'Share of generated PV electricity consumed directly in the building (incl. battery storage). Higher means less surplus is fed into the grid.',
    tooltipKpiLcoe:
      'Calculated Levelized Cost of Electricity: total system costs over its lifetime (CAPEX + OPEX + interest) divided by the total energy generated.',
    tooltipKpiAmortization:
      'The year in which the system is fully paid off (break-even point). After that, only operating costs (software, maintenance) need to be covered – the rest remains as surplus.',
    tooltipKpiAccumulatedCashflow:
      'Sum of all annual pre-tax cashflows over the entire calculation period (20 years). Represents cumulative net revenue after operating costs and debt service.',

    // Tabs
    tab1: '1. Technical Data',
    tab2: '2. Economic Data',
    tab3: '3. Results',

    btnNext: 'Next',

    // Loading
    loading: 'Calculating...',

    // Expert hint banner (Tab 1 + Tab 2)
    infoExpertHint:
      'This tool assumes a basic familiarity with the technical terms used. We recommend consulting official sources:',
    infoExpertLinkLabel: 'Information from the Federal Network Agency',

    // Tab 1: Technical
    tab1Title: 'Technical Configuration',
    sectionPV: 'Photovoltaic System',
    sectionConsumption: 'Building Consumers',

    labelAddress: 'Location / Address',
    placeholderAddress: 'e.g. Berlin, Germany',
    addressCoords: 'Lat: {lat}, Lon: {lon}',
    tooltipAddress:
      'The address is converted into GPS coordinates and used to estimate the annual PV yield. It is not stored.',

    labelPvCapacity: 'PV Capacity (kWp)',
    tooltipPvCapacity:
      'Installed peak power of the PV system in kilowatt-peak. A typical multi-family building has 30–150 kWp.',
    pvInputToggleKwp: 'kWp',
    pvInputToggleSqm: 'm² roof area',
    labelRoofArea: 'Usable Roof Area (m²)',
    tooltipRoofArea:
      'The usable roof area for PV. System capacity is calculated as: (m² ÷ 5) × 0.8 usage factor (based on 200 Wp/m² module power and 80% area utilisation for spacing, shading, etc.).',
    pvCapacityFromArea: 'Calculated capacity: {kwp} kWp',
    roofAreaMapsLink: 'Measure roof area in Google Maps (satellite view)',

    expertModeLabel: 'Expert mode (tilt & orientation)',
    tooltipExpertMode:
      'In standard mode, south orientation (0°) and a tilt of 35° are assumed – typical values for optimal yields in Central Europe. Expert mode lets you customise these values.',
    labelInclination: 'Tilt angle (°)',
    tooltipInclination:
      'Tilt of the PV modules from horizontal. 0° = flat (flat roof), 30–40° = optimal for Central Europe, 90° = vertical (façade).',
    labelAzimuth: 'Orientation (Azimuth)',
    tooltipAzimuth:
      'Cardinal direction the PV modules face. 0° = South (optimal), −90° = East, +90° = West. Deviations from South reduce annual yield.',
    azimuthEast: 'East',
    azimuthSouth: 'South',
    azimuthWest: 'West',
    expertModeDefault: 'Default: South, 35°',

    labelBattery: 'Battery Storage',
    labelBatteryCapacity: 'kWh',
    tooltipBattery:
      'A battery storage significantly increases the self-consumption rate, as surplus PV energy can be stored and used at night. Rule of thumb: 0.5 kWh storage per kWp of PV capacity.',

    labelApartments: 'Apartments',
    tooltipApartments:
      'Number of connected tenant units. More apartments means greater total electricity consumption.',

    labelParticipationRate: 'Participation Rate',
    tooltipParticipationRate:
      'Share of apartments actively participating in the tenant electricity or GGV model. Not all tenants have to join – this rate affects the model-relevant consumption and base fee revenue.',

    labelConsumptionPerApartment: 'Consumption/unit (kWh)',
    tooltipConsumptionPerApartment:
      'Average annual electricity consumption per apartment. Typical: 2,000–3,500 kWh/year for households without heat use.',

    labelHeatPump: 'Heat Pump: Total Electrical Energy Demand (kWh/a)',
    tooltipHeatPump:
      'The electrical energy demand is highly individual and depends on the building, apartment and heat pump size, as well as resident behavior. Reference value: 1,500–5,000 kWh/year per apartment.',

    labelEV: 'E-Mobility (Wallboxes) (kWh/a)',
    labelEVCount: 'Number of wallboxes',
    labelEVConsumptionPerPointKwh: 'annual kWh per charging point',
    tooltipEV:
      'Total annual electricity consumption for electric vehicle charging. Approx. 2,000 kWh/year per vehicle (based on 20 kWh/100 km and an annual mileage of 10,000 km).',

    labelGeneralConsumption: 'Common Area Electricity (kWh/a)',
    tooltipGeneralConsumption:
      'Electricity for shared areas such as stairwells, basement, outdoor lighting, or elevators. Typical: 1,000–5,000 kWh/year depending on building size.',

    // Tab 2: Economic
    tab2Title: 'Economic Parameters',
    sectionModel: 'Select Operating Model',
    modelMieterstrom: 'Classic Tenant Electricity',
    modelGGV: 'GGV (Communal Building Supply)',
    sectionTariffs: 'Earnings & Electricity Tariffs',
    sectionFinancing: 'Costs & Financing',

    labelTenantRate: 'Net Tenant Sales Price (ct)',
    tooltipTenantRate:
      'The ct/kWh price the operator charges tenants for electricity. Must be at least 10% below the local utility tariff. This item is subject to sales tax, so the price is listed as a net amount.',

    labelFeedIn: 'Feed-in Tariff (ct)',
    tooltipFeedIn:
      'Compensation for electricity not consumed in the building. This can be the EEG feed-in tariff, but also direct marketing (PPA) or energy sharing with neighboring buildings. EEG feed-in tariff in 2026: 5–7 ct/kWh, depending on system size.',

    labelBaseFee: 'Metering/Base Fee (€/mo)',
    tooltipBaseFee:
      'Monthly base fee per apartment for metering and billing services. Only applicable in the Tenant Electricity model.',

    labelSubsidy: 'Tenant Electricity Subsidy (ct)',
    tooltipSubsidy:
      'Government subsidy per kWh delivered to tenants (§21 EEG). Regularly adjusted and varies by system size – in 2026: 1.59 ct/kWh – 2.57 ct/kWh.',

    labelGridRate: 'Grid Reference Price (ct/kWh)',
    tooltipGridRate:
      'Local utility tariff as a reference. It must be at least 10% above the tenant sales price. Used in the tool to calculate tenant savings, among other things.',

    labelRoofRent: 'monthly Roof Rent (€)',
    tooltipRoofRent:
      'Monthly rent for roof usage. Prices per sqm or per kWp. Typical values are between 50 ct and €1 per kWp. Since the PV system adds value to the building, some owners provide the roof free of charge.',

    labelCapex: 'CAPEX (€ net)',
    tooltipCapex:
      'Total investment costs of the system (net, excl. VAT). Including modules, inverters, mounting, electrical work, and storage if applicable.',
    capexAutoLabel: 'Price Indication',
    capexCustomLabel: 'Manually set',
    capexResetDefault: 'Reset to default',

    labelOpex: 'OPEX (€/year)',
    tooltipOpex:
      'Annual operating costs: maintenance, insurance, metering, billing, software fees, etc. Typically 1–2% of CAPEX per year.',
    opexAutoLabel: 'Price Indication',
    opexCustomLabel: 'Manually set',
    opexResetDefault: 'Reset to default',

    // Breakdown modal – shared UI
    breakdownOpen: 'Break down',
    breakdownApply: 'Apply',
    breakdownCancel: 'Cancel',
    breakdownTotal: 'Total',
    breakdownHint:
      'Enter the individual cost items. The calculated total will be applied to the input field.',
    breakdownCapexTitle: 'Break down investment costs',
    breakdownOpexTitle: 'Break down operating costs',

    // Breakdown modal – CAPEX items
    breakdownCapexPvSystem: 'PV System incl. Inverter',
    tooltipBreakdownCapexPvSystem:
      'Costs for PV modules, inverters, and direct mounting. Reference: 800–1,200 €/kWp depending on system size.',
    breakdownCapexBattery: 'Battery Storage',
    tooltipBreakdownCapexBattery:
      'Purchase and installation costs for battery storage incl. commissioning. Reference: 700–1,200 €/kWh of storage capacity.',
    breakdownCapexInstallation: 'Installation & Infrastructure',
    tooltipBreakdownCapexInstallation:
      'Electrical installation, metering infrastructure (sub-meters, measurement concept), cable routes, and distribution boards.',
    breakdownCapexConsulting: 'Consulting & Planning',
    tooltipBreakdownCapexConsulting:
      'Planning services, expert reports, legal advice for the tenant electricity or GGV model, and grid connection registration costs.',
    breakdownCapexOther: 'Other Costs',
    tooltipBreakdownCapexOther:
      'Registration fees, permits, contingency reserves for unexpected expenses, or other project-specific items.',

    // Breakdown modal – OPEX items
    breakdownOpexTechManagement: 'Technical Operations',
    tooltipBreakdownOpexTechManagement:
      'Maintenance of the PV system and battery storage, monitoring, remote surveillance, and fault clearance. Reference: 0.5–1% of CAPEX p.a.',
    breakdownOpexBilling: 'Billing & Metering',
    tooltipBreakdownOpexBilling:
      'Meter reading, consumption tracking, and annual billing per apartment. Reference: 5–15 €/meter/month.',
    breakdownOpexAdminManagement: 'Administrative Operations',
    tooltipBreakdownOpexAdminManagement:
      'Administrative overhead, insurance (yield and liability), accounting, and tenant communication.',
    breakdownOpexRoofRent: 'Roof Rent (annual)',
    tooltipBreakdownOpexRoofRent:
      'Annual roof rent: monthly rate × 12. Stored internally as a monthly value in the financial calculation. If the roof is provided free of charge, leave this at 0.',

    labelLoanAmount: 'Loan Amount (€)',
    tooltipLoanAmount:
      'The debt-financed portion of investment costs. The remainder is equity capital to be provided.',

    labelInterestRate: 'Interest Rate (% p.a.)',
    tooltipInterestRate:
      'Annual interest rate of the investment loan. Favorable KfW funding programs are often available for projects like this.',

    labelLoanTerm: 'Credit Term (years)',
    tooltipLoanTerm:
      'Loan repayment period in years. Typically 10–20 years for solar installations.',

    // Tab 3: Results
    tab3Title: 'Results & Analysis',
    chartEnergyTitle: 'Annual Energy Balance',
    chartCashflowTitle: 'Cashflow Development over {years} Years',
    chartTenantSavingsTitle: 'Tenant Savings vs. Grid Supplier (per unit/year)',
    chartTenantSavingsSubtitle:
      'Savings = (Grid reference price − Tenant sales price) × Consumption/unit',
    labelPvYield: 'PV Generation:',
    labelTotalConsumption: 'Total Demand:',
    labelGridExport: 'Grid Export:',
    noData: 'No data available for visualization.',

    // Detail table
    tableTitle: 'Details for Year {year}',
    tablePosition: 'Position',
    tableAmount: 'Amount (€)',
    tableRevenue: 'Revenue (Total)',
    tableMieterstrom: '- Tenant Electricity',
    tableBaseFee: '- Base Fee',
    tableSubsidy: '- Tenant Elec. Subsidy',
    tableFeedIn: '- Feed-in Revenue',
    tableOpex: 'Operating Costs (OPEX)',
    tableAnnuity: 'Loan Installment (Total)',
    tableInterest: '- Interest',
    tablePrincipal: '- Principal Repayment',
    tableCashflow: 'Pre-tax Cashflow',
    tableDepreciation: 'Depreciation (AfA)',
    tableDepreciationLinear: 'Linear',
    tableDepreciationDegressive: 'Declining balance',
    tableDepreciationNote: 'non-cash item',

    // Tooltip model hint
    tooltipModelMieterstrom:
      'In tenant electricity, the landlord/operator takes over the entire energy supply. This consists of PV electricity plus externally purchased residual electricity for times when PV and storage provide no energy. The operator receives a base fee in addition to the per-unit price. The tariff must remain below the local utility rate.',
    tooltipModelGGV:
      'With communal building supply (GGV), tenants receive PV electricity as an add-on. During times without PV generation, they continue to draw electricity from their existing supply contract. The operator receives the agreed per-unit price for each kWh sold.',

    // Tab 3 Optimization
    sectionOptimize: 'Optimization Controls',
    optimizeDescription:
      'The three key levers for the business case – changes take effect immediately on all metrics.',
    labelOptTenantRate: 'Tenant Sales Price',
    labelOptBattery: 'Battery Storage',
    labelOptParticipation: 'Participation Rate',
    noBattery: 'No storage',
    tooltipOptTenantRate:
      'The sales price is the strongest revenue lever: every extra cent multiplies across the total electricity sold. It must remain at least 10% below the local utility tariff.',
    tooltipOptBattery:
      'A larger battery increases self-consumption and therefore the volume of tenant electricity sold — but also affects CAPEX. Check whether the additional revenue justifies the extra investment.',
    tooltipOptParticipation:
      'The higher the participation rate, the more tenants draw electricity from the system — increasing base fee and tenant electricity revenues. In practice, 100% participation is rarely achieved.',

    // Tab 3: Monthly energy flows
    monthlyFlowTitle: 'Monthly Energy Flows',
    monthlyFlowSubtitle:
      'Daily balance: PV yield vs. demand – scaled to monthly totals. Green/Yellow/Blue = PV usage; Red = grid supply.',
    monthlyFlowDirectConsumption: 'Direct self-consumption',
    monthlyFlowBatteryCharge: 'Battery charge',
    monthlyFlowGridExport: 'Grid export',
    monthlyFlowGridSupply: 'Grid supply',
    monthlyFlowTableMonth: 'Month',
    monthlyFlowTablePvYield: 'PV yield',
    monthlyFlowTableDailyPv: 'PV/day',
    monthlyFlowTableDailyNeed: 'Need/day',
    monthlyFlowTableSelfConsumption: 'Direct self-cons.',
    monthlyFlowTableBattery: 'Battery charge',
    monthlyFlowTableGridExport: 'Grid export',
    monthlyFlowTableGridSupply: 'Grid supply',
    monthlyFlowNoData: 'Monthly energy flows will be shown after the first calculation.',
    btnMonthlyDetail: 'Show monthly details',
    cashflowRevenue: 'Revenue p.a.',
    cashflowOpex: 'Operating costs (OPEX)',
    cashflowInterest: 'Interest',
    cashflowPrincipal: 'Principal',
    energyMixPv: 'PV generation',
    energyMixBattery: 'Battery discharge',
    energyMixGrid: 'Grid supply',
    energyMixTooltipLabel: 'Energy',
    tenantSavingsLabel: 'Savings p.a.',
    tenantSavingsTooltip: 'Savings p.a.',
    scenarioMinus50: '-50%',
    scenarioBase: 'Base',
    scenarioPlus50: '+50%',

    // PDF Export
    btnExportPdf: 'Export PDF (beta)',
    pdfExporting: 'Generating PDF…',

    // JSON Export / Import
    btnExportJson: 'Export configuration',
    btnImportJson: 'Import configuration',
    jsonImportErrorInvalidJson:
      'The file could not be read. Please make sure it is a valid JSON file.',
    jsonImportErrorWrongAppId:
      'The uploaded file does not belong to this tool and cannot be imported.',
    jsonImportSuccess: 'Configuration imported successfully.',

    // Tutorial
    tutorialWelcomeTitle: 'Welcome to Immo PV Planner!',
    tutorialWelcomeText: 'Would you like a quick introduction to the key features?',
    tutorialBtnStart: 'Start Tour',
    tutorialBtnSkip: 'Skip Tour',
    tutorialBtnRestart: 'Restart Tour',
    supportBtnLabel: 'Feedback & Support',
    tutorialLocaleBack: 'Back',
    tutorialLocaleClose: 'Close',
    tutorialLocaleLast: 'Done',
    tutorialLocaleNext: 'Next',
    tutorialLocaleOpen: 'Open tour',
    tutorialLocaleSkip: 'Skip',

    tutorialStep1Title: 'Enter Location',
    tutorialStep1Content:
      'Enter the building address here. GPS coordinates are automatically determined and used for the PVGIS simulation of the annual PV yield.',
    tutorialStep2Title: 'Configure Battery Storage',
    tutorialStep2Content:
      'Enable battery storage and adjust the capacity. Default values are pre-filled. Rule of thumb: 0.5 kWh storage per kWp of PV capacity.',
    tutorialStep3Title: 'Use Info Tooltips',
    tutorialStep3Content:
      'These small (i) icons explain each parameter in detail. Hover over them to get more information.',
    tutorialStep4Title: 'Continue to Next Section',
    tutorialStep4Content:
      'Use the Next button to move to the next tab. All inputs are recalculated immediately. You can also switch freely between sections at any time.',
    tutorialStep5Title: 'Free Navigation Between Sections',
    tutorialStep5Content:
      'Use the left sidebar to switch directly between the three sections at any time: Technical Data, Economic Data, and Results.',
    tutorialStep6Title: 'Results & Analysis',
    tutorialStep6Content:
      'See all results at a glance: energy mix, cashflow development, tenant savings, and monthly energy flows. All charts update automatically with every input change.',
    tutorialStep7Title: 'Project KPIs at a Glance',
    tutorialStep7Content:
      'The KPI bar permanently shows the six key metrics: PV yield, autarky rate, self-consumption rate, LCOE, amortization period, and cumulative revenue over 20 years.',
  },
} as const;

export type Translations = typeof translations.de;

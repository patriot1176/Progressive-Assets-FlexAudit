export type OperatingMode = 'conservative' | 'typical' | 'aggressive';

export interface AuditInputs {
  presses: number;
  changeoversPerPressPerDay: number;
  setupMinutesPerChangeover: number;
  shiftsPerDay: number;
  hoursPerShift: number;
  operatingDaysPerYear: number;
  pressSpeedFPM: number | null;
  pricePerFoot: number | null;
  laborRate: number | null;
  reductionPct: number;
}

export interface AuditResults {
  totalChangeoversPerDay: number;
  setupMinutesPerDay: number;
  setupHoursPerDay: number;
  setupHoursPerYear: number;
  availableHoursPerYearPerPress: number;
  totalAvailablePlantPressHoursPerYear: number;
  pctPressTimeLostToSetup: number;
  fteEquivalent: number;
  pressEquivalentLost: number;
  annualSetupLaborCost: number | null;
  recoveredHours: number;
  recoveredLinearFeet: number | null;
  potentialRevenueCapacity: number | null;
}

export const DEFAULT_INPUTS: AuditInputs = {
  presses: 5,
  changeoversPerPressPerDay: 8,
  setupMinutesPerChangeover: 55,
  shiftsPerDay: 2,
  hoursPerShift: 10,
  operatingDaysPerYear: 250,
  pressSpeedFPM: 200,
  pricePerFoot: 0.05,
  laborRate: 30,
  reductionPct: 50,
};

export function getModePresets(mode: OperatingMode): { setupMultiplier: number; reductionPct: number } {
  switch (mode) {
    case 'conservative': return { setupMultiplier: 1.20, reductionPct: 30 };
    case 'typical': return { setupMultiplier: 1.0, reductionPct: 40 };
    case 'aggressive': return { setupMultiplier: 0.85, reductionPct: 50 };
  }
}

export function calculate(inputs: AuditInputs, mode: OperatingMode): AuditResults {
  const { setupMultiplier } = getModePresets(mode);
  const effectiveSetupTime = inputs.setupMinutesPerChangeover * setupMultiplier;

  const totalChangeoversPerDay = inputs.presses * inputs.changeoversPerPressPerDay;
  const setupMinutesPerDay = totalChangeoversPerDay * effectiveSetupTime;
  const setupHoursPerDay = setupMinutesPerDay / 60;
  const setupHoursPerYear = setupHoursPerDay * inputs.operatingDaysPerYear;

  const availableHoursPerYearPerPress = inputs.shiftsPerDay * inputs.hoursPerShift * inputs.operatingDaysPerYear;
  const totalAvailablePlantPressHoursPerYear = availableHoursPerYearPerPress * inputs.presses;
  const pctPressTimeLostToSetup = totalAvailablePlantPressHoursPerYear > 0
    ? setupHoursPerYear / totalAvailablePlantPressHoursPerYear
    : 0;

  const fteEquivalent = setupHoursPerYear / 2000;
  const pressEquivalentLost = setupHoursPerYear / 6500;

  const annualSetupLaborCost = inputs.laborRate !== null ? setupHoursPerYear * inputs.laborRate : null;

  const recoveredHours = setupHoursPerYear * (inputs.reductionPct / 100);

  const recoveredLinearFeet = inputs.pressSpeedFPM !== null
    ? recoveredHours * 60 * inputs.pressSpeedFPM
    : null;

  const potentialRevenueCapacity = recoveredLinearFeet !== null && inputs.pricePerFoot !== null
    ? recoveredLinearFeet * inputs.pricePerFoot
    : null;

  return {
    totalChangeoversPerDay,
    setupMinutesPerDay,
    setupHoursPerDay,
    setupHoursPerYear,
    availableHoursPerYearPerPress,
    totalAvailablePlantPressHoursPerYear,
    pctPressTimeLostToSetup,
    fteEquivalent,
    pressEquivalentLost,
    annualSetupLaborCost,
    recoveredHours,
    recoveredLinearFeet,
    potentialRevenueCapacity,
  };
}

export type BenchmarkBand = 'below-typical' | 'typical' | 'above-typical';

export interface BenchmarkMetric {
  label: string;
  value: string;
  band: BenchmarkBand;
}

export interface BenchmarkResult {
  metrics: BenchmarkMetric[];
  overall: BenchmarkBand;
}

export function getBenchmarks(inputs: AuditInputs, results: AuditResults): BenchmarkResult {
  const pctLost = results.pctPressTimeLostToSetup * 100;
  const setupHoursPerPress = results.setupHoursPerYear / inputs.presses;
  const changeoversPerDay = inputs.changeoversPerPressPerDay;

  const pctBand: BenchmarkBand = pctLost < 20 ? 'below-typical' : pctLost <= 35 ? 'typical' : 'above-typical';
  const hoursBand: BenchmarkBand = setupHoursPerPress < 900 ? 'below-typical' : setupHoursPerPress <= 1500 ? 'typical' : 'above-typical';
  const changeoverBand: BenchmarkBand = changeoversPerDay < 4 ? 'below-typical' : changeoversPerDay <= 8 ? 'typical' : 'above-typical';

  const metrics: BenchmarkMetric[] = [
    { label: '% Press Time Lost', value: `${pctLost.toFixed(1)}%`, band: pctBand },
    { label: 'Setup Hours Lost / Press / Year', value: formatNumber(Math.round(setupHoursPerPress)), band: hoursBand },
    { label: 'Changeovers / Press / Day', value: String(changeoversPerDay), band: changeoverBand },
  ];

  const bands = [pctBand, hoursBand, changeoverBand];
  const overall: BenchmarkBand = bands.includes('above-typical') ? 'above-typical' : bands.includes('typical') ? 'typical' : 'below-typical';

  return { metrics, overall };
}

export function bandLabel(band: BenchmarkBand): string {
  switch (band) {
    case 'below-typical': return 'Below Typical';
    case 'typical': return 'Typical';
    case 'above-typical': return 'Above Typical';
  }
}

export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatCurrency(n: number): string {
  if (n >= 1000000) {
    return '$' + (n / 1000000).toFixed(2) + 'M';
  }
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatPercent(n: number, decimals = 1): string {
  return (n * 100).toFixed(decimals) + '%';
}

export function encodeInputsToParams(inputs: AuditInputs, mode: OperatingMode): string {
  const params = new URLSearchParams();
  params.set('p', String(inputs.presses));
  params.set('c', String(inputs.changeoversPerPressPerDay));
  params.set('s', String(inputs.setupMinutesPerChangeover));
  params.set('sh', String(inputs.shiftsPerDay));
  params.set('h', String(inputs.hoursPerShift));
  params.set('d', String(inputs.operatingDaysPerYear));
  params.set('r', String(inputs.reductionPct));
  params.set('m', mode);
  if (inputs.pressSpeedFPM !== null) params.set('spd', String(inputs.pressSpeedFPM));
  if (inputs.pricePerFoot !== null) params.set('prc', String(inputs.pricePerFoot));
  if (inputs.laborRate !== null) params.set('lr', String(inputs.laborRate));
  return params.toString();
}

export function decodeParamsToInputs(search: string): { inputs: Partial<AuditInputs>; mode?: OperatingMode } | null {
  const params = new URLSearchParams(search);
  if (!params.has('p')) return null;

  const result: Partial<AuditInputs> = {};
  if (params.has('p')) result.presses = Number(params.get('p'));
  if (params.has('c')) result.changeoversPerPressPerDay = Number(params.get('c'));
  if (params.has('s')) result.setupMinutesPerChangeover = Number(params.get('s'));
  if (params.has('sh')) result.shiftsPerDay = Number(params.get('sh'));
  if (params.has('h')) result.hoursPerShift = Number(params.get('h'));
  if (params.has('d')) result.operatingDaysPerYear = Number(params.get('d'));
  if (params.has('r')) result.reductionPct = Number(params.get('r'));
  if (params.has('spd')) result.pressSpeedFPM = Number(params.get('spd'));
  if (params.has('prc')) result.pricePerFoot = Number(params.get('prc'));
  if (params.has('lr')) result.laborRate = Number(params.get('lr'));

  const mode = params.get('m') as OperatingMode | null;
  return { inputs: result, mode: mode ?? undefined };
}

export function generateWhatThisMeans(inputs: AuditInputs, results: AuditResults): string {
  const hiddenPressCapacity = results.pctPressTimeLostToSetup * inputs.presses;
  let text = `This plant is losing ${formatNumber(results.setupHoursPerYear)} press hours per year to setup activities (~${formatPercent(results.pctPressTimeLostToSetup)} of available press time), equivalent to roughly ${formatNumber(hiddenPressCapacity, 1)} presses worth of plant capacity currently consumed by setup activity and approximately ${formatNumber(results.fteEquivalent, 1)} FTEs.`;
  text += ` At ${inputs.reductionPct}% setup reduction, the plant could recover ${formatNumber(results.recoveredHours)} hours/year`;
  if (results.recoveredLinearFeet !== null) {
    text += `, unlocking ${formatNumber(results.recoveredLinearFeet)} feet`;
  }
  if (results.potentialRevenueCapacity !== null) {
    text += ` and approximately ${formatCurrency(results.potentialRevenueCapacity)} of potential production revenue capacity`;
  }
  text += '.';
  return text;
}

export function generateSummaryText(inputs: AuditInputs, results: AuditResults): string {
  let text = `FLEXO SETUP TAX \u2014 CAPACITY AUDIT SUMMARY\n`;
  text += `==========================================\n\n`;
  text += `Annual Setup Hours Lost: ${formatNumber(results.setupHoursPerYear)}\n`;
  text += `% Press Time Lost to Setup: ${formatPercent(results.pctPressTimeLostToSetup)}\n`;
  text += `Equivalent Press Capacity Lost: ${formatNumber(results.pressEquivalentLost, 1)} presses\n`;
  text += `FTE Equivalent: ${formatNumber(results.fteEquivalent, 1)}\n`;
  if (results.annualSetupLaborCost !== null) {
    text += `Annual Setup Labor Cost: ${formatCurrency(results.annualSetupLaborCost)}\n`;
  }
  text += `\nSCENARIO: ${inputs.reductionPct}% Setup Reduction\n`;
  text += `Recovered Hours: ${formatNumber(results.recoveredHours)}\n`;
  if (results.recoveredLinearFeet !== null) {
    text += `Recovered Linear Feet: ${formatNumber(results.recoveredLinearFeet)}\n`;
  }
  if (results.potentialRevenueCapacity !== null) {
    text += `Potential Production Revenue Capacity: ${formatCurrency(results.potentialRevenueCapacity)}\n`;
  }
  text += `\n${generateWhatThisMeans(inputs, results)}`;
  return text;
}

export function generateFollowUpEmail(inputs: AuditInputs, results: AuditResults): string {
  let email = `Subject: Flexo Setup Time \u2014 Capacity Audit Results\n\n`;
  email += `Hi,\n\n`;
  email += `Following up on our discussion about setup efficiency. I ran a quick capacity audit on your flexo operation and wanted to share the findings:\n\n`;
  email += `Key Findings:\n`;
  email += `\u2022 Annual setup hours lost: ${formatNumber(results.setupHoursPerYear)} hrs/year\n`;
  email += `\u2022 Press time consumed by setup: ${formatPercent(results.pctPressTimeLostToSetup)}\n`;
  email += `\u2022 Equivalent press capacity lost: ${formatNumber(results.pressEquivalentLost, 1)} presses\n`;
  email += `\u2022 FTE equivalent tied up in setup: ${formatNumber(results.fteEquivalent, 1)}\n`;
  if (results.annualSetupLaborCost !== null) {
    email += `\u2022 Annual setup labor cost: ${formatCurrency(results.annualSetupLaborCost)}\n`;
  }
  email += `\nScenario \u2014 ${inputs.reductionPct}% Setup Reduction:\n`;
  email += `\u2022 Recovered hours: ${formatNumber(results.recoveredHours)} hrs/year\n`;
  if (results.recoveredLinearFeet !== null) {
    email += `\u2022 Recovered linear feet: ${formatNumber(results.recoveredLinearFeet)}\n`;
  }
  if (results.potentialRevenueCapacity !== null) {
    email += `\u2022 Potential production revenue capacity: ${formatCurrency(results.potentialRevenueCapacity)}\n`;
  }
  email += `\nWould it make sense to schedule 30 minutes to walk through these numbers together and discuss what a realistic improvement path could look like for your operation?\n\n`;
  email += `Best regards`;
  return email;
}

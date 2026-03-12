import { type RefObject } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, Link2, FileDown, RotateCcw, Check, ChevronDown, Save } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { BenchmarkPanel } from "@/components/benchmark-panel";
import { type PlateCostData } from "@/components/plate-cost-analysis";
import {
  type AuditInputs,
  type AuditResults,
  type OperatingMode,
  formatNumber,
  formatCurrency,
  formatPercent,
  generateWhatThisMeans,
  generateSummaryText,
  encodeInputsToParams,
  getBenchmarks,
  bandLabel,
} from "@/lib/calculations";

interface Props {
  inputs: AuditInputs;
  results: AuditResults;
  mode: OperatingMode;
  onStartOver: () => void;
  snapshotRef: RefObject<HTMLDivElement | null>;
  showBenchmark: boolean;
  plateCostData?: PlateCostData | null;
  onSwitchTab?: (tab: string) => void;
}

function CopyButton({ label, textFn, icon: Icon, testId }: {
  label: string;
  textFn: () => string;
  icon: typeof Copy;
  testId: string;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const text = textFn();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    toast({ title: `${label} copied to clipboard` });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="secondary" onClick={handleCopy} data-testid={testId} className="justify-start">
      {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Icon className="w-4 h-4 mr-2" />}
      {copied ? 'Copied!' : label}
    </Button>
  );
}

function AssumptionsSection({ showMaterialWaste }: { showMaterialWaste: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-0">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
            className="flex items-center justify-between w-full p-5 sm:p-6 cursor-pointer"
            data-testid="btn-assumptions-toggle"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assumptions Used</h3>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
              <ul className="space-y-2.5 text-sm text-foreground/80 list-disc pl-4" data-testid="list-assumptions">
                <li>FTE equivalent assumes 2,000 working hours per employee per year</li>
                <li>Press capacity benchmark assumes ~6,500 operating hours per press per year</li>
                <li>Potential production revenue capacity reflects production potential at the current $/ft input (not guaranteed sales)</li>
                {showMaterialWaste && (
                  <li>Setup material waste is modeled as setup waste length × web width × material cost per MSI × annual changeovers.</li>
                )}
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function PerformanceScoreCard({ results }: { results: AuditResults }) {
  const pctLost = results.pctPressTimeLostToSetup * 100;
  const score = Math.max(0, Math.min(100, Math.round(100 - pctLost)));

  let band: { label: string; color: string; barColor: string };
  if (score >= 80) {
    band = { label: 'Best Practice Range', color: 'text-emerald-700 dark:text-emerald-400', barColor: 'bg-emerald-500' };
  } else if (score >= 60) {
    band = { label: 'Typical Performance', color: 'text-amber-600 dark:text-amber-400', barColor: 'bg-amber-500' };
  } else if (score >= 40) {
    band = { label: 'Needs Improvement', color: 'text-orange-600 dark:text-orange-400', barColor: 'bg-orange-500' };
  } else {
    band = { label: 'Critical Performance', color: 'text-red-700 dark:text-red-400', barColor: 'bg-red-500' };
  }

  return (
    <Card data-testid="card-performance-score">
      <CardContent className="p-5 sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plant Performance Score</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">Operational Setup Efficiency Rating</p>

        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-4xl font-bold tracking-tight" data-testid="text-score-value">{score}</span>
          <span className="text-lg text-muted-foreground font-medium">/ 100</span>
        </div>

        <div className="relative w-full h-3 rounded-full bg-muted overflow-hidden mb-2">
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", band.barColor)}
            style={{ width: `${score}%` }}
            data-testid="bar-performance-score"
          />
          <div className="absolute inset-0 flex">
            <div className="w-[40%] border-r border-background/50" />
            <div className="w-[20%] border-r border-background/50" />
            <div className="w-[20%] border-r border-background/50" />
            <div className="w-[20%]" />
          </div>
        </div>

        <div className="flex justify-between text-[9px] text-muted-foreground mb-3">
          <span>Critical Performance</span>
          <span>Needs Improvement</span>
          <span>Typical Performance</span>
          <span>Best Practice Range</span>
        </div>

        <p className={cn("text-sm font-semibold mb-3", band.color)} data-testid="text-score-band">{band.label}</p>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          This score represents the percentage of total press capacity not consumed by setup activities. Higher scores indicate more efficient setup performance and greater available production capacity.
        </p>
      </CardContent>
    </Card>
  );
}

function InputsUsedCard({ inputs, mode }: { inputs: AuditInputs; mode: OperatingMode }) {
  const modeLabel = mode === 'conservative' ? 'Conservative' : mode === 'typical' ? 'Typical' : 'Aggressive';

  const fields: { label: string; value: string }[] = [
    { label: 'Operating Mode', value: modeLabel },
    { label: 'Presses', value: String(inputs.presses) },
    { label: 'Changeovers/Press/Day', value: String(inputs.changeoversPerPressPerDay) },
    { label: 'Setup Min/Changeover', value: String(inputs.setupMinutesPerChangeover) },
    { label: 'Shifts/Day', value: String(inputs.shiftsPerDay) },
    { label: 'Hours/Shift', value: String(inputs.hoursPerShift) },
    { label: 'Days/Year', value: String(inputs.operatingDaysPerYear) },
    { label: 'Setup Reduction', value: `${inputs.reductionPct}%` },
    { label: 'Annual Changeovers Modeled', value: `${formatNumber(inputs.presses * inputs.changeoversPerPressPerDay * inputs.operatingDaysPerYear)} / year` },
  ];

  if (inputs.pressSpeedFPM !== null) {
    fields.push({ label: 'Avg Speed (ft/min)', value: String(inputs.pressSpeedFPM) });
  }
  if (inputs.pricePerFoot !== null) {
    fields.push({ label: 'Avg Selling Price ($/ft)', value: String(inputs.pricePerFoot) });
  }
  if (inputs.laborRate !== null) {
    fields.push({ label: 'Labor Rate ($/hr)', value: String(inputs.laborRate) });
  }
  if (inputs.setupWasteFt !== null) {
    fields.push({ label: 'Setup Waste (ft/chg)', value: String(inputs.setupWasteFt) });
  }
  if (inputs.avgWebWidthIn !== null) {
    fields.push({ label: 'Avg Web Width (in)', value: String(inputs.avgWebWidthIn) });
  }
  if (inputs.materialCostPerMSI !== null) {
    fields.push({ label: 'Material Cost ($/MSI)', value: `$${inputs.materialCostPerMSI}` });
  }

  return (
    <Card data-testid="card-inputs-used">
      <CardContent className="p-5 sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Inputs Used (Audit Trail)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2.5">
          {fields.map((f, i) => (
            <div key={i} data-testid={`input-trail-${i}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">{f.label}</p>
              <p className="text-sm font-semibold mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PressFleetEquivalents({ inputs, results }: { inputs: AuditInputs; results: AuditResults }) {
  const installed = inputs.presses;
  const effectiveToday = inputs.presses * (1 - results.pctPressTimeLostToSetup);
  const totalAvailable = results.totalAvailablePlantPressHoursPerYear;
  const recoveredPressEquiv = totalAvailable > 0 ? (results.recoveredHours / totalAvailable) * inputs.presses : 0;
  const effectiveAfter = Math.min(effectiveToday + recoveredPressEquiv, installed);

  const rows = [
    { label: 'Installed Presses', value: formatNumber(installed, 0), pct: 100 },
    { label: 'Effective Presses Today', value: formatNumber(effectiveToday, 1), pct: installed > 0 ? (effectiveToday / installed) * 100 : 0 },
    { label: `Effective Presses After Improvement (${inputs.reductionPct}% Reduction)`, value: formatNumber(effectiveAfter, 1), pct: installed > 0 ? Math.min((effectiveAfter / installed) * 100, 100) : 0 },
  ];

  return (
    <Card data-testid="card-press-fleet">
      <CardContent className="p-5 sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Press Fleet Equivalents</h3>
        <div className="space-y-4">
          {rows.map((row, i) => (
            <div key={i} data-testid={`fleet-row-${i}`}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-sm font-semibold">{row.value} <span className="text-xs font-normal text-muted-foreground">presses</span></span>
              </div>
              <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    i === 0 ? "bg-slate-400" : i === 1 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.max(row.pct, 1)}%` }}
                  data-testid={`fleet-bar-${i}`}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
          Effective presses translate setup loss and modeled recovery into press-equivalent capacity.
        </p>
      </CardContent>
    </Card>
  );
}

function PressCapacityUtilizationBar({ results }: { results: AuditResults }) {
  const totalHours = results.totalAvailablePlantPressHoursPerYear;
  const setupHours = results.setupHoursPerYear;
  const productiveHours = Math.max(totalHours - setupHours, 0);
  const setupPct = totalHours > 0 ? (setupHours / totalHours) * 100 : 0;
  const productivePct = totalHours > 0 ? (productiveHours / totalHours) * 100 : 0;

  return (
    <Card data-testid="card-capacity-utilization">
      <CardContent className="p-5 sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Press Capacity Utilization (Annual)</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">Share of Total Available Press Hours</p>

        <div className="w-full h-8 rounded-md overflow-hidden flex" data-testid="bar-capacity-utilization">
          <div
            className="bg-red-500/80 flex items-center justify-center transition-all duration-500"
            style={{ width: `${Math.max(setupPct, 2)}%` }}
          >
            {setupPct >= 10 && <span className="text-[10px] font-semibold text-white">{setupPct.toFixed(1)}%</span>}
          </div>
          <div
            className="bg-emerald-500/80 flex items-center justify-center transition-all duration-500"
            style={{ width: `${Math.max(productivePct, 2)}%` }}
          >
            {productivePct >= 10 && <span className="text-[10px] font-semibold text-white">{productivePct.toFixed(1)}%</span>}
          </div>
        </div>

        <div className="flex justify-between mt-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500/80 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground leading-tight">Setup Time</p>
              <p className="text-sm font-semibold">{formatNumber(setupHours)} hrs <span className="font-normal text-muted-foreground">({setupPct.toFixed(1)}%)</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/80 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground leading-tight">Remaining Productive Time</p>
              <p className="text-sm font-semibold">{formatNumber(productiveHours)} hrs <span className="font-normal text-muted-foreground">({productivePct.toFixed(1)}%)</span></p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BenchmarkInterpretation() {
  return (
    <Card data-testid="card-benchmark-interpretation">
      <CardContent className="p-5 sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Benchmark Interpretation</h3>
        <p className="text-sm text-foreground/80 mb-3">
          These benchmark indicators compare your results to typical flexographic printing operations with similar press configurations.
        </p>
        <div className="space-y-2.5">
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Above Typical</p>
            <p className="text-[12px] text-foreground/70 leading-relaxed">Indicates performance that is worse than typical industry ranges, such as higher setup time, higher setup frequency, or greater press capacity lost to changeovers than most plants.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Typical</p>
            <p className="text-[12px] text-foreground/70 leading-relaxed">Indicates performance within normal industry operating ranges.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Below Typical</p>
            <p className="text-[12px] text-foreground/70 leading-relaxed">Indicates performance that is better than typical industry ranges, such as fewer changeovers or lower setup-related capacity loss.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const todayISO = new Date().toISOString().split('T')[0];

export function AuditSnapshotSection({ inputs, results, mode, onStartOver, snapshotRef, showBenchmark, plateCostData, onSwitchTab }: Props) {
  const { toast } = useToast();

  const [saveCompanyName, setSaveCompanyName] = useState('');
  const [saveContactName, setSaveContactName] = useState('');
  const [saveAuditDate, setSaveAuditDate] = useState(todayISO);
  const [saveNotes, setSaveNotes] = useState('');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveAudit = () => {
    if (!saveCompanyName.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter a company name before saving' });
      return;
    }
    const timestamp = Date.now();
    const key = `audit:${timestamp}`;
    const data = {
      timestamp,
      companyName: saveCompanyName.trim(),
      contactName: saveContactName.trim(),
      auditDate: saveAuditDate,
      notes: saveNotes.trim(),
      mode,
      inputs,
      setupHoursPerYear: results.setupHoursPerYear,
      totalSetupCost: results.totalSetupCost,
    };
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setSaveMessage({ type: 'success', text: `Audit saved for ${saveCompanyName.trim()} on ${saveAuditDate}` });
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save audit. Storage may be full.' });
    }
  };

  const totalAnnualRevenue = inputs.pressSpeedFPM !== null && inputs.pricePerFoot !== null
    ? results.totalAvailablePlantPressHoursPerYear * 60 * inputs.pressSpeedFPM * inputs.pricePerFoot
    : null;
  const plateCostPctOfTotalRevenue = results.annualPlateCost !== null && totalAnnualRevenue !== null && totalAnnualRevenue > 0
    ? (results.annualPlateCost / totalAnnualRevenue) * 100
    : null;

  const handleShareLink = async () => {
    const params = encodeInputsToParams(inputs, mode);
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    toast({ title: 'Share link copied to clipboard' });
  };

  const handleExportPDF = () => {
    const hiddenPC = results.pctPressTimeLostToSetup * inputs.presses;
    const totalHours = results.totalAvailablePlantPressHoursPerYear;
    const setupHours = results.setupHoursPerYear;
    const productiveHours = Math.max(totalHours - setupHours, 0);
    const setupPctVal = totalHours > 0 ? (setupHours / totalHours) * 100 : 0;
    const productivePctVal = 100 - setupPctVal;

    const modeLabel = mode === 'conservative' ? 'Conservative' : mode === 'typical' ? 'Typical' : 'Aggressive';

    const pctLost = results.pctPressTimeLostToSetup * 100;
    const perfScore = Math.max(0, Math.min(100, Math.round(100 - pctLost)));
    let perfLabel: string;
    let perfColor: string;
    if (perfScore >= 80) { perfLabel = 'Best Practice Range'; perfColor = '#16a34a'; }
    else if (perfScore >= 60) { perfLabel = 'Typical Performance'; perfColor = '#d97706'; }
    else if (perfScore >= 40) { perfLabel = 'Needs Improvement'; perfColor = '#ea580c'; }
    else { perfLabel = 'Critical Performance'; perfColor = '#dc2626'; }

    const installed = inputs.presses;
    const effectiveToday = inputs.presses * (1 - results.pctPressTimeLostToSetup);
    const recoveredPressEquiv = totalHours > 0 ? (results.recoveredHours / totalHours) * inputs.presses : 0;
    const effectiveAfter = Math.min(effectiveToday + recoveredPressEquiv, installed);
    const todayPct = installed > 0 ? (effectiveToday / installed) * 100 : 0;
    const afterPct = installed > 0 ? Math.min((effectiveAfter / installed) * 100, 100) : 0;

    const benchmarks = getBenchmarks(inputs, results);
    const bandColor = (b: string) => b === 'below-typical' ? '#16a34a' : b === 'typical' ? '#d97706' : '#dc2626';

    let narrativeP2 = `At the modeled improvement scenario of ${inputs.reductionPct}% setup reduction, the plant could recover approximately ${formatNumber(results.recoveredHours)} press hours annually.`;
    if (results.recoveredLinearFeet !== null) {
      narrativeP2 += ` This recovered capacity could unlock roughly ${formatNumber(results.recoveredLinearFeet)} additional linear feet of recoverable production capacity.`;
    }
    if (results.potentialRevenueCapacity !== null) {
      narrativeP2 += ` At the current selling price, the unused capacity caused by setup activity represents approximately ${formatCurrency(results.potentialRevenueCapacity)} in unrealized annual production revenue.`;
    }
    let narrativeP3 = '';
    if (results.totalSetupImpact !== null) {
      narrativeP3 = `Combined, these factors represent an estimated total operational impact of approximately ${formatCurrency(results.totalSetupImpact)} annually when both direct setup costs and unrealized production value are considered.`;
    } else {
      narrativeP3 = 'These results illustrate the operational impact of setup efficiency on plant throughput and highlight the potential value of reducing changeover time.';
    }

    let keyFindings = `<li>Setup activities currently consume <strong>${formatPercent(results.pctPressTimeLostToSetup)}</strong> of total available press time.</li>`;
    keyFindings += `<li>This represents the equivalent capacity of approximately <strong>${formatNumber(hiddenPC, 1)}</strong> presses currently consumed by setup activity.</li>`;
    keyFindings += `<li>The current setup environment represents approximately <strong>${results.potentialRevenueCapacity !== null ? formatCurrency(results.potentialRevenueCapacity) : 'N/A'}</strong> in unrealized annual production revenue due to lost press capacity.</li>`;
    if (results.annualSetupMaterialWasteCost !== null && results.wasteCostPerSetup !== null) {
      keyFindings += `<li>Modeled setup material waste is approximately <strong>${formatCurrency(results.annualSetupMaterialWasteCost)}</strong> per year (≈ <strong>${formatCurrency(results.wasteCostPerSetup)}</strong> per changeover based on setup waste length, press web width, and material cost per MSI).</li>`;
    }
    if (results.annualPlateCost !== null && results.plateCostPerChangeover !== null && inputs.avgPlateCostPerColor !== null && inputs.avgPlateCostPerColor > 0 && ((inputs.avgColorsPerJob ?? 0) > 0 || (inputs.avgPlatesChangedPerCopyChange ?? 0) > 0)) {
      keyFindings += `<li>Annual plate cost is approximately <strong>${formatCurrency(results.annualPlateCost)}</strong> per year (= <strong>${formatCurrency(results.plateCostPerChangeover)}</strong> per changeover), based on <strong>$${inputs.avgPlateCostPerColor}</strong>/color across full plate set changeovers (<strong>${inputs.avgColorsPerJob ?? 0}</strong> colors, <strong>${inputs.pctJobsRequiringNewPlates ?? 0}%</strong> of changeovers) and copy change only changeovers (<strong>${inputs.avgPlatesChangedPerCopyChange ?? 0}</strong> plates, <strong>${inputs.pctJobsWithCopyChangesOnly ?? 0}%</strong> of changeovers).</li>`;
    }

    const html = `<!DOCTYPE html>
<html><head><title>Flexo Setup Tax — Plant Capacity Audit</title>
<style>
  @page { size: letter; margin: 0.6in 0.65in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; font-size: 9.5px; line-height: 1.45; max-width: 7.2in; margin: 0 auto; overflow-wrap: break-word; word-wrap: break-word; }
  .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 14px; }
  .header h1 { font-size: 15px; font-weight: 700; letter-spacing: -0.3px; }
  .header h2 { font-size: 10px; font-weight: 600; color: #555; margin-top: 2px; }
  .section { margin-bottom: 14px; page-break-inside: avoid; }
  .section-title { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 8px; }
  .score-bar-container { position: relative; height: 12px; background: #e5e7eb; border-radius: 6px; overflow: hidden; margin: 6px 0; }
  .score-bar-fill { position: absolute; top: 0; left: 0; height: 100%; border-radius: 6px; }
  .score-labels { display: flex; justify-content: space-between; font-size: 7.5px; color: #999; }
  .inputs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px 12px; }
  .input-item { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid #f0f0f0; }
  .input-item .lbl { color: #555; font-size: 8.5px; }
  .input-item .val { font-weight: 600; font-size: 8.5px; text-align: right; white-space: nowrap; }
  .narrative { font-size: 9.5px; line-height: 1.55; color: #333; margin-bottom: 5px; }
  .findings-list { font-size: 9.5px; line-height: 1.55; color: #333; padding-left: 16px; }
  .findings-list li { margin-bottom: 3px; }
  .fleet-row { margin-bottom: 6px; }
  .fleet-label { display: flex; justify-content: space-between; font-size: 8.5px; margin-bottom: 2px; }
  .fleet-label .name { color: #555; }
  .fleet-label .val { font-weight: 700; white-space: nowrap; }
  .fleet-bar { height: 12px; border-radius: 6px; overflow: hidden; background: #e5e7eb; }
  .fleet-bar-fill { height: 100%; border-radius: 6px; }
  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .metric-block { background: #f7f7f7; border-radius: 4px; padding: 6px 6px; text-align: center; overflow: hidden; }
  .metric-block .label { font-size: 7px; text-transform: uppercase; letter-spacing: 0.3px; color: #666; font-weight: 600; line-height: 1.3; }
  .metric-block .value { font-size: 14px; font-weight: 700; margin-top: 1px; white-space: nowrap; }
  .metric-block .unit { font-size: 7px; color: #888; }
  .util-bar { display: flex; height: 18px; border-radius: 4px; overflow: hidden; margin-bottom: 5px; }
  .util-bar .setup { background: #ef4444; display: flex; align-items: center; justify-content: center; color: white; font-size: 7.5px; font-weight: 600; }
  .util-bar .productive { background: #22c55e; display: flex; align-items: center; justify-content: center; color: white; font-size: 7.5px; font-weight: 600; }
  .util-legend { display: flex; gap: 20px; font-size: 8.5px; }
  .util-legend .dot { display: inline-block; width: 7px; height: 7px; border-radius: 2px; margin-right: 3px; vertical-align: middle; }
  .benchmark-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid #f0f0f0; }
  .benchmark-row .metric-label { font-size: 9px; color: #333; }
  .benchmark-row .metric-value { font-size: 9px; font-weight: 600; margin-right: 6px; }
  .band-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 8px; font-weight: 600; white-space: nowrap; }
  .interpretation-block { margin-bottom: 3px; }
  .interpretation-block .title { font-size: 9px; font-weight: 600; }
  .interpretation-block .desc { font-size: 8.5px; color: #555; line-height: 1.35; }
  .footnote { font-size: 7.5px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 6px; margin-top: 12px; }
</style></head><body>

<!-- 1. Title -->
<div class="header">
  <h1>Flexo Setup Tax — Plant Capacity Audit</h1>
  <h2>Operational Diagnostic Summary</h2>
</div>

<!-- 2. Performance Score -->
<div class="section">
  <div class="section-title">Plant Performance Score</div>
  <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:4px;">
    <span style="font-size:24px;font-weight:700;">${perfScore}</span>
    <span style="font-size:12px;color:#888;">/ 100</span>
  </div>
  <div class="score-bar-container">
    <div class="score-bar-fill" style="width:${perfScore}%;background:${perfColor};"></div>
  </div>
  <div class="score-labels">
    <span>Critical</span><span>Needs Improvement</span><span>Typical</span><span>Best Practice</span>
  </div>
  <p style="font-size:10px;font-weight:600;color:${perfColor};margin-top:6px;">${perfLabel}</p>
</div>

<!-- 3. Inputs Used -->
<div class="section">
  <div class="section-title">Inputs Used (Audit Trail)</div>
  <div class="inputs-grid">
    <div class="input-item"><span class="lbl">Operating Mode</span><span class="val">${modeLabel}</span></div>
    <div class="input-item"><span class="lbl">Number of Presses</span><span class="val">${inputs.presses}</span></div>
    <div class="input-item"><span class="lbl">Changeovers / Press / Day</span><span class="val">${inputs.changeoversPerPressPerDay}</span></div>
    <div class="input-item"><span class="lbl">Setup Minutes / Changeover</span><span class="val">${inputs.setupMinutesPerChangeover}</span></div>
    <div class="input-item"><span class="lbl">Shifts per Day</span><span class="val">${inputs.shiftsPerDay}</span></div>
    <div class="input-item"><span class="lbl">Hours per Shift</span><span class="val">${inputs.hoursPerShift}</span></div>
    <div class="input-item"><span class="lbl">Operating Days / Year</span><span class="val">${inputs.operatingDaysPerYear}</span></div>
    ${inputs.pressSpeedFPM !== null ? `<div class="input-item"><span class="lbl">Avg Press Speed</span><span class="val">${inputs.pressSpeedFPM} ft/min</span></div>` : ''}
    ${inputs.pricePerFoot !== null ? `<div class="input-item"><span class="lbl">Avg Selling Price</span><span class="val">$${inputs.pricePerFoot}/ft</span></div>` : ''}
    ${inputs.laborRate !== null ? `<div class="input-item"><span class="lbl">Labor Rate</span><span class="val">$${inputs.laborRate}/hr</span></div>` : ''}
    ${inputs.setupWasteFt !== null ? `<div class="input-item"><span class="lbl">Setup Waste</span><span class="val">${inputs.setupWasteFt} ft/chg</span></div>` : ''}
    ${inputs.avgWebWidthIn !== null ? `<div class="input-item"><span class="lbl">Web Width</span><span class="val">${inputs.avgWebWidthIn} in</span></div>` : ''}
    ${inputs.materialCostPerMSI !== null ? `<div class="input-item"><span class="lbl">Material Cost</span><span class="val">$${inputs.materialCostPerMSI}/MSI</span></div>` : ''}
  </div>
</div>

<!-- 4. Executive Snapshot -->
<div class="section">
  <div class="section-title">Executive Snapshot</div>
  <p class="narrative">This plant is currently giving up meaningful press capacity to setup activity.</p>
  <p class="narrative">Based on the inputs provided, this plant is losing approximately <strong>${formatNumber(results.setupHoursPerYear)}</strong> press hours per year to changeovers, representing <strong>${formatPercent(results.pctPressTimeLostToSetup)}</strong> of total available press capacity. This loss is equivalent to roughly <strong>${formatNumber(hiddenPC, 1)}</strong> presses worth of plant capacity currently consumed by setup activity.</p>
  <p class="narrative">${narrativeP2}</p>
  ${(() => {
      const totalRev = inputs.pressSpeedFPM !== null && inputs.pricePerFoot !== null
        ? results.totalAvailablePlantPressHoursPerYear * 60 * inputs.pressSpeedFPM * inputs.pricePerFoot
        : null;
      const pct = results.annualPlateCost !== null && totalRev !== null && totalRev > 0
        ? (results.annualPlateCost / totalRev) * 100
        : null;
      return results.annualPlateCost !== null && pct !== null
        ? `<p class="narrative">Modeled annual plate costs of approximately <strong>${formatCurrency(results.annualPlateCost)}</strong> per year represent <strong>${formatNumber(pct, 1)}%</strong> of estimated annual revenue consumed by plate activity.</p>`
        : '';
    })()}
  ${inputs.consumablesPerChangeover !== null && inputs.consumablesPerChangeover > 0 && results.annualConsumablesCost !== null
    ? `<p class="narrative">Modeled other consumables (mounting tape, anilox solvent, ink waste, and press supplies) add approximately <strong>${formatCurrency(results.annualConsumablesCost)}</strong> per year (≈ <strong>${formatCurrency(inputs.consumablesPerChangeover)}</strong> per changeover) to the total direct setup cost.</p>`
    : ''}
  <p class="narrative">${narrativeP3}</p>
</div>

<!-- 5. Key Findings -->
<div class="section">
  <div class="section-title">Key Findings</div>
  <ul class="findings-list">${keyFindings}</ul>
</div>

<!-- 6. Capacity Opportunity / Press Fleet Equivalents -->
<div class="section">
  <div class="section-title">Capacity Opportunity — Press Fleet Equivalents</div>
  <p class="narrative" style="margin-bottom:4px;font-style:italic;color:#666;">Press equivalents translate setup-related capacity loss into the number of presses effectively removed from production.</p>
  <p class="narrative" style="margin-bottom:10px;">Based on the modeled inputs, the plant's <strong>${inputs.presses}</strong> installed presses currently operate with the effective production capacity of approximately <strong>${formatNumber(effectiveToday, 1)}</strong> fully utilized presses due to setup activity.</p>
  <div class="fleet-row">
    <div class="fleet-label"><span class="name">Installed Presses</span><span class="val">${formatNumber(installed, 0)} presses</span></div>
    <div class="fleet-bar"><div class="fleet-bar-fill" style="width:100%;background:#94a3b8;"></div></div>
  </div>
  <div class="fleet-row">
    <div class="fleet-label"><span class="name">Effective Presses Today</span><span class="val">${formatNumber(effectiveToday, 1)} presses</span></div>
    <div class="fleet-bar"><div class="fleet-bar-fill" style="width:${Math.max(todayPct, 1)}%;background:#f59e0b;"></div></div>
  </div>
  <div class="fleet-row">
    <div class="fleet-label"><span class="name">Effective Presses After Improvement (${inputs.reductionPct}% Reduction)</span><span class="val">${formatNumber(effectiveAfter, 1)} presses</span></div>
    <div class="fleet-bar"><div class="fleet-bar-fill" style="width:${Math.max(afterPct, 1)}%;background:#22c55e;"></div></div>
  </div>
</div>

<!-- 7. Core Metrics -->
<div class="section">
  <div class="section-title">Core Metrics</div>
  <div class="metrics-grid">
    <div class="metric-block"><div class="label">Setup Hours Lost</div><div class="value">${formatNumber(results.setupHoursPerYear)}</div><div class="unit">hrs / year</div></div>
    <div class="metric-block"><div class="label">% Press Time Lost</div><div class="value">${formatPercent(results.pctPressTimeLostToSetup)}</div><div class="unit">&nbsp;</div></div>
    <div class="metric-block"><div class="label">FTE Equivalent</div><div class="value">${formatNumber(results.fteEquivalent, 1)}</div><div class="unit">&nbsp;</div></div>
    <div class="metric-block"><div class="label">Press Capacity Consumed by Setup</div><div class="value">${formatNumber(hiddenPC, 1)}</div><div class="unit">presses</div></div>
    ${results.annualSetupLaborCost !== null ? `<div class="metric-block"><div class="label">Setup Labor Cost</div><div class="value">${formatCurrency(results.annualSetupLaborCost)}</div><div class="unit">/ year</div></div>` : ''}
    ${results.wasteCostPerSetup !== null ? `<div class="metric-block"><div class="label">Material Waste Cost per Changeover</div><div class="value">${formatCurrency(results.wasteCostPerSetup)}</div><div class="unit">&nbsp;</div></div>` : ''}
    ${results.annualSetupMaterialWasteCost !== null ? `<div class="metric-block"><div class="label">Annual Setup Material Waste</div><div class="value">${formatCurrency(results.annualSetupMaterialWasteCost)}</div><div class="unit">/ year</div></div>` : ''}
    ${results.annualPlateCost !== null ? `<div class="metric-block"><div class="label">Annual Plate Cost</div><div class="value">${formatCurrency(results.annualPlateCost)}</div><div class="unit">/ year</div></div>` : ''}
    ${inputs.consumablesPerChangeover !== null && inputs.consumablesPerChangeover > 0 ? `<div class="metric-block"><div class="label">Consumables / Changeover</div><div class="value">${formatCurrency(inputs.consumablesPerChangeover)}</div><div class="unit">&nbsp;</div></div>` : ''}
    ${results.annualConsumablesCost !== null ? `<div class="metric-block"><div class="label">Annual Consumables Cost</div><div class="value">${formatCurrency(results.annualConsumablesCost)}</div><div class="unit">/ year</div></div>` : ''}
    ${results.annualOvertimeCost !== null ? `<div class="metric-block"><div class="label">Annual Overtime Cost</div><div class="value">${formatCurrency(results.annualOvertimeCost)}</div><div class="unit">/ year</div></div>` : ''}
    ${results.premiumSubstrateWasteCostPerChangeover !== null ? `<div class="metric-block"><div class="label">Premium Substrate Waste / Changeover</div><div class="value">${formatCurrency(results.premiumSubstrateWasteCostPerChangeover)}</div><div class="unit">&nbsp;</div></div>` : ''}
    ${results.annualPremiumSubstrateWasteCost !== null ? `<div class="metric-block"><div class="label">Annual Premium Substrate Waste</div><div class="value">${formatCurrency(results.annualPremiumSubstrateWasteCost)}</div><div class="unit">/ year</div></div>` : ''}
    ${results.totalSetupCost !== null ? `<div class="metric-block"><div class="label">Total Setup Cost</div><div class="value">${formatCurrency(results.totalSetupCost)}</div><div class="unit">/ year</div></div>` : ''}
    ${results.setupTaxPerChangeover !== null ? `<div class="metric-block"><div class="label">Setup Tax per Changeover</div><div class="value">${formatCurrency(results.setupTaxPerChangeover)}</div><div class="unit">&nbsp;</div></div>` : ''}
    <div class="metric-block"><div class="label">Recovered Hours @ ${inputs.reductionPct}%</div><div class="value">${formatNumber(results.recoveredHours)}</div><div class="unit">hrs / year</div></div>
    ${results.recoveredLinearFeet !== null ? `<div class="metric-block"><div class="label">Recovered Feet</div><div class="value">${formatNumber(results.recoveredLinearFeet)}</div><div class="unit">ft / year</div></div>` : ''}
    ${results.potentialRevenueCapacity !== null ? `<div class="metric-block"><div class="label">Opportunity Cost</div><div class="value">${formatCurrency(results.potentialRevenueCapacity)}</div><div class="unit">unused capacity</div></div>` : ''}
    ${results.totalSetupImpact !== null ? `<div class="metric-block"><div class="label">Total Setup Impact</div><div class="value">${formatCurrency(results.totalSetupImpact)}</div><div class="unit">/ year</div></div>` : ''}
  </div>
</div>

<!-- 8. Capacity Utilization -->
<div class="section">
  <div class="section-title">Press Capacity Utilization (Annual)</div>
  <div class="util-bar">
    <div class="setup" style="width:${Math.max(setupPctVal, 2)}%">${setupPctVal.toFixed(1)}%</div>
    <div class="productive" style="width:${Math.max(productivePctVal, 2)}%">${productivePctVal.toFixed(1)}%</div>
  </div>
  <div class="util-legend">
    <span><span class="dot" style="background:#ef4444"></span>Setup Time: ${formatNumber(setupHours)} hrs (${setupPctVal.toFixed(1)}%)</span>
    <span><span class="dot" style="background:#22c55e"></span>Remaining Productive Time: ${formatNumber(productiveHours)} hrs (${productivePctVal.toFixed(1)}%)</span>
  </div>
</div>

<!-- 9. Benchmarks -->
<div class="section">
  <div class="section-title">Benchmark (Directional)</div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
    <span style="font-size:9px;color:#888;">Overall:</span>
    <span class="band-badge" style="background:${bandColor(benchmarks.overall)}20;color:${bandColor(benchmarks.overall)};">${bandLabel(benchmarks.overall)}</span>
  </div>
  ${benchmarks.metrics.map(m => `<div class="benchmark-row"><div><span class="metric-label">${m.label}: </span><span class="metric-value">${m.value}</span></div><span class="band-badge" style="background:${bandColor(m.band)}20;color:${bandColor(m.band)};">${bandLabel(m.band)}</span></div>`).join('')}
  <p style="font-size:8px;color:#888;font-style:italic;margin-top:6px;">Benchmarks are directional estimates and may vary depending on product mix, SKU complexity, and plant operating practices.</p>
  <div style="margin-top:6px;">
    <div class="interpretation-block"><p class="title" style="color:#dc2626;">Above Typical</p><p class="desc">Performance worse than typical industry ranges.</p></div>
    <div class="interpretation-block"><p class="title" style="color:#d97706;">Typical</p><p class="desc">Performance within normal industry ranges.</p></div>
    <div class="interpretation-block"><p class="title" style="color:#16a34a;">Below Typical</p><p class="desc">Performance better than typical industry ranges.</p></div>
  </div>
</div>

<!-- 10. What This Means -->
<div class="section">
  <div class="section-title">What This Means</div>
  <p class="narrative">${generateWhatThisMeans(inputs, results)}</p>
</div>

<div class="footnote">Benchmarks are directional estimates and may vary depending on product mix, SKU complexity, and plant operating practices.</div>

</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const metrics: { label: string; value: string; unit?: string }[] = [
    { label: 'Setup Hours Lost', value: formatNumber(results.setupHoursPerYear), unit: 'hrs/year' },
    { label: '% Press Time Lost', value: formatPercent(results.pctPressTimeLostToSetup) },
    { label: 'FTE Equivalent', value: formatNumber(results.fteEquivalent, 1) },
  ];

  const hiddenPressCapacity = results.pctPressTimeLostToSetup * inputs.presses;
  metrics.push({ label: 'Press Capacity Consumed by Setup', value: formatNumber(hiddenPressCapacity, 1), unit: 'presses' });

  if (results.annualSetupLaborCost !== null) {
    metrics.push({ label: 'Setup Labor Cost', value: formatCurrency(results.annualSetupLaborCost), unit: '/year' });
  }

  if (results.wasteCostPerSetup !== null) {
    metrics.push({ label: 'Material Waste Cost per Changeover', value: formatCurrency(results.wasteCostPerSetup) });
  }
  if (results.annualSetupMaterialWasteCost !== null) {
    metrics.push({ label: 'Annual Setup Material Waste Cost', value: formatCurrency(results.annualSetupMaterialWasteCost), unit: '/year' });
  }
  if (results.annualPlateCost !== null) {
    metrics.push({ label: 'Annual Plate Cost', value: formatCurrency(results.annualPlateCost), unit: '/year' });
  }
  if (inputs.consumablesPerChangeover !== null && inputs.consumablesPerChangeover > 0) {
    metrics.push({ label: 'Consumables per Changeover', value: formatCurrency(inputs.consumablesPerChangeover) });
  }
  if (results.annualConsumablesCost !== null) {
    metrics.push({ label: 'Annual Consumables Cost', value: formatCurrency(results.annualConsumablesCost), unit: '/year' });
  }
  if (results.totalSetupCost !== null) {
    metrics.push({ label: 'Total Setup Cost', value: formatCurrency(results.totalSetupCost), unit: '/year' });
  }
  if (results.setupTaxPerChangeover !== null) {
    metrics.push({ label: 'Setup Tax per Changeover', value: formatCurrency(results.setupTaxPerChangeover) });
  }

  metrics.push({
    label: `Recovered Hours @ ${inputs.reductionPct}%`,
    value: formatNumber(results.recoveredHours),
    unit: 'hrs/year',
  });

  if (results.recoveredLinearFeet !== null) {
    metrics.push({ label: 'Recovered Feet', value: formatNumber(results.recoveredLinearFeet), unit: 'ft/year' });
  }

  if (results.potentialRevenueCapacity !== null) {
    metrics.push({ label: 'Opportunity Cost (Unused Production Capacity)', value: formatCurrency(results.potentialRevenueCapacity) });
  }
  if (results.totalSetupImpact !== null) {
    metrics.push({ label: 'Total Setup Impact', value: formatCurrency(results.totalSetupImpact), unit: '/year' });
  }

  return (
    <div className="space-y-5">
      <Card className="print:hidden" data-testid="card-save-audit">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Save This Audit</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="save-company-name" className="text-sm font-medium">Company Name</Label>
              <Input
                id="save-company-name"
                placeholder="Enter company name"
                value={saveCompanyName}
                onChange={(e) => { setSaveCompanyName(e.target.value); setSaveMessage(null); }}
                data-testid="input-save-company-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="save-contact-name" className="text-sm font-medium">Contact Name</Label>
              <Input
                id="save-contact-name"
                placeholder="Enter contact name"
                value={saveContactName}
                onChange={(e) => setSaveContactName(e.target.value)}
                data-testid="input-save-contact-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="save-audit-date" className="text-sm font-medium">Audit Date</Label>
              <Input
                id="save-audit-date"
                type="date"
                value={saveAuditDate}
                onChange={(e) => setSaveAuditDate(e.target.value)}
                data-testid="input-save-audit-date"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="save-notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="save-notes"
              placeholder="Add any notes about this audit — key findings, next steps, follow-up date"
              value={saveNotes}
              onChange={(e) => setSaveNotes(e.target.value)}
              rows={3}
              data-testid="textarea-save-notes"
            />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Button onClick={handleSaveAudit} data-testid="btn-save-audit" className="gap-2">
              <Save className="w-4 h-4" />
              Save Audit
            </Button>
            {saveMessage && (
              <p className={cn('text-sm', saveMessage.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')} data-testid="text-save-message">
                {saveMessage.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div ref={snapshotRef} className="space-y-4 snapshot-printable" data-testid="snapshot-content">
        <PerformanceScoreCard results={results} />

        <InputsUsedCard inputs={inputs} mode={mode} />

        <Card>
          <CardContent className="p-5 sm:p-6">
            <h2 className="text-base font-semibold" data-testid="text-snapshot-title">Executive Snapshot</h2>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4" data-testid="text-diagnostic-label">Plant Capacity Diagnostic</p>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/80" data-testid="text-executive-narrative">
              <p>This plant is currently giving up meaningful press capacity to setup activity.</p>
              <p>
                Based on the inputs provided, this plant is losing approximately <span className="font-semibold text-foreground">{formatNumber(results.setupHoursPerYear)}</span> press hours per year to changeovers, representing <span className="font-semibold text-foreground">{formatPercent(results.pctPressTimeLostToSetup)}</span> of total available press capacity. This loss is equivalent to roughly <span className="font-semibold text-foreground">{formatNumber(results.pctPressTimeLostToSetup * inputs.presses, 1)}</span> presses worth of plant capacity currently consumed by setup activity.
              </p>
              <p>
                At the modeled improvement scenario of <span className="font-semibold text-foreground">{inputs.reductionPct}%</span> setup reduction, the plant could recover approximately <span className="font-semibold text-foreground">{formatNumber(results.recoveredHours)}</span> press hours annually.
                {results.recoveredLinearFeet !== null && <>{' '}This recovered capacity could unlock roughly <span className="font-semibold text-foreground">{formatNumber(results.recoveredLinearFeet)}</span> additional linear feet of recoverable production capacity.</>}
                {results.potentialRevenueCapacity !== null && <>{' '}At the current selling price, the unused capacity caused by setup activity represents approximately <span className="font-semibold text-foreground">{formatCurrency(results.potentialRevenueCapacity)}</span> in unrealized annual production revenue.</>}
              </p>
              {results.annualPlateCost !== null && plateCostPctOfTotalRevenue !== null && (
                <p>Modeled annual plate costs of approximately <span className="font-semibold text-foreground">{formatCurrency(results.annualPlateCost)}</span> per year represent <span className="font-semibold text-foreground">{formatNumber(plateCostPctOfTotalRevenue, 1)}%</span> of estimated annual revenue consumed by plate activity.</p>
              )}
              {inputs.consumablesPerChangeover !== null && inputs.consumablesPerChangeover > 0 && results.annualConsumablesCost !== null && (
                <p>Modeled other consumables (mounting tape, anilox solvent, ink waste, and press supplies) add approximately <span className="font-semibold text-foreground">{formatCurrency(results.annualConsumablesCost)}</span> per year (≈ <span className="font-semibold text-foreground">{formatCurrency(inputs.consumablesPerChangeover)}</span> per changeover) to the total direct setup cost.</p>
              )}
              {results.totalSetupImpact !== null ? (
                <p>Combined, these factors represent an estimated total operational impact of approximately <span className="font-semibold text-foreground">{formatCurrency(results.totalSetupImpact)}</span> annually when both direct setup costs and unrealized production value are considered.</p>
              ) : (
                <p>These results illustrate the operational impact of setup efficiency on plant throughput and highlight the potential value of reducing changeover time.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Key Findings</h3>
            <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/90 list-disc pl-4" data-testid="list-key-findings">
              <li>Setup activities currently consume <span className="font-bold">{formatPercent(results.pctPressTimeLostToSetup)}</span> of total available press time.</li>
              <li>This represents the equivalent capacity of approximately <span className="font-bold">{formatNumber(results.pctPressTimeLostToSetup * inputs.presses, 1)}</span> presses currently consumed by setup activity.</li>
              <li>The current setup environment represents approximately <span className="font-bold">{results.potentialRevenueCapacity !== null ? formatCurrency(results.potentialRevenueCapacity) : 'N/A'}</span> in unrealized annual production revenue due to lost press capacity.</li>
              {results.annualSetupMaterialWasteCost !== null && results.wasteCostPerSetup !== null && (
                <li>Modeled setup material waste is approximately <span className="font-bold">{formatCurrency(results.annualSetupMaterialWasteCost)}</span> per year (≈ <span className="font-bold">{formatCurrency(results.wasteCostPerSetup)}</span> per changeover based on setup waste length, press web width, and material cost per MSI).</li>
              )}
              {results.annualPlateCost !== null && results.plateCostPerChangeover !== null && inputs.avgPlateCostPerColor !== null && inputs.avgPlateCostPerColor > 0 && ((inputs.avgColorsPerJob ?? 0) > 0 || (inputs.avgPlatesChangedPerCopyChange ?? 0) > 0) && (
                <li>Annual plate cost is approximately <span className="font-bold">{formatCurrency(results.annualPlateCost)}</span> per year (= <span className="font-bold">{formatCurrency(results.plateCostPerChangeover)}</span> per changeover), based on <span className="font-bold">${inputs.avgPlateCostPerColor}</span>/color across full plate set changeovers (<span className="font-bold">{inputs.avgColorsPerJob ?? 0}</span> colors, <span className="font-bold">{inputs.pctJobsRequiringNewPlates ?? 0}%</span> of changeovers) and copy change only changeovers (<span className="font-bold">{inputs.avgPlatesChangedPerCopyChange ?? 0}</span> plates, <span className="font-bold">{inputs.pctJobsWithCopyChangesOnly ?? 0}%</span> of changeovers).</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {(() => {
          const hasData = plateCostData && (plateCostData.newJobsPerYear > 0 || plateCostData.copyChangeEvents > 0);
          if (!hasData) {
            return (
              <Card data-testid="card-plate-cost-prompt">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Plate Cost Analysis</h3>
                  <p className="text-sm text-muted-foreground/70 italic">
                    Complete the Plate Cost tab to include plate cost analysis in this report.
                  </p>
                  {onSwitchTab && (
                    <button
                      onClick={() => onSwitchTab('plate-cost')}
                      className="mt-3 text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors print:hidden"
                      data-testid="btn-go-to-plate-cost"
                    >
                      Go to Plate Cost tab →
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          }
          const savings = plateCostData.totalAnnualPlateCost;
          return (
            <Card data-testid="card-plate-cost-analysis">
              <CardContent className="p-5 sm:p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Plate Cost Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40">
                    <span className="text-sm text-foreground/80">Total Annual Plate Cost — Flexo</span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums" data-testid="text-plate-cost-flexo">{formatCurrency(plateCostData.totalAnnualPlateCost)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40">
                    <span className="text-sm text-foreground/80">Total Annual Plate Cost — HP Indigo V12</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums" data-testid="text-plate-cost-v12">$0 <span className="font-normal text-xs text-muted-foreground">(Eliminated)</span></span>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40">
                    <span className="text-sm font-medium text-foreground">Annual Plate Savings with V12</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums" data-testid="text-plate-savings">{formatCurrency(savings)}</span>
                  </div>
                  {plateCostData.avgTapeCostPerMount > 0 && (
                    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40">
                      <span className="text-sm text-foreground/80">Tape Cost Eliminated</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums" data-testid="text-tape-cost-eliminated">{formatCurrency(plateCostData.annualTapeCost)}</span>
                    </div>
                  )}
                  {plateCostData.breakEvenFootage !== null && plateCostData.breakEvenFootage > 0 && (
                    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40">
                      <span className="text-sm text-foreground/80">Break-Even Run Length</span>
                      <span className="text-sm font-semibold tabular-nums" data-testid="text-break-even-footage">
                        {formatNumber(plateCostData.breakEvenFootage)} ft
                        <span className="block text-xs font-normal text-muted-foreground text-right">Jobs under {formatNumber(plateCostData.breakEvenFootage)} ft don't cover their plate cost on flexo</span>
                      </span>
                    </div>
                  )}
                  {plateCostData.numSkus > 0 && (
                    <div className="flex items-start justify-between gap-4 py-2">
                      <span className="text-sm text-foreground/80">SKU Family Annual Plate Cost</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums" data-testid="text-sku-plate-cost">{formatCurrency(plateCostData.skuCombinedFlexo)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        <Card>
          <CardContent className="p-5 sm:p-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Capacity Opportunity</h4>
            <p className="text-xs text-muted-foreground italic mb-2">Press equivalents translate setup-related capacity loss into the number of presses effectively removed from production.</p>
            <p className="text-sm leading-relaxed text-foreground/90" data-testid="text-capacity-opportunity">
              Based on the modeled inputs, the plant's <span className="font-bold">{inputs.presses}</span> installed presses currently operate with the effective production capacity of approximately <span className="font-bold">{formatNumber(inputs.presses * (1 - results.pctPressTimeLostToSetup), 1)}</span> fully utilized presses due to setup activity.
            </p>
          </CardContent>
        </Card>

        <PressFleetEquivalents inputs={inputs} results={results} />

        <Card>
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">Core Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-5">
              {metrics.map((m, i) => (
                <div key={i} data-testid={`snapshot-metric-${i}`}>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">{m.label}</p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">{m.value}</p>
                  {m.unit && <p className="text-[11px] text-muted-foreground">{m.unit}</p>}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
              Press Capacity Consumed by Setup: Equivalent press capacity currently consumed by setup activities.
            </p>
            {results.annualSetupMaterialWasteCost !== null && (
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                Material waste during press setup is estimated using setup waste length, average press web width, and substrate cost per MSI.
              </p>
            )}
            {(results.totalSetupCost !== null || results.potentialRevenueCapacity !== null) && (
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                Direct setup costs include labor, substrate waste, and other consumables incurred during press setup. Opportunity cost represents unrealized production value caused by setup downtime.
              </p>
            )}
          </CardContent>
        </Card>

        <PressCapacityUtilizationBar results={results} />

        {showBenchmark && <BenchmarkPanel inputs={inputs} results={results} />}
        {showBenchmark && <BenchmarkInterpretation />}

        <Card>
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">What This Means</h3>
            <p className="text-sm leading-relaxed text-foreground/90" data-testid="text-what-this-means">
              {generateWhatThisMeans(inputs, results)}
            </p>
          </CardContent>
        </Card>

        <AssumptionsSection showMaterialWaste={results.annualSetupMaterialWasteCost !== null} />
      </div>

      <Separator className="print:hidden" />

      <div className="print:hidden space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <CopyButton
            label="Copy Summary Text"
            textFn={() => generateSummaryText(inputs, results)}
            icon={Copy}
            testId="btn-copy-summary"
          />

          <Button variant="secondary" onClick={handleShareLink} data-testid="btn-share-link" className="justify-start">
            <Link2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
          <Button variant="secondary" onClick={handleExportPDF} data-testid="btn-export-pdf" className="justify-start">
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={onStartOver} data-testid="btn-start-over">
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
}

import { type RefObject } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, Mail, Link2, FileDown, RotateCcw, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { BenchmarkPanel } from "@/components/benchmark-panel";
import {
  type AuditInputs,
  type AuditResults,
  type OperatingMode,
  formatNumber,
  formatCurrency,
  formatPercent,
  generateWhatThisMeans,
  generateSummaryText,
  generateFollowUpEmail,
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

export function AuditSnapshotSection({ inputs, results, mode, onStartOver, snapshotRef, showBenchmark }: Props) {
  const { toast } = useToast();

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
      narrativeP2 += ` At the current selling price, the unused capacity caused by setup activity represents approximately ${formatCurrency(results.potentialRevenueCapacity)} in unrealized annual production value.`;
    }
    let narrativeP3 = '';
    if (results.totalSetupImpact !== null) {
      narrativeP3 = `Combined, these factors represent an estimated total operational impact of approximately ${formatCurrency(results.totalSetupImpact)} annually when both direct setup costs and unrealized production capacity are considered.`;
    } else {
      narrativeP3 = 'These results illustrate the operational impact of setup efficiency on plant throughput and highlight the potential value of reducing changeover time.';
    }

    let keyFindings = `<li>Setup activities currently consume <strong>${formatPercent(results.pctPressTimeLostToSetup)}</strong> of total available press time.</li>`;
    keyFindings += `<li>This represents the equivalent capacity of approximately <strong>${formatNumber(hiddenPC, 1)}</strong> presses currently consumed by setup activity.</li>`;
    keyFindings += `<li>The current setup environment represents approximately <strong>${results.potentialRevenueCapacity !== null ? formatCurrency(results.potentialRevenueCapacity) : 'N/A'}</strong> in unrealized annual production value due to lost press capacity.</li>`;
    if (results.annualSetupMaterialWasteCost !== null && results.wasteCostPerSetup !== null) {
      keyFindings += `<li>Modeled setup material waste is approximately <strong>${formatCurrency(results.annualSetupMaterialWasteCost)}</strong> per year (≈ <strong>${formatCurrency(results.wasteCostPerSetup)}</strong> per changeover based on setup waste length, press web width, and material cost per MSI).</li>`;
    }

    const html = `<!DOCTYPE html>
<html><head><title>Flexo Setup Tax — Plant Capacity Audit</title>
<style>
  @page { size: letter; margin: 0.5in 0.6in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; font-size: 10px; line-height: 1.5; }
  .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 16px; }
  .header h1 { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; }
  .header h2 { font-size: 11px; font-weight: 600; color: #555; margin-top: 2px; }
  .section { margin-bottom: 18px; page-break-inside: avoid; }
  .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 10px; }
  .score-bar-container { position: relative; height: 14px; background: #e5e7eb; border-radius: 7px; overflow: hidden; margin: 8px 0; }
  .score-bar-fill { position: absolute; top: 0; left: 0; height: 100%; border-radius: 7px; }
  .score-labels { display: flex; justify-content: space-between; font-size: 8px; color: #999; }
  .inputs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 16px; }
  .input-item { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #f0f0f0; }
  .input-item .lbl { color: #555; font-size: 9px; }
  .input-item .val { font-weight: 600; font-size: 9px; }
  .narrative { font-size: 10px; line-height: 1.6; color: #333; margin-bottom: 6px; }
  .findings-list { font-size: 10px; line-height: 1.6; color: #333; padding-left: 18px; }
  .findings-list li { margin-bottom: 4px; }
  .fleet-row { margin-bottom: 8px; }
  .fleet-label { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px; }
  .fleet-label .name { color: #555; }
  .fleet-label .val { font-weight: 700; }
  .fleet-bar { height: 14px; border-radius: 7px; overflow: hidden; background: #e5e7eb; }
  .fleet-bar-fill { height: 100%; border-radius: 7px; }
  .metrics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
  .metric-block { background: #f7f7f7; border-radius: 4px; padding: 8px 10px; text-align: center; }
  .metric-block .label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; font-weight: 600; }
  .metric-block .value { font-size: 16px; font-weight: 700; margin-top: 2px; }
  .metric-block .unit { font-size: 8px; color: #888; }
  .util-bar { display: flex; height: 20px; border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
  .util-bar .setup { background: #ef4444; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: 600; }
  .util-bar .productive { background: #22c55e; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: 600; }
  .util-legend { display: flex; gap: 24px; font-size: 9px; }
  .util-legend .dot { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
  .benchmark-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid #f0f0f0; }
  .benchmark-row .metric-label { font-size: 10px; color: #333; }
  .benchmark-row .metric-value { font-size: 10px; font-weight: 600; margin-right: 8px; }
  .band-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: 600; }
  .interpretation-block { margin-bottom: 4px; }
  .interpretation-block .title { font-size: 10px; font-weight: 600; }
  .interpretation-block .desc { font-size: 9px; color: #555; line-height: 1.4; }
  .footnote { font-size: 8px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 16px; }
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
    <span style="font-size:28px;font-weight:700;">${perfScore}</span>
    <span style="font-size:14px;color:#888;">/ 100</span>
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
  <p class="narrative" style="margin-bottom:10px;">Based on the modeled inputs, the plant's <strong>${inputs.presses}</strong> installed presses currently deliver the effective production capacity of approximately <strong>${formatNumber(effectiveToday, 1)}</strong> fully utilized presses due to setup activity.</p>
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
    <div class="metric-block"><div class="label">Hidden Press Capacity</div><div class="value">${formatNumber(hiddenPC, 1)}</div><div class="unit">presses</div></div>
    ${results.annualSetupLaborCost !== null ? `<div class="metric-block"><div class="label">Setup Labor Cost</div><div class="value">${formatCurrency(results.annualSetupLaborCost)}</div><div class="unit">/ year</div></div>` : ''}
    ${results.wasteCostPerSetup !== null ? `<div class="metric-block"><div class="label">Waste Cost per Setup</div><div class="value">${formatCurrency(results.wasteCostPerSetup)}</div><div class="unit">&nbsp;</div></div>` : ''}
    ${results.annualSetupMaterialWasteCost !== null ? `<div class="metric-block"><div class="label">Annual Setup Material Waste</div><div class="value">${formatCurrency(results.annualSetupMaterialWasteCost)}</div><div class="unit">/ year</div></div>` : ''}
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
  <p style="font-size:9px;color:#888;font-style:italic;margin-top:8px;">Benchmarks are directional and vary by mix and SKU complexity.</p>
  <div style="margin-top:10px;">
    <div class="interpretation-block"><p class="title" style="color:#dc2626;">Above Typical</p><p class="desc">Indicates performance that is worse than typical industry ranges.</p></div>
    <div class="interpretation-block"><p class="title" style="color:#d97706;">Typical</p><p class="desc">Indicates performance within normal industry operating ranges.</p></div>
    <div class="interpretation-block"><p class="title" style="color:#16a34a;">Below Typical</p><p class="desc">Indicates performance that is better than typical industry ranges.</p></div>
  </div>
</div>

<!-- 10. What This Means -->
<div class="section">
  <div class="section-title">What This Means</div>
  <p class="narrative">${generateWhatThisMeans(inputs, results)}</p>
</div>

<div class="footnote">Benchmarks are directional and may vary by product mix, SKU complexity, and operating practices.</div>

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
  metrics.push({ label: 'Hidden Press Capacity', value: formatNumber(hiddenPressCapacity, 1), unit: 'presses' });

  if (results.annualSetupLaborCost !== null) {
    metrics.push({ label: 'Setup Labor Cost', value: formatCurrency(results.annualSetupLaborCost), unit: '/year' });
  }

  if (results.wasteCostPerSetup !== null) {
    metrics.push({ label: 'Waste Cost per Setup', value: formatCurrency(results.wasteCostPerSetup) });
  }
  if (results.annualSetupMaterialWasteCost !== null) {
    metrics.push({ label: 'Annual Setup Material Waste Cost', value: formatCurrency(results.annualSetupMaterialWasteCost), unit: '/year' });
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
                {results.potentialRevenueCapacity !== null && <>{' '}At the current selling price, the unused capacity caused by setup activity represents approximately <span className="font-semibold text-foreground">{formatCurrency(results.potentialRevenueCapacity)}</span> in unrealized annual production value.</>}
              </p>
              {results.totalSetupImpact !== null ? (
                <p>Combined, these factors represent an estimated total operational impact of approximately <span className="font-semibold text-foreground">{formatCurrency(results.totalSetupImpact)}</span> annually when both direct setup costs and unrealized production capacity are considered.</p>
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
              <li>The current setup environment represents approximately <span className="font-bold">{results.potentialRevenueCapacity !== null ? formatCurrency(results.potentialRevenueCapacity) : 'N/A'}</span> in unrealized annual production value due to lost press capacity.</li>
              {results.annualSetupMaterialWasteCost !== null && results.wasteCostPerSetup !== null && (
                <li>Modeled setup material waste is approximately <span className="font-bold">{formatCurrency(results.annualSetupMaterialWasteCost)}</span> per year (≈ <span className="font-bold">{formatCurrency(results.wasteCostPerSetup)}</span> per changeover based on setup waste length, press web width, and material cost per MSI).</li>
              )}
            </ul>

            <div className="mt-5 pt-4 border-t border-border/50">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Capacity Opportunity</h4>
              <p className="text-sm leading-relaxed text-foreground/90" data-testid="text-capacity-opportunity">
                Based on the modeled inputs, the plant's <span className="font-bold">{inputs.presses}</span> installed presses currently deliver the effective production capacity of approximately <span className="font-bold">{formatNumber(inputs.presses * (1 - results.pctPressTimeLostToSetup), 1)}</span> fully utilized presses due to setup activity.
              </p>
            </div>
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
              Hidden Press Capacity: Equivalent press capacity currently consumed by setup activities.
            </p>
            {results.annualSetupMaterialWasteCost !== null && (
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                Material waste during press setup is estimated using setup waste length, average press web width, and substrate cost per MSI.
              </p>
            )}
            {(results.totalSetupCost !== null || results.potentialRevenueCapacity !== null) && (
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                Direct setup costs include labor and substrate waste during press setup. Opportunity cost represents unrealized production capacity caused by setup downtime.
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
          <CopyButton
            label="Copy AM Follow-Up Email"
            textFn={() => generateFollowUpEmail(inputs, results)}
            icon={Mail}
            testId="btn-copy-email"
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

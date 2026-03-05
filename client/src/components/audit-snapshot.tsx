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

function AssumptionsSection() {
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
    window.print();
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

  metrics.push({
    label: `Recovered Hours @ ${inputs.reductionPct}%`,
    value: formatNumber(results.recoveredHours),
    unit: 'hrs/year',
  });

  if (results.recoveredLinearFeet !== null) {
    metrics.push({ label: 'Recovered Feet', value: formatNumber(results.recoveredLinearFeet), unit: 'ft/year' });
  }

  if (results.potentialRevenueCapacity !== null) {
    metrics.push({ label: 'Potential Production Revenue Capacity', value: formatCurrency(results.potentialRevenueCapacity) });
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
                Based on the inputs provided, this plant is losing approximately <span className="font-semibold text-foreground">{formatNumber(results.setupHoursPerYear)}</span> press hours per year to changeovers, representing <span className="font-semibold text-foreground">{formatPercent(results.pctPressTimeLostToSetup)}</span> of total available press capacity. This loss is equivalent to removing about <span className="font-semibold text-foreground">{formatNumber(results.pressEquivalentLost, 1)}</span> flexo presses from production.
              </p>
              <p>
                At the modeled improvement scenario of <span className="font-semibold text-foreground">{inputs.reductionPct}%</span> setup reduction, the plant could recover approximately <span className="font-semibold text-foreground">{formatNumber(results.recoveredHours)}</span> press hours annually.
                {results.recoveredLinearFeet !== null && <>{' '}This recovered capacity could unlock roughly <span className="font-semibold text-foreground">{formatNumber(results.recoveredLinearFeet)}</span> additional linear feet of production</>}
                {results.potentialRevenueCapacity !== null && <>{' '}and approximately <span className="font-semibold text-foreground">{formatCurrency(results.potentialRevenueCapacity)}</span> in potential revenue capacity at the current selling price</>}.
              </p>
              <p>These results illustrate the operational impact of setup efficiency on plant throughput and highlight the potential value of reducing changeover time.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Key Findings</h3>
            <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/90 list-disc pl-4" data-testid="list-key-findings">
              <li>Setup activities currently consume <span className="font-bold">{formatPercent(results.pctPressTimeLostToSetup)}</span> of total available press time.</li>
              <li>This represents the equivalent capacity of approximately <span className="font-bold">{formatNumber(results.pctPressTimeLostToSetup * inputs.presses, 1)}</span> presses currently consumed by setup activity.</li>
              <li>A <span className="font-bold">{inputs.reductionPct}%</span> reduction in setup time would unlock approximately <span className="font-bold">{results.potentialRevenueCapacity !== null ? formatCurrency(results.potentialRevenueCapacity) : 'N/A'}</span> in potential production revenue capacity at current pricing.</li>
            </ul>
          </CardContent>
        </Card>

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

        <AssumptionsSection />
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

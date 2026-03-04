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
    { label: 'Equivalent Flexo Press Capacity Lost', value: formatNumber(results.pressEquivalentLost, 1), unit: 'presses' },
    { label: 'FTE Equivalent', value: formatNumber(results.fteEquivalent, 1) },
  ];

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
        <Card>
          <CardContent className="p-5 sm:p-6">
            <h2 className="text-base font-semibold" data-testid="text-snapshot-title">Executive Snapshot</h2>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5" data-testid="text-diagnostic-label">Plant Capacity Diagnostic</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-5">
              {metrics.map((m, i) => (
                <div key={i} data-testid={`snapshot-metric-${i}`}>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">{m.label}</p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">{m.value}</p>
                  {m.unit && <p className="text-[11px] text-muted-foreground">{m.unit}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {showBenchmark && <BenchmarkPanel inputs={inputs} results={results} />}

        <Card>
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Key Findings</h3>
            <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/90 list-disc pl-4" data-testid="list-key-findings">
              <li>Setup activities currently consume <span className="font-bold">{formatPercent(results.pctPressTimeLostToSetup)}</span> of total available press time.</li>
              <li>This represents the equivalent capacity of <span className="font-bold">{formatNumber(results.pressEquivalentLost, 1)}</span> flexo presses.</li>
              <li>A <span className="font-bold">{inputs.reductionPct}%</span> reduction in setup time would unlock approximately <span className="font-bold">{results.potentialRevenueCapacity !== null ? formatCurrency(results.potentialRevenueCapacity) : 'N/A'}</span> in potential production revenue capacity at current pricing.</li>
            </ul>
          </CardContent>
        </Card>

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

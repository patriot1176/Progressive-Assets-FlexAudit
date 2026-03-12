import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  type AuditInputs,
  type AuditResults,
  formatNumber,
  formatCurrency,
  formatPercent,
} from "@/lib/calculations";

interface Props {
  inputs: AuditInputs;
  results: AuditResults;
}

function n(s: string): number { return parseFloat(s) || 0; }

function MetricCard({
  label, value, sub, color, testId,
}: { label: string; value: string; sub?: string; color?: 'green' | 'red' | 'yellow' | 'neutral'; testId?: string }) {
  return (
    <div
      className={cn(
        "rounded-md border p-4 space-y-1",
        color === 'green' && "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30",
        color === 'red' && "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30",
        color === 'yellow' && "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30",
        (!color || color === 'neutral') && "bg-muted/40",
      )}
      data-testid={testId}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
      <p className={cn(
        "text-2xl font-bold tracking-tight",
        color === 'green' && "text-emerald-700 dark:text-emerald-400",
        color === 'red' && "text-red-700 dark:text-red-400",
        color === 'yellow' && "text-amber-700 dark:text-amber-400",
      )}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ComparisonTable({ headers, rows }: {
  headers: string[];
  rows: { label: string; values: (string | { text: string; className?: string })[] }[];
}) {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className={`grid gap-0 bg-muted/50 border-b text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2`}
        style={{ gridTemplateColumns: `1fr repeat(${headers.length - 1}, 1fr)` }}>
        {headers.map((h, i) => (
          <span key={i} className={i > 0 ? "text-right" : ""}>{h}</span>
        ))}
      </div>
      <div className="divide-y">
        {rows.map((row, ri) => (
          <div key={ri} className="grid px-4 py-2.5 text-sm"
            style={{ gridTemplateColumns: `1fr repeat(${headers.length - 1}, 1fr)` }}>
            <span className="text-muted-foreground">{row.label}</span>
            {row.values.map((v, vi) => {
              if (typeof v === 'string') {
                return <span key={vi} className="text-right font-medium">{v}</span>;
              }
              return <span key={vi} className={cn("text-right font-medium", v.className)}>{v.text}</span>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MAAnalysisSection({ inputs, results }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [reportedEBITDA, setReportedEBITDA] = useState('0');
  const [ebitdaMultiple, setEbitdaMultiple] = useState('6');
  const setupTax = results.totalSetupCost ?? 0;
  const hasSetupTax = setupTax > 0;
  const ebitda = n(reportedEBITDA);
  const multiple = n(ebitdaMultiple) || 6;
  const hasEBITDA = ebitda > 0;

  const annualChangeovers = inputs.presses * inputs.changeoversPerPressPerDay * inputs.operatingDaysPerYear;

  const normalizedEBITDA40 = ebitda + setupTax * 0.4;
  const normalizedEBITDAFull = ebitda + setupTax;
  const marginImprovement40 = hasEBITDA ? (setupTax * 0.4) / ebitda * 100 : null;
  const marginImprovementFull = hasEBITDA ? setupTax / ebitda * 100 : null;

  const ev_current = ebitda * multiple;
  const ev_40 = normalizedEBITDA40 * multiple;
  const ev_full = normalizedEBITDAFull * multiple;

  const buildQofEText = () => {
    let text = `SETUP TAX — QUALITY OF EARNINGS ADJUSTMENT\n\n`;
    text += `This plant capacity diagnostic identifies an annual setup tax burden of approximately ${formatCurrency(setupTax)}, representing ${formatPercent(results.pctPressTimeLostToSetup)} of total available press capacity currently consumed by setup activity.\n\n`;
    text += `This setup tax burden represents a potential Quality of Earnings adjustment of approximately ${formatCurrency(setupTax)} annually. Elimination of this operational inefficiency through investment in digital print technology would increase normalized EBITDA by approximately ${formatCurrency(setupTax)} per year.\n\n`;
    text += `At an assumed transaction multiple of ${multiple}x EBITDA, the suppressed enterprise value attributable to this setup tax burden is approximately ${formatCurrency(setupTax * multiple)}.\n\n`;
    text += `Key operational metrics supporting this adjustment:\n`;
    text += `  • Annual press hours lost to setup: ${formatNumber(results.setupHoursPerYear)}\n`;
    text += `  • Press capacity consumed by setup: ${formatPercent(results.pctPressTimeLostToSetup)} (${formatNumber(results.pressEquivalentLost, 1)} press equivalents)\n`;
    text += `  • Annual setup labor cost: ${results.annualSetupLaborCost !== null ? formatCurrency(results.annualSetupLaborCost) : 'N/A'}\n`;
    text += `  • Annual setup material waste cost: ${results.annualSetupMaterialWasteCost !== null ? formatCurrency(results.annualSetupMaterialWasteCost) : 'N/A'}\n`;
    text += `  • Annual plate cost: ${results.annualPlateCost !== null ? formatCurrency(results.annualPlateCost) : '$0'}\n`;

    text += `  • Total documented setup tax: ${formatCurrency(setupTax)}\n\n`;
    text += `Modeled improvement scenario (40% setup reduction):\n`;
    text += `  • Recovered press hours: ${formatNumber(results.recoveredHours)} hours/year\n`;
    text += `  • Recovered production capacity: ${results.recoveredLinearFeet !== null ? formatNumber(results.recoveredLinearFeet) : 'N/A'} linear feet/year\n`;
    text += `  • EBITDA improvement: ${formatCurrency(setupTax * 0.4)}/year\n`;
    text += `  • Enterprise value impact at ${multiple}x: ${formatCurrency(setupTax * 0.4 * multiple)}\n\n`;
    text += `This analysis was produced using the Flexo Setup Tax Plant Capacity Audit methodology. All inputs were provided by plant management and have not been independently verified.`;
    return text;
  };

  const handleCopy = async () => {
    const text = buildQofEText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast({ title: 'QofE text copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasSetupTax) {
    return (
      <div className="space-y-5">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Complete the Inputs tab to generate M&A analysis</p>
            <p className="text-xs text-muted-foreground mt-1">Enter labor rate and setup material waste to calculate Total Setup Cost</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company &amp; Transaction Inputs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Reported Annual EBITDA ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">$</span>
                <Input
                  type="number"
                  min={0}
                  step={100000}
                  value={reportedEBITDA}
                  onChange={(e) => setReportedEBITDA(e.target.value)}
                  className="pl-7"
                  data-testid="input-reported-ebitda"
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">Enter the company's most recently reported annual EBITDA</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Assumed EBITDA Multiple (x)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={4}
                  max={12}
                  step={0.5}
                  value={ebitdaMultiple}
                  onChange={(e) => setEbitdaMultiple(e.target.value)}
                  className="pr-6"
                  data-testid="input-ebitda-multiple"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">x</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">Typical label converter multiples range from 5x–9x depending on size, growth, and customer concentration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">EBITDA Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {!hasEBITDA && (
            <p className="text-xs text-muted-foreground italic">Enter Reported Annual EBITDA above to see EBITDA impact calculations</p>
          )}
          <ComparisonTable
            headers={['Metric', 'Current Operation', '40% Improvement', 'Full Elimination']}
            rows={[
              {
                label: 'Annual Setup Tax',
                values: [
                  formatCurrency(setupTax),
                  formatCurrency(setupTax * 0.6),
                  '$0',
                ],
              },
              {
                label: 'Reported EBITDA',
                values: [
                  hasEBITDA ? formatCurrency(ebitda) : '—',
                  hasEBITDA ? formatCurrency(ebitda) : '—',
                  hasEBITDA ? formatCurrency(ebitda) : '—',
                ],
              },
              {
                label: 'Normalized EBITDA',
                values: [
                  hasEBITDA ? formatCurrency(ebitda) : '—',
                  hasEBITDA ? formatCurrency(normalizedEBITDA40) : '—',
                  hasEBITDA ? formatCurrency(normalizedEBITDAFull) : '—',
                ],
              },
              {
                label: 'EBITDA Margin Improvement',
                values: [
                  '0.0%',
                  marginImprovement40 !== null ? { text: `+${formatNumber(marginImprovement40, 1)}%`, className: 'text-emerald-600 dark:text-emerald-400' } : '—',
                  marginImprovementFull !== null ? { text: `+${formatNumber(marginImprovementFull, 1)}%`, className: 'text-emerald-600 dark:text-emerald-400' } : '—',
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Enterprise Value Impact — At {multiple}x EBITDA Multiple
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <ComparisonTable
            headers={['Metric', 'Current Operation', '40% Improvement', 'Full Elimination']}
            rows={[
              {
                label: 'EBITDA Used',
                values: [
                  hasEBITDA ? formatCurrency(ebitda) : '—',
                  hasEBITDA ? formatCurrency(normalizedEBITDA40) : '—',
                  hasEBITDA ? formatCurrency(normalizedEBITDAFull) : '—',
                ],
              },
              {
                label: 'Enterprise Value',
                values: [
                  hasEBITDA ? formatCurrency(ev_current) : '—',
                  hasEBITDA ? formatCurrency(ev_40) : '—',
                  hasEBITDA ? formatCurrency(ev_full) : '—',
                ],
              },
              {
                label: 'Value Creation vs Current',
                values: [
                  '—',
                  hasEBITDA ? { text: `+${formatCurrency(ev_40 - ev_current)}`, className: 'text-emerald-600 dark:text-emerald-400' } : '—',
                  hasEBITDA ? { text: `+${formatCurrency(ev_full - ev_current)}`, className: 'text-emerald-600 dark:text-emerald-400' } : '—',
                ],
              },
            ]}
          />
          <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm leading-relaxed text-foreground/80" data-testid="callout-ev-impact">
            {hasEBITDA ? (
              <>The documented setup tax of <span className="font-semibold">{formatCurrency(setupTax)}</span> represents approximately <span className="font-semibold">{formatCurrency(setupTax * multiple)}</span> in suppressed enterprise value at <span className="font-semibold">{multiple}x</span> EBITDA. Full elimination would increase normalized enterprise value by approximately <span className="font-semibold">{formatCurrency(setupTax * multiple)}</span>.</>
            ) : (
              <>The documented setup tax of <span className="font-semibold">{formatCurrency(setupTax)}</span> represents approximately <span className="font-semibold">{formatCurrency(setupTax * multiple)}</span> in suppressed enterprise value at <span className="font-semibold">{multiple}x</span> EBITDA.</>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Diligence Summary</CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">For use in M&A due diligence, QofE analysis, or investor presentations</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="rounded-md bg-muted/40 border p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/80" data-testid="text-qofe">
            {buildQofEText()}
          </div>
          <Button
            variant="secondary"
            onClick={handleCopy}
            className="justify-start"
            data-testid="btn-copy-qofe"
          >
            {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy QofE Text'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

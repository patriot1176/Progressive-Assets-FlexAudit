import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { type AuditInputs, type AuditResults, formatCurrency, formatNumber } from "@/lib/calculations";

interface Props {
  inputs: AuditInputs;
  results: AuditResults;
}

function n(s: string): number { return parseFloat(s) || 0; }

const SHORT_RUN_LENGTHS = [500, 1000, 2500, 5000];

type PositionType = 'red' | 'orange' | 'yellow' | 'green' | 'unknown';

function getSetupRunRatio(setupMinutes: number, pressSpeedFPM: number | null, runLengthFt: number): number | null {
  if (!pressSpeedFPM || pressSpeedFPM <= 0) return null;
  const runTimeMin = runLengthFt / pressSpeedFPM;
  return setupMinutes / runTimeMin;
}

function getPosition(setupMinutes: number, pressSpeedFPM: number | null, runLengthFt: number): PositionType {
  const ratio = getSetupRunRatio(setupMinutes, pressSpeedFPM, runLengthFt);
  if (ratio === null) return 'unknown';
  if (ratio > 1.0) return 'red';
  if (ratio >= 0.5) return 'orange';
  if (ratio >= 0.25) return 'yellow';
  return 'green';
}

function PositionBadge({ pos }: { pos: PositionType }) {
  if (pos === 'unknown') return <span className="text-muted-foreground text-xs">—</span>;
  const configs: Record<Exclude<PositionType, 'unknown'>, { label: string; cls: string }> = {
    red:    { label: 'Uncompetitive', cls: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' },
    orange: { label: 'At Risk',       cls: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900' },
    yellow: { label: 'Marginal',      cls: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900' },
    green:  { label: 'Competitive',   cls: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' },
  };
  const { label, cls } = configs[pos];
  return <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap', cls)}>{label}</span>;
}

export function MarketRiskSection({ inputs, results }: Props) {
  const [jobsLostPerMonth, setJobsLostPerMonth] = useState('0');
  const [avgJobValue, setAvgJobValue] = useState('0');
  const [avgRunLengthLost, setAvgRunLengthLost] = useState('0');
  const [annualRevEst, setAnnualRevEst] = useState('0');

  const setupTax = results.setupTaxPerChangeover;
  const pricePerFoot = inputs.pricePerFoot;

  const calcJobsRevenue = n(jobsLostPerMonth) * 12 * n(avgJobValue);
  const annualRevenueLost = calcJobsRevenue > 0
    ? calcJobsRevenue
    : n(annualRevEst) > 0 ? n(annualRevEst) : 0;

  const breakEvenFt = setupTax !== null && pricePerFoot !== null && pricePerFoot > 0
    ? Math.ceil(setupTax / pricePerFoot)
    : null;

  const hasRevenueLost = annualRevenueLost > 0;
  const annualRevBase = results.recoveredLinearFeet !== null && pricePerFoot !== null
    ? results.recoveredLinearFeet * pricePerFoot
    : null;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Competitive Exposure Inputs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Estimated Jobs Lost to Digital Competitors per Month</Label>
              <Input type="number" min={0} step={1} value={jobsLostPerMonth}
                onChange={(e) => setJobsLostPerMonth(e.target.value)}
                data-testid="input-jobs-lost-per-month" />
              <p className="text-[10px] text-muted-foreground leading-snug">Jobs you know or suspect are going to competitors running digital label presses. Leave at 0 if unknown and use the manual revenue estimate below.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Average Value of Lost Job ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">$</span>
                <Input type="number" min={0} step={100} value={avgJobValue}
                  onChange={(e) => setAvgJobValue(e.target.value)}
                  className="pl-7"
                  data-testid="input-avg-job-value" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">Average revenue per job you are losing to digital competitors</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Average Run Length of Lost Jobs (ft)</Label>
              <Input type="number" min={0} step={100} value={avgRunLengthLost}
                onChange={(e) => setAvgRunLengthLost(e.target.value)}
                data-testid="input-avg-run-length-lost" />
              <p className="text-[10px] text-muted-foreground leading-snug">Typical footage of jobs being lost to digital competitors — usually short run jobs under 5,000 ft</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Estimated Annual Revenue Lost to Digital Competition ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">$</span>
                <Input type="number" min={0} step={10000} value={annualRevEst}
                  onChange={(e) => setAnnualRevEst(e.target.value)}
                  className="pl-7"
                  data-testid="input-annual-rev-est" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">If you do not know jobs lost per month enter your best estimate of total annual revenue lost to digital competitors directly here. This field is used if jobs per month and average job value are both 0.</p>
            </div>
          </div>
          <div className="rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-xs text-foreground/80 leading-relaxed">
            Do not know your lost job numbers? That is common. Most converters do not formally track lost opportunities. Enter your best estimate in the annual revenue field above, or leave all fields at 0 to see the structural competitive risk analysis below based on your current job economics.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue Leakage Analysis</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!hasRevenueLost && (
            <p className="text-xs text-muted-foreground italic mb-4">Enter estimated lost jobs or revenue above to calculate revenue leakage</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="rounded-md border bg-muted/40 p-4 space-y-1" data-testid="card-annual-rev-lost">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Annual Revenue Lost to Digital Competitors</p>
              <p className="text-2xl font-bold">{formatCurrency(annualRevenueLost)}</p>
            </div>
            <div className="rounded-md border bg-muted/40 p-4 space-y-1" data-testid="card-pct-current-rev">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">As % of Recoverable Revenue</p>
              {annualRevBase !== null && annualRevBase > 0 ? (
                <p className="text-2xl font-bold">{((annualRevenueLost / annualRevBase) * 100).toFixed(1)}%</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Enter selling price in Plant Config to calculate</p>
              )}
            </div>
            <div className="rounded-md border bg-muted/40 p-4 space-y-1" data-testid="card-5yr-leakage">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">5-Year Cumulative Revenue Leakage</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(annualRevenueLost * 5)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why Your Current Fleet Cannot Compete on Short Runs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {inputs.pressSpeedFPM === null && (
            <p className="text-xs text-amber-600 dark:text-amber-400 italic">Enter press speed in Plant Config to see competitive position analysis.</p>
          )}
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[380px] text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Job Length</th>
                    <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Flexo Setup Cost/Job</th>
                    <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Flexo Eff. Cost/ft</th>
                    <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Flexo Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {SHORT_RUN_LENGTHS.map((len) => {
                    const pos = getPosition(inputs.setupMinutesPerChangeover, inputs.pressSpeedFPM, len);
                    const flexoEffCost = setupTax !== null && pricePerFoot !== null
                      ? pricePerFoot + setupTax / len
                      : null;
                    const rowBg = pos === 'red'    ? 'bg-red-50 dark:bg-red-950/20' :
                                  pos === 'orange' ? 'bg-orange-50 dark:bg-orange-950/20' :
                                  pos === 'yellow' ? 'bg-amber-50 dark:bg-amber-950/20' :
                                  pos === 'green'  ? 'bg-emerald-50 dark:bg-emerald-950/20' : '';
                    return (
                      <tr key={len} className={cn('text-sm', rowBg)}>
                        <td className="py-2.5 px-3 font-medium whitespace-nowrap">{len.toLocaleString()} ft</td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {setupTax !== null ? formatCurrency(setupTax) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {flexoEffCost !== null ? `$${flexoEffCost.toFixed(4)}/ft` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <PositionBadge pos={pos} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-400 dark:bg-emerald-900 dark:border-emerald-700" />Competitive: Setup:Run ratio &lt; 25%</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-200 border border-amber-400 dark:bg-amber-900 dark:border-amber-700" />Marginal: Setup:Run ratio 25–50%</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-200 border border-orange-400 dark:bg-orange-900 dark:border-orange-700" />At Risk: Setup:Run ratio 50–100%</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-200 border border-red-400 dark:bg-red-900 dark:border-red-700" />Uncompetitive: Setup:Run ratio &gt; 100%</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A digital competitor quoting these same jobs has zero setup cost. The Setup:Run ratio shows how much of your press time is consumed by setup on each job length. Any ratio above 25% creates a structural pricing disadvantage against a competitor with no setup cost.
          </p>
        </CardContent>
      </Card>

      <div className={cn(
        'rounded-md border px-4 py-4 text-sm leading-relaxed',
        hasRevenueLost
          ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-foreground/80'
          : 'border-muted bg-muted/40 text-muted-foreground'
      )} data-testid="callout-market-risk-summary">
        {hasRevenueLost ? (
          <>Based on your inputs this operation has an estimated <span className="font-semibold">{formatCurrency(annualRevenueLost)}</span> in annual revenue exposure to digital competition. The short run jobs most vulnerable to digital displacement represent your highest setup tax burden — the same jobs where your effective cost per foot is least competitive. The V12 eliminates this structural disadvantage entirely.</>
        ) : (
          <>Enter your estimated lost job data above to quantify your revenue exposure. Even without specific lost job data the structural pricing disadvantage on short runs is documented in the Job Economics tab.</>
        )}
      </div>
    </div>
  );
}

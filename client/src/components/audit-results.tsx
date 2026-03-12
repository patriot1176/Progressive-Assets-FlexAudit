import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList, Tooltip } from "recharts";
import { Clock, Percent, Layers, Users, DollarSign, TrendingUp, Ruler, Banknote, Trash2, AlertTriangle, Package, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AuditInputs, type AuditResults, formatNumber, formatCurrency, formatPercent } from "@/lib/calculations";
import { BenchmarkPanel } from "@/components/benchmark-panel";

interface Props {
  inputs: AuditInputs;
  results: AuditResults;
  showBenchmark: boolean;
}

type AccentType = 'loss' | 'recovery' | 'neutral';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description?: string;
  accent?: AccentType;
  testId: string;
  large?: boolean;
}

function MetricCard({ icon: Icon, label, value, description, accent = 'neutral', testId, large }: MetricCardProps) {
  return (
    <Card className={cn(large && "sm:col-span-2 lg:col-span-1")} data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-md flex-shrink-0",
            accent === 'loss' && "bg-red-500/10 dark:bg-red-400/10",
            accent === 'recovery' && "bg-emerald-500/10 dark:bg-emerald-400/10",
            accent === 'neutral' && "bg-primary/10",
          )}>
            <Icon className={cn(
              "w-5 h-5",
              accent === 'loss' && "text-red-600 dark:text-red-400",
              accent === 'recovery' && "text-emerald-600 dark:text-emerald-400",
              accent === 'neutral' && "text-primary",
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider leading-tight">{label}</p>
            <p className={cn(
              "font-bold tracking-tight mt-1",
              large ? "text-3xl" : "text-2xl"
            )}>{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const chartLabelFormatter = (v: number) => formatNumber(v);

export function AuditResultsSection({ inputs, results, showBenchmark }: Props) {
  const [systemName, setSystemName] = useState('');
  const [systemCost, setSystemCost] = useState('0');
  const systemCostNum = parseFloat(systemCost) || 0;
  const annualChangeovers = inputs.presses * inputs.changeoversPerPressPerDay * inputs.operatingDaysPerYear;

  const chartData = [
    { name: 'Setup Hours Lost', hours: Math.round(results.setupHoursPerYear) },
    { name: 'Recovered Hours', hours: Math.round(results.recoveredHours) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard
          icon={Clock}
          label="Annual Setup Hours Lost"
          value={formatNumber(results.setupHoursPerYear)}
          description="hours / year"
          accent="loss"
          testId="card-setup-hours"
          large
        />
        <MetricCard
          icon={Percent}
          label="% Press Time Lost"
          value={formatPercent(results.pctPressTimeLostToSetup)}
          description="of available press time"
          accent="loss"
          testId="card-pct-lost"
        />
        <MetricCard
          icon={Layers}
          label="Press Capacity Lost to Setup"
          value={formatNumber(results.pressEquivalentLost, 1)}
          description="presses"
          accent="loss"
          testId="card-press-equiv"
        />
        <MetricCard
          icon={Users}
          label="FTE Equivalent"
          value={formatNumber(results.fteEquivalent, 1)}
          description="full-time equivalents"
          accent="neutral"
          testId="card-fte"
        />
        {results.annualSetupLaborCost !== null && (
          <MetricCard
            icon={DollarSign}
            label="Annual Setup Labor Cost"
            value={formatCurrency(results.annualSetupLaborCost)}
            description="labor cost / year"
            accent="loss"
            testId="card-labor-cost"
          />
        )}
        {results.wasteCostPerSetup !== null && (
          <MetricCard
            icon={Trash2}
            label="Material Waste Cost per Changeover"
            value={formatCurrency(results.wasteCostPerSetup)}
            description="per changeover"
            accent="loss"
            testId="card-waste-per-setup"
          />
        )}
        {results.annualSetupMaterialWasteCost !== null && (
          <MetricCard
            icon={Trash2}
            label="Annual Setup Material Waste Cost"
            value={formatCurrency(results.annualSetupMaterialWasteCost)}
            description="waste cost / year"
            accent="loss"
            testId="card-material-waste"
          />
        )}
        {results.plateCostPerChangeover !== null && (
          <MetricCard
            icon={DollarSign}
            label="Plate Cost per Changeover"
            value={formatCurrency(results.plateCostPerChangeover)}
            description="per changeover"
            accent="loss"
            testId="card-plate-cost-per-changeover"
          />
        )}
        {results.annualPlateCost !== null && (
          <MetricCard
            icon={DollarSign}
            label="Annual Plate Cost"
            value={formatCurrency(results.annualPlateCost)}
            description="plate cost / year"
            accent="loss"
            testId="card-annual-plate-cost"
          />
        )}
        {inputs.consumablesPerChangeover !== null && inputs.consumablesPerChangeover > 0 && (
          <MetricCard
            icon={Package}
            label="Consumables Cost per Changeover"
            value={formatCurrency(inputs.consumablesPerChangeover)}
            description="per changeover"
            accent="loss"
            testId="card-consumables-per-changeover"
          />
        )}
        {results.annualConsumablesCost !== null && (
          <MetricCard
            icon={Package}
            label="Annual Consumables Cost"
            value={formatCurrency(results.annualConsumablesCost)}
            description="consumables / year"
            accent="loss"
            testId="card-annual-consumables-cost"
          />
        )}
        {results.annualOvertimeCost !== null && (
          <MetricCard
            icon={DollarSign}
            label="Annual Overtime Cost"
            value={formatCurrency(results.annualOvertimeCost)}
            description="setup-attributed overtime / year"
            accent="loss"
            testId="card-annual-overtime-cost"
          />
        )}
        {results.premiumSubstrateWasteCostPerChangeover !== null && (
          <MetricCard
            icon={Trash2}
            label="Premium Substrate Waste per Changeover"
            value={formatCurrency(results.premiumSubstrateWasteCostPerChangeover)}
            description="per changeover"
            accent="loss"
            testId="card-premium-substrate-per-changeover"
          />
        )}
        {results.annualPremiumSubstrateWasteCost !== null && (
          <MetricCard
            icon={Trash2}
            label="Annual Premium Substrate Waste Cost"
            value={formatCurrency(results.annualPremiumSubstrateWasteCost)}
            description="premium substrate waste / year"
            accent="loss"
            testId="card-annual-premium-substrate-waste"
          />
        )}
        {results.totalSetupCost !== null && (
          <MetricCard
            icon={DollarSign}
            label="Total Setup Cost"
            value={formatCurrency(results.totalSetupCost)}
            description="labor + material waste + plate cost + consumables + overtime + premium substrate / year"
            accent="loss"
            testId="card-total-setup-cost"
          />
        )}
        {results.setupTaxPerChangeover !== null && (
          <MetricCard
            icon={DollarSign}
            label="Setup Tax per Changeover"
            value={formatCurrency(results.setupTaxPerChangeover)}
            description="average labor + material cost per changeover"
            accent="loss"
            testId="card-setup-tax-per-changeover"
          />
        )}
        <MetricCard
          icon={TrendingUp}
          label={`Recovered Production Hours (${inputs.reductionPct}% Setup Reduction)`}
          value={formatNumber(results.recoveredHours)}
          accent="recovery"
          testId="card-recovered-hours"
        />
        {results.recoveredLinearFeet !== null && (
          <MetricCard
            icon={Ruler}
            label="Recovered Linear Feet"
            value={formatNumber(results.recoveredLinearFeet)}
            description="feet / year"
            accent="recovery"
            testId="card-recovered-feet"
          />
        )}
        {results.potentialRevenueCapacity !== null && (
          <MetricCard
            icon={Banknote}
            label="Opportunity Cost (Unused Production Capacity)"
            value={formatCurrency(results.potentialRevenueCapacity)}
            description="at current $/ft input"
            accent="recovery"
            testId="card-revenue"
          />
        )}
        {results.totalSetupImpact !== null && (
          <MetricCard
            icon={AlertTriangle}
            label="Total Setup Impact"
            value={formatCurrency(results.totalSetupImpact)}
            description="Direct setup costs plus unrealized production revenue resulting from press capacity lost to setup activity."
            accent="loss"
            testId="card-total-setup-impact"
            large
          />
        )}
      </div>

      {showBenchmark && <BenchmarkPanel inputs={inputs} results={results} />}

      <Card data-testid="card-estimating-comparison">
        <CardContent className="p-5 sm:p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Estimating System Comparison
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Estimating System Name</Label>
              <Input
                type="text"
                placeholder="e.g. Labeltraxx, CERM, Radius..."
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                data-testid="input-system-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Estimated Setup Cost per Job in Your System ($)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={systemCost}
                onChange={(e) => setSystemCost(e.target.value)}
                data-testid="input-system-cost"
              />
            </div>
          </div>
          {systemCostNum > 0 && (
            results.setupTaxPerChangeover === null ? (
              <p className="text-sm text-muted-foreground italic">Complete the optional financial inputs (labor rate and material waste) above to enable cost comparison.</p>
            ) : (() => {
              const gapPerChangeover = results.setupTaxPerChangeover - systemCostNum;
              const annualSystemCost = systemCostNum * annualChangeovers;
              const annualUnrecovered = gapPerChangeover * annualChangeovers;
              const isUnderpriced = gapPerChangeover > 0;
              const displayName = systemName.trim() || 'estimating system';
              const auditAnnualCost = results.totalSetupCost ?? results.setupTaxPerChangeover * annualChangeovers;
              return (
                <>
                  <div className="border rounded-md overflow-hidden mb-4" data-testid="table-estimating-comparison">
                    <div className="grid grid-cols-3 bg-muted/50 px-4 py-2 border-b text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Metric</span>
                      <span className="text-right">{systemName.trim() || 'Your System'}</span>
                      <span className="text-right">This Audit</span>
                    </div>
                    <div className="divide-y text-sm">
                      <div className="grid grid-cols-3 px-4 py-2.5">
                        <span className="text-muted-foreground">Setup Cost per Changeover</span>
                        <span className="text-right font-medium">{formatCurrency(systemCostNum)}/job</span>
                        <span className="text-right font-medium">{formatCurrency(results.setupTaxPerChangeover)}/job</span>
                      </div>
                      <div className="grid grid-cols-3 px-4 py-2.5">
                        <span className="text-muted-foreground">Annual Setup Cost</span>
                        <span className="text-right font-medium">{formatCurrency(annualSystemCost)}/yr</span>
                        <span className="text-right font-medium">{formatCurrency(auditAnnualCost)}/yr</span>
                      </div>
                      <div className="grid grid-cols-3 px-4 py-2.5">
                        <span className="text-muted-foreground">Gap per Changeover</span>
                        <span className="text-right text-muted-foreground">—</span>
                        <span className={cn("text-right font-semibold", gapPerChangeover > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                          {gapPerChangeover > 0 ? '+' : ''}{formatCurrency(gapPerChangeover)}/job
                        </span>
                      </div>
                      <div className="grid grid-cols-3 px-4 py-2.5">
                        <span className="text-muted-foreground">Annual Unrecovered Cost</span>
                        <span className="text-right text-muted-foreground">—</span>
                        <span className={cn("text-right font-semibold", annualUnrecovered > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                          {annualUnrecovered > 0 ? '+' : ''}{formatCurrency(annualUnrecovered)}/yr
                        </span>
                      </div>
                    </div>
                  </div>
                  {isUnderpriced ? (
                    <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-sm leading-relaxed text-foreground/80" data-testid="callout-comparison">
                      Your <span className="font-semibold">{displayName}</span> is pricing setup at <span className="font-semibold">{formatCurrency(systemCostNum)}/job</span>. This audit calculates your actual setup cost at <span className="font-semibold">{formatCurrency(results.setupTaxPerChangeover)}/job</span>. That's a <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(gapPerChangeover)}/job</span> gap across <span className="font-semibold">{formatNumber(annualChangeovers)}</span> annual changeovers — <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(annualUnrecovered)}</span> in unrecovered setup cost annually that may not be captured in your quotes.
                    </div>
                  ) : (
                    <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-sm leading-relaxed text-foreground/80" data-testid="callout-comparison">
                      Your estimating system is pricing setup above this audit's calculated cost — your quotes may already be capturing full setup cost.
                    </div>
                  )}
                </>
              );
            })()
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
            Annual Press Time Lost to Setup
          </h3>
          <div className="h-72 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                  formatter={(v: number) => [formatNumber(v) + ' hrs', '']}
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  <Cell fill="hsl(var(--chart-4))" />
                  <Cell fill="hsl(var(--chart-3))" />
                  <LabelList
                    dataKey="hours"
                    position="top"
                    formatter={chartLabelFormatter}
                    style={{ fontSize: '13px', fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4" data-testid="section-v12-upside">
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t-2 border-dashed border-muted-foreground/20" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            V12 Capacity Upside &mdash; Not Included in ROI Calculation
          </h3>
          <div className="flex-1 border-t-2 border-dashed border-muted-foreground/20" />
        </div>
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-md border px-4 py-3 leading-relaxed">
          The following represents additional value potential beyond the documented setup tax ROI. These factors are deliberately excluded from the payback calculation to maintain conservative, defensible numbers.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1 — Production Speed Advantage */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">V12 vs Current Fleet Speed</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Flexo</p>
                  <p className="font-bold">{inputs.pressSpeedFPM !== null ? `${inputs.pressSpeedFPM} fpm` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V12</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">400 fpm</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Advantage</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {inputs.pressSpeedFPM !== null && inputs.pressSpeedFPM > 0
                      ? `${(400 / inputs.pressSpeedFPM).toFixed(1)}x faster`
                      : '—'}
                  </p>
                </div>
              </div>
              {inputs.pressSpeedFPM !== null && inputs.pressSpeedFPM > 0 && (
                <p className="text-[10px] text-muted-foreground leading-snug">
                  At 400 fpm the V12 produces {Math.round((400 / inputs.pressSpeedFPM - 1) * 100)}% more linear footage per hour than your current fleet average.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card 2 — Non-Stop Production */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annual Changeover Downtime Eliminated</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current</p>
                  <p className="font-bold text-red-600 dark:text-red-400">{formatNumber(results.setupHoursPerYear)} hrs of press stops/yr</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V12</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">0 press stops</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                The V12 runs job-to-job without stopping. Every hour currently lost to changeover becomes continuous billable production time.
              </p>
            </CardContent>
          </Card>

          {/* Card 3 — Short Run Profitability */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Jobs Currently Below Break-Even</p>
              {results.setupTaxPerChangeover !== null && inputs.pricePerFoot !== null && inputs.pricePerFoot > 0 ? (() => {
                const breakEvenFt = Math.ceil(results.setupTaxPerChangeover / inputs.pricePerFoot!);
                return (
                  <>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">Break-even: {formatNumber(breakEvenFt)} ft</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      Jobs under {formatNumber(breakEvenFt)} ft are currently unprofitable on flexo after plate cost. On the V12 every run length is profitable regardless of footage.
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-snug italic">
                      Break-even footage assumes current plate cost structure. V12 plate cost is $0.
                    </p>
                  </>
                );
              })() : (
                <p className="text-xs text-muted-foreground italic">Enter labor rate, material waste, and selling price in Plant Config to calculate break-even footage.</p>
              )}
            </CardContent>
          </Card>

          {/* Card 4 — New Revenue Potential */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recovered Capacity Revenue Potential</p>
              {results.recoveredLinearFeet !== null ? (
                <>
                  <p className="text-sm"><span className="font-bold">{formatNumber(results.recoveredLinearFeet)}</span> <span className="text-muted-foreground">ft of recovered annual capacity</span></p>
                  {inputs.pricePerFoot !== null ? (
                    <p className="text-sm">At current selling price: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(results.recoveredLinearFeet * inputs.pricePerFoot)}</span></p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Enter selling price in Plant Config to calculate revenue potential.</p>
                  )}
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    This represents the revenue potential of recovered press capacity at current selling price. Actual capture depends on demand and job mix.
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">Enter press speed and selling price in Plant Config to calculate recovered capacity revenue.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm leading-relaxed text-foreground/80" data-testid="callout-v12-upside">
          The 3.3-year payback documented above is calculated using setup tax elimination only. Speed advantage, non-stop production, short run profitability improvement, and new revenue potential from recovered capacity are all additional upside that are deliberately not included in the conservative ROI calculation.
        </div>
      </div>
    </div>
  );
}

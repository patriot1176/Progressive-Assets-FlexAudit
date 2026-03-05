import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList, Tooltip } from "recharts";
import { Clock, Percent, Layers, Users, DollarSign, TrendingUp, Ruler, Banknote, Trash2, AlertTriangle, type LucideIcon } from "lucide-react";
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
            label="Waste Cost per Setup"
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
        {results.totalSetupCost !== null && (
          <MetricCard
            icon={DollarSign}
            label="Total Setup Cost"
            value={formatCurrency(results.totalSetupCost)}
            description="labor + material waste / year"
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
            description="direct setup costs plus unrealized production value from lost capacity"
            accent="loss"
            testId="card-total-setup-impact"
            large
          />
        )}
      </div>

      {showBenchmark && <BenchmarkPanel inputs={inputs} results={results} />}

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
    </div>
  );
}

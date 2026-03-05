import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AuditInputs,
  type AuditResults,
  type OperatingMode,
  formatNumber,
  formatCurrency,
  formatPercent,
} from "@/lib/calculations";

interface V12ComparisonProps {
  inputs: AuditInputs;
  results: AuditResults;
  mode: OperatingMode;
}

function MetricRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">
        {value}{unit ? <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span> : null}
      </span>
    </div>
  );
}

function DeltaRow({ label, current, modeled, formatter }: { label: string; current: number; modeled: number; formatter: (n: number) => string }) {
  const diff = modeled - current;
  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const color = label.toLowerCase().includes('labor cost') || label.toLowerCase().includes('setup hours')
    ? (isNegative ? 'text-emerald-600 dark:text-emerald-400' : isPositive ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')
    : (isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground');

  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>
        {diff > 0 ? '+' : ''}{formatter(diff)}
      </span>
    </div>
  );
}

export function V12ComparisonSection({ inputs, results }: V12ComparisonProps) {
  const [v12SetupTime, setV12SetupTime] = useState<string>('');
  const [v12FPM, setV12FPM] = useState<string>('');

  const v12SetupTimeNum = v12SetupTime !== '' ? parseFloat(v12SetupTime) : null;
  const v12FPMNum = v12FPM !== '' ? parseFloat(v12FPM) : null;

  const isValid = v12SetupTimeNum !== null && !isNaN(v12SetupTimeNum) && v12SetupTimeNum > 0
    && v12FPMNum !== null && !isNaN(v12FPMNum) && v12FPMNum > 0;

  let v12Results: {
    annualSetupHoursLost: number;
    pctPressTimeLost: number;
    pressEquivalentLost: number;
    annualSetupLaborCost: number | null;
    recoveredHours: number;
    recoveredFeet: number | null;
    revenueCapacity: number | null;
  } | null = null;

  if (isValid && v12SetupTimeNum && v12FPMNum) {
    const annualChangeovers = inputs.presses * inputs.changeoversPerPressPerDay * inputs.shiftsPerDay * inputs.operatingDaysPerYear;
    const v12AnnualSetupHoursLost = (annualChangeovers * v12SetupTimeNum) / 60;
    const v12PctPressTimeLost = results.totalAvailablePlantPressHoursPerYear > 0
      ? v12AnnualSetupHoursLost / results.totalAvailablePlantPressHoursPerYear
      : 0;
    const v12PressEquivalentLost = v12AnnualSetupHoursLost / 6500;
    const v12AnnualSetupLaborCost = inputs.laborRate !== null ? v12AnnualSetupHoursLost * inputs.laborRate : null;
    const v12RecoveredHours = Math.max(results.setupHoursPerYear - v12AnnualSetupHoursLost, 0);
    const v12RecoveredFeet = v12RecoveredHours * 60 * v12FPMNum;
    const v12RevenueCapacity = inputs.pricePerFoot !== null ? v12RecoveredFeet * inputs.pricePerFoot : null;

    v12Results = {
      annualSetupHoursLost: v12AnnualSetupHoursLost,
      pctPressTimeLost: v12PctPressTimeLost,
      pressEquivalentLost: v12PressEquivalentLost,
      annualSetupLaborCost: v12AnnualSetupLaborCost,
      recoveredHours: v12RecoveredHours,
      recoveredFeet: v12RecoveredFeet,
      revenueCapacity: v12RevenueCapacity,
    };
  }

  const handleSelectAll = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => e.target.select(), 0);
  };

  return (
    <div className="space-y-5" data-testid="v12-comparison-section">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card data-testid="card-current-audit">
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Current (from Audit)</h3>
            <div className="space-y-0">
              <MetricRow label="Annual Setup Hours Lost" value={formatNumber(results.setupHoursPerYear)} unit="hrs/yr" />
              <MetricRow label="% Press Time Lost" value={formatPercent(results.pctPressTimeLostToSetup)} />
              <MetricRow label="Equivalent Press Capacity Lost" value={formatNumber(results.pressEquivalentLost, 1)} unit="presses" />
              {results.annualSetupLaborCost !== null && (
                <MetricRow label="Annual Setup Labor Cost" value={formatCurrency(results.annualSetupLaborCost)} />
              )}
              <MetricRow label={`Recovered Hours @ ${inputs.reductionPct}%`} value={formatNumber(results.recoveredHours)} unit="hrs/yr" />
              {results.recoveredLinearFeet !== null && (
                <MetricRow label="Recovered Feet" value={formatNumber(results.recoveredLinearFeet)} unit="ft" />
              )}
              {results.potentialRevenueCapacity !== null && (
                <MetricRow label="Potential Revenue Capacity" value={formatCurrency(results.potentialRevenueCapacity)} />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card data-testid="card-v12-inputs">
            <CardContent className="p-5 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">V12 Inputs</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="v12-setup-time" className="text-xs text-muted-foreground">V12 Setup Time (min)</Label>
                  <Input
                    id="v12-setup-time"
                    type="number"
                    inputMode="decimal"
                    placeholder="Enter minutes"
                    value={v12SetupTime}
                    onChange={(e) => setV12SetupTime(e.target.value)}
                    onFocus={handleSelectAll}
                    className="mt-1"
                    data-testid="input-v12-setup-time"
                  />
                </div>
                <div>
                  <Label htmlFor="v12-fpm" className="text-xs text-muted-foreground">V12 Feet per Minute (ft/min)</Label>
                  <Input
                    id="v12-fpm"
                    type="number"
                    inputMode="decimal"
                    placeholder="Enter ft/min"
                    value={v12FPM}
                    onChange={(e) => setV12FPM(e.target.value)}
                    onFocus={handleSelectAll}
                    className="mt-1"
                    data-testid="input-v12-fpm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {!isValid && (
            <Card data-testid="card-v12-placeholder">
              <CardContent className="p-5 sm:p-6">
                <p className="text-sm text-muted-foreground text-center">Enter both V12 inputs to compute the modeled scenario.</p>
              </CardContent>
            </Card>
          )}

          {isValid && v12Results && (
            <Card data-testid="card-v12-modeled">
              <CardContent className="p-5 sm:p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Modeled with V12</h3>
                <div className="space-y-0">
                  <MetricRow label="Annual Setup Hours Lost" value={formatNumber(v12Results.annualSetupHoursLost)} unit="hrs/yr" />
                  <MetricRow label="% Press Time Lost" value={formatPercent(v12Results.pctPressTimeLost)} />
                  <MetricRow label="Equivalent Press Capacity Lost" value={formatNumber(v12Results.pressEquivalentLost, 1)} unit="presses" />
                  {v12Results.annualSetupLaborCost !== null && (
                    <MetricRow label="Annual Setup Labor Cost" value={formatCurrency(v12Results.annualSetupLaborCost)} />
                  )}
                  <MetricRow label="Recovered Hours" value={formatNumber(v12Results.recoveredHours)} unit="hrs/yr" />
                  {v12Results.recoveredFeet !== null && (
                    <MetricRow label="Recovered Feet" value={formatNumber(v12Results.recoveredFeet)} unit="ft" />
                  )}
                  {v12Results.revenueCapacity !== null && (
                    <MetricRow label="Potential Revenue Capacity" value={formatCurrency(v12Results.revenueCapacity)} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {isValid && v12Results && (
        <Card data-testid="card-v12-difference">
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Difference (V12 − Current)</h3>
            <div className="space-y-0">
              <DeltaRow
                label="Recovered Hours"
                current={results.recoveredHours}
                modeled={v12Results.recoveredHours}
                formatter={(n) => formatNumber(Math.abs(n)) + ' hrs/yr'}
              />
              {v12Results.recoveredFeet !== null && results.recoveredLinearFeet !== null && (
                <DeltaRow
                  label="Recovered Feet"
                  current={results.recoveredLinearFeet}
                  modeled={v12Results.recoveredFeet}
                  formatter={(n) => formatNumber(Math.abs(n)) + ' ft'}
                />
              )}
              {v12Results.revenueCapacity !== null && results.potentialRevenueCapacity !== null && (
                <DeltaRow
                  label="Revenue Capacity"
                  current={results.potentialRevenueCapacity}
                  modeled={v12Results.revenueCapacity}
                  formatter={(n) => formatCurrency(Math.abs(n))}
                />
              )}
              {v12Results.annualSetupLaborCost !== null && results.annualSetupLaborCost !== null && (
                <DeltaRow
                  label="Annual Setup Labor Cost"
                  current={results.annualSetupLaborCost}
                  modeled={v12Results.annualSetupLaborCost}
                  formatter={(n) => formatCurrency(Math.abs(n))}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed" data-testid="text-v12-disclaimer">
        Modeled comparison for planning purposes. Actual results depend on mix, scheduling, and operating discipline.
      </p>
    </div>
  );
}

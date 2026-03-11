import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type AuditInputs, type AuditResults, type OperatingMode, getModePresets, formatCurrency } from "@/lib/calculations";

interface Props {
  inputs: AuditInputs;
  results: AuditResults;
  mode: OperatingMode;
}

const FIXED_RUN_LENGTHS = [500, 1000, 2500, 5000, 10000, 50000];

function calcRow(runLengthFt: number, inputs: AuditInputs, results: AuditResults, mode: OperatingMode) {
  const { setupMultiplier } = getModePresets(mode);
  const effectiveSetupMin = inputs.setupMinutesPerChangeover * setupMultiplier;

  const runTimeMin = inputs.pressSpeedFPM !== null && inputs.pressSpeedFPM > 0
    ? runLengthFt / inputs.pressSpeedFPM
    : null;

  const setupRunRatio = runTimeMin !== null ? effectiveSetupMin / runTimeMin : null;

  const setupCostPerJob = results.setupTaxPerChangeover;

  const jobValue = inputs.pricePerFoot !== null ? runLengthFt * inputs.pricePerFoot : null;
  const setupPctOfJobValue = setupCostPerJob !== null && jobValue !== null && jobValue > 0
    ? (setupCostPerJob / jobValue) * 100
    : null;

  const effectiveCostPerFoot = setupCostPerJob !== null && inputs.pricePerFoot !== null
    ? inputs.pricePerFoot + setupCostPerJob / runLengthFt
    : null;

  let colorClass = '';
  if (setupRunRatio !== null) {
    if (setupRunRatio > 1) colorClass = 'red';
    else if (setupRunRatio >= 0.5) colorClass = 'yellow';
    else colorClass = 'green';
  }

  return { runTimeMin, setupRunRatio, setupCostPerJob, setupPctOfJobValue, effectiveCostPerFoot, colorClass };
}

function fmt(v: number | null, decimals = 1, suffix = '') {
  if (v === null) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
}

function fmtPct(v: number | null) {
  if (v === null) return '—';
  return v.toFixed(1) + '%';
}

interface RowData {
  runLengthFt: number;
  runTimeMin: number | null;
  setupRunRatio: number | null;
  setupCostPerJob: number | null;
  setupPctOfJobValue: number | null;
  effectiveCostPerFoot: number | null;
  colorClass: string;
}

function TableRow({ row, label }: { row: RowData; label: string }) {
  const bg =
    row.colorClass === 'red' ? 'bg-red-50 dark:bg-red-950/30' :
    row.colorClass === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-950/30' :
    row.colorClass === 'green' ? 'bg-green-50 dark:bg-green-950/20' :
    '';

  const ratioColor =
    row.colorClass === 'red' ? 'text-red-600 dark:text-red-400 font-semibold' :
    row.colorClass === 'yellow' ? 'text-yellow-600 dark:text-yellow-400 font-semibold' :
    row.colorClass === 'green' ? 'text-green-700 dark:text-green-400 font-semibold' :
    '';

  return (
    <tr className={cn("border-b border-border/50 last:border-0", bg)}>
      <td className="py-2.5 px-3 text-sm font-medium whitespace-nowrap">{label}</td>
      <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap">{row.runTimeMin !== null ? fmt(row.runTimeMin, 1) + ' min' : '—'}</td>
      <td className={cn("py-2.5 px-3 text-sm text-right whitespace-nowrap", ratioColor)}>{fmtPct(row.setupRunRatio !== null ? row.setupRunRatio * 100 : null)}</td>
      <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap">{row.setupCostPerJob !== null ? formatCurrency(row.setupCostPerJob) : '—'}</td>
      <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap">{fmtPct(row.setupPctOfJobValue)}</td>
      <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap">{row.effectiveCostPerFoot !== null ? `$${row.effectiveCostPerFoot.toFixed(4)}/ft` : '—'}</td>
    </tr>
  );
}

export function RunLengthAnalysisSection({ inputs, results, mode }: Props) {
  const [customLength, setCustomLength] = useState<string>('');

  const fixedRows: RowData[] = FIXED_RUN_LENGTHS.map((len) => ({
    runLengthFt: len,
    ...calcRow(len, inputs, results, mode),
  }));

  const customFt = customLength !== '' ? Math.max(1, Number(customLength)) : null;
  const customRow: RowData | null = customFt !== null && !isNaN(customFt)
    ? { runLengthFt: customFt, ...calcRow(customFt, inputs, results, mode) }
    : null;

  const hasSpeedInput = inputs.pressSpeedFPM !== null;
  const hasLaborOrCost = results.setupTaxPerChangeover !== null;
  const hasPriceInput = inputs.pricePerFoot !== null;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Run Length Analysis</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Shows how setup time and cost scale relative to job length. Color coding: <span className="text-green-700 dark:text-green-400 font-medium">green</span> = setup &lt;50% of run time, <span className="text-yellow-600 dark:text-yellow-400 font-medium">yellow</span> = setup 50–100% of run time, <span className="text-red-600 dark:text-red-400 font-medium">red</span> = setup exceeds run time.
          </p>
          {!hasSpeedInput && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Enter Avg Press Speed in Inputs to see Run Time and color coding.</p>
          )}
          {!hasLaborOrCost && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Enter Labor Rate or waste inputs to see Setup Cost columns.</p>
          )}
          {!hasPriceInput && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Enter Avg Selling Price to see job value and effective cost columns.</p>
          )}
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Run Length</th>
                <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Run Time</th>
                <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Setup : Run</th>
                <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Setup Cost / Job</th>
                <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Setup % of Job Value</th>
                <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Eff. Cost / ft</th>
              </tr>
            </thead>
            <tbody>
              {fixedRows.map((row) => (
                <TableRow
                  key={row.runLengthFt}
                  row={row}
                  label={row.runLengthFt.toLocaleString() + ' ft'}
                />
              ))}
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="py-2.5 px-3 text-sm font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">Custom:</span>
                    <Input
                      type="number"
                      min={1}
                      step={100}
                      value={customLength}
                      onChange={(e) => setCustomLength(e.target.value)}
                      placeholder="Enter ft"
                      className="h-7 w-28 text-sm"
                      data-testid="input-custom-run-length"
                    />
                  </div>
                </td>
                {customRow ? (
                  <>
                    <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap">{customRow.runTimeMin !== null ? fmt(customRow.runTimeMin, 1) + ' min' : '—'}</td>
                    <td className={cn("py-2.5 px-3 text-sm text-right whitespace-nowrap",
                      customRow.colorClass === 'red' ? 'text-red-600 dark:text-red-400 font-semibold' :
                      customRow.colorClass === 'yellow' ? 'text-yellow-600 dark:text-yellow-400 font-semibold' :
                      customRow.colorClass === 'green' ? 'text-green-700 dark:text-green-400 font-semibold' : ''
                    )}>{fmtPct(customRow.setupRunRatio !== null ? customRow.setupRunRatio * 100 : null)}</td>
                    <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap">{customRow.setupCostPerJob !== null ? formatCurrency(customRow.setupCostPerJob) : '—'}</td>
                    <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap">{fmtPct(customRow.setupPctOfJobValue)}</td>
                    <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap">{customRow.effectiveCostPerFoot !== null ? `$${customRow.effectiveCostPerFoot.toFixed(4)}/ft` : '—'}</td>
                  </>
                ) : (
                  <td colSpan={5} className="py-2.5 px-3 text-xs text-muted-foreground italic">Enter a run length above to calculate.</td>
                )}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">How to Read This Table</h4>
          <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
            <li><span className="font-medium text-foreground">Run Time</span> — How long the press runs to complete the job at the modeled press speed.</li>
            <li><span className="font-medium text-foreground">Setup : Run</span> — Setup time as a percentage of run time. Below 50% is efficient; above 100% means setup takes longer than the job itself.</li>
            <li><span className="font-medium text-foreground">Setup Cost / Job</span> — The total setup tax (labor + material waste) allocated to a single changeover.</li>
            <li><span className="font-medium text-foreground">Setup % of Job Value</span> — What share of the job's selling price is consumed by setup activity.</li>
            <li><span className="font-medium text-foreground">Eff. Cost / ft</span> — The effective per-foot cost once setup tax is allocated across the run length.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

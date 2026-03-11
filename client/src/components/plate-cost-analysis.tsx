import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/calculations";

function NumInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  testId,
  helperText,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  testId?: string;
  helperText?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-sm text-muted-foreground pointer-events-none">{prefix}</span>}
        <Input
          type="number"
          value={value}
          min={0}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn("h-9 text-sm", prefix && "pl-7", suffix && "pr-10")}
          data-testid={testId}
        />
        {suffix && <span className="absolute right-3 text-sm text-muted-foreground pointer-events-none">{suffix}</span>}
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}

function fmtC(n: number) { return formatCurrency(n); }
function fmtN(n: number, d = 0) { return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

const FIXED_LENGTHS = [500, 1000, 2500, 5000, 10000];

export function PlateCostAnalysisSection() {
  const [newJobsPerYear, setNewJobsPerYear] = useState(0);
  const [avgColors, setAvgColors] = useState(0);
  const [avgPlateCostPerColor, setAvgPlateCostPerColor] = useState(0);
  const [avgSellingPrice, setAvgSellingPrice] = useState(0.21);
  const [avgRunLength, setAvgRunLength] = useState(0);

  const [copyChangeEvents, setCopyChangeEvents] = useState(0);
  const [avgPlatesPerCopyChange, setAvgPlatesPerCopyChange] = useState(1);
  const [avgPlateCostPerCopyChangePlate, setAvgPlateCostPerCopyChangePlate] = useState(0);

  const [numSkus, setNumSkus] = useState(0);
  const [customLength, setCustomLength] = useState(0);

  const newJobPlateCostPerJob = avgColors * avgPlateCostPerColor;
  const copyChangePlateCostPerEvent = avgPlatesPerCopyChange * avgPlateCostPerCopyChangePlate;
  const totalAnnualNewJobPlateCost = newJobsPerYear * newJobPlateCostPerJob;
  const totalAnnualCopyChangePlateCost = copyChangeEvents * copyChangePlateCostPerEvent;
  const totalAnnualPlateCost = totalAnnualNewJobPlateCost + totalAnnualCopyChangePlateCost;

  const breakEvenFootage = avgSellingPrice > 0 ? newJobPlateCostPerJob / avgSellingPrice : null;

  function rowCalc(len: number) {
    const jobRevenue = len * avgSellingPrice;
    const plateCost = newJobPlateCostPerJob;
    const net = jobRevenue - plateCost;
    const margin = jobRevenue > 0 ? net / jobRevenue : null;
    let color = '';
    if (net < 0) color = 'red';
    else if (margin !== null && margin < 0.20) color = 'yellow';
    else color = 'green';
    const covered = jobRevenue >= plateCost ? 'Yes' : 'No';
    return { jobRevenue, plateCost, net, color, covered };
  }

  const skuTotalFlexo = numSkus * avgColors * avgPlateCostPerColor;
  const skuAnnualCopyChange = numSkus * avgPlatesPerCopyChange * avgPlateCostPerCopyChangePlate;
  const skuCombinedFlexo = skuTotalFlexo + skuAnnualCopyChange;

  const flexoRedClass = (v: number) => v > 10000 ? 'text-red-600 dark:text-red-400 font-semibold' : '';

  function BreakEvenRow({ len, label }: { len: number; label: string }) {
    const { jobRevenue, plateCost, net, color, covered } = rowCalc(len);
    const bg =
      color === 'red' ? 'bg-red-50 dark:bg-red-950/30' :
      color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-950/30' :
      'bg-green-50 dark:bg-green-950/20';
    return (
      <tr className={cn("border-b border-border/50 last:border-0", bg)}>
        <td className="py-2 px-3 text-sm font-medium whitespace-nowrap">{label}</td>
        <td className="py-2 px-3 text-sm text-right whitespace-nowrap">{fmtC(jobRevenue)}</td>
        <td className="py-2 px-3 text-sm text-right whitespace-nowrap">{fmtC(plateCost)}</td>
        <td className={cn("py-2 px-3 text-sm text-right whitespace-nowrap font-medium",
          covered === 'Yes' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>{covered}</td>
        <td className={cn("py-2 px-3 text-sm text-right whitespace-nowrap font-medium",
          color === 'red' ? 'text-red-600 dark:text-red-400' :
          color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
          'text-green-700 dark:text-green-400'
        )}>{fmtC(net)}</td>
      </tr>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section 1 — Job & Plate Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <NumInput label="Number of New Jobs per Year" value={newJobsPerYear} onChange={setNewJobsPerYear} testId="pca-new-jobs-per-year" />
            <NumInput label="Avg Colors per Job" value={avgColors} onChange={setAvgColors} testId="pca-avg-colors-per-job" />
            <NumInput label="Avg Plate Cost per Color ($)" value={avgPlateCostPerColor} onChange={setAvgPlateCostPerColor} prefix="$" testId="pca-avg-plate-cost-per-color" />
            <NumInput label="Avg Selling Price ($/ft)" value={avgSellingPrice} onChange={setAvgSellingPrice} prefix="$" suffix="/ft" step={0.01} testId="pca-avg-selling-price" />
            <NumInput label="Avg Run Length per Job (ft)" value={avgRunLength} onChange={setAvgRunLength} suffix="ft" testId="pca-avg-run-length" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section 2 — Copy Change Events</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <NumInput label="Number of Copy Change Events per Year" value={copyChangeEvents} onChange={setCopyChangeEvents} testId="pca-copy-change-events" />
            <NumInput label="Avg Plates Changed per Copy Change" value={avgPlatesPerCopyChange} onChange={setAvgPlatesPerCopyChange} testId="pca-avg-plates-per-copy-change" />
            <NumInput label="Avg Plate Cost per Copy Change Plate ($)" value={avgPlateCostPerCopyChangePlate} onChange={setAvgPlateCostPerCopyChangePlate} prefix="$" testId="pca-avg-plate-cost-copy-change" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Annual Plate Cost Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          <table className="w-full min-w-[400px] text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metric</th>
                <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Flexo</th>
                <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 text-right">HP Indigo V12</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'New Job Plate Cost per Job', flexo: newJobPlateCostPerJob, formula: `${avgColors} colors × $${avgPlateCostPerColor}/color` },
                { label: 'Copy Change Plate Cost per Event', flexo: copyChangePlateCostPerEvent, formula: `${avgPlatesPerCopyChange} plates × $${avgPlateCostPerCopyChangePlate}/plate` },
                { label: 'Total Annual New Job Plate Cost', flexo: totalAnnualNewJobPlateCost, formula: `${newJobsPerYear} jobs × ${avgColors} colors × $${avgPlateCostPerColor}` },
                { label: 'Total Annual Copy Change Plate Cost', flexo: totalAnnualCopyChangePlateCost, formula: `${copyChangeEvents} events × ${avgPlatesPerCopyChange} plates × $${avgPlateCostPerCopyChangePlate}` },
              ].map(({ label, flexo, formula }) => (
                <tr key={label} className="border-b border-border/50">
                  <td className="py-2.5 px-3 text-sm">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{formula}</div>
                  </td>
                  <td className={cn("py-2.5 px-3 text-sm text-right whitespace-nowrap", flexoRedClass(flexo))}>{fmtC(flexo)}</td>
                  <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap text-green-600 dark:text-green-400">$0</td>
                </tr>
              ))}
              <tr className="border-b border-border/50 bg-muted/30 font-semibold">
                <td className="py-2.5 px-3 text-sm font-semibold">TOTAL ANNUAL PLATE COST</td>
                <td className={cn("py-2.5 px-3 text-sm text-right whitespace-nowrap font-semibold", flexoRedClass(totalAnnualPlateCost))}>{fmtC(totalAnnualPlateCost)}</td>
                <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap font-semibold text-green-600 dark:text-green-400">$0</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-sm text-muted-foreground">V12 Annual Savings</td>
                <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap text-muted-foreground">{fmtC(totalAnnualPlateCost)}</td>
                <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap font-semibold text-green-600 dark:text-green-400">Eliminated</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Run Length Break-Even Analysis</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">At what run length does a job cover its plate cost?</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {breakEvenFootage !== null ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
              This job must run at least{' '}
              <span className="font-bold text-foreground text-base">{fmtN(breakEvenFootage)} ft</span>
              {' '}just to cover plate cost.
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Enter an Avg Selling Price above zero to calculate break-even footage.
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Run Length</th>
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Job Revenue</th>
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Plate Cost</th>
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Plates Covered?</th>
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Net After Plates</th>
                </tr>
              </thead>
              <tbody>
                {FIXED_LENGTHS.map((len) => (
                  <BreakEvenRow key={len} len={len} label={`${len.toLocaleString()} ft`} />
                ))}
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="py-2 px-3 text-sm font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">Custom:</span>
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={customLength}
                        onChange={(e) => setCustomLength(Number(e.target.value))}
                        className="h-7 w-28 text-sm"
                        data-testid="pca-custom-run-length"
                      />
                      <span className="text-xs text-muted-foreground">ft</span>
                    </div>
                  </td>
                  {customLength > 0 ? (() => {
                    const { jobRevenue, plateCost, net, color, covered } = rowCalc(customLength);
                    return (
                      <>
                        <td className="py-2 px-3 text-sm text-right whitespace-nowrap">{fmtC(jobRevenue)}</td>
                        <td className="py-2 px-3 text-sm text-right whitespace-nowrap">{fmtC(plateCost)}</td>
                        <td className={cn("py-2 px-3 text-sm text-right whitespace-nowrap font-medium",
                          covered === 'Yes' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}>{covered}</td>
                        <td className={cn("py-2 px-3 text-sm text-right whitespace-nowrap font-medium",
                          color === 'red' ? 'text-red-600 dark:text-red-400' :
                          color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-700 dark:text-green-400'
                        )}>{fmtC(net)}</td>
                      </>
                    );
                  })() : (
                    <td colSpan={4} className="py-2 px-3 text-xs text-muted-foreground italic">Enter a run length to calculate.</td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Color coding: <span className="text-green-700 dark:text-green-400 font-medium">green</span> = &gt;20% margin after plates, <span className="text-yellow-600 dark:text-yellow-400 font-medium">yellow</span> = positive but &lt;20% margin, <span className="text-red-600 dark:text-red-400 font-medium">red</span> = negative net after plates.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">SKU Family Analysis</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">What does a high-SKU job family cost in plates?</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="max-w-xs">
            <NumInput
              label="Number of SKUs in Job Family"
              value={numSkus}
              onChange={setNumSkus}
              testId="pca-num-skus"
              helperText="Total number of unique SKUs in this job family"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cost Component</th>
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Flexo</th>
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 text-right">HP Indigo V12</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2.5 px-3 text-sm">
                    <div className="font-medium">Total Plate Cost for SKU Family</div>
                    <div className="text-xs text-muted-foreground">{numSkus} SKUs × {avgColors} colors × ${avgPlateCostPerColor}/color</div>
                  </td>
                  <td className={cn("py-2.5 px-3 text-sm text-right whitespace-nowrap", flexoRedClass(skuTotalFlexo))}>{fmtC(skuTotalFlexo)}</td>
                  <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap text-green-600 dark:text-green-400">$0</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2.5 px-3 text-sm">
                    <div className="font-medium">If every SKU gets one copy change per year</div>
                    <div className="text-xs text-muted-foreground">{numSkus} SKUs × {avgPlatesPerCopyChange} plates × ${avgPlateCostPerCopyChangePlate}/plate</div>
                  </td>
                  <td className={cn("py-2.5 px-3 text-sm text-right whitespace-nowrap", flexoRedClass(skuAnnualCopyChange))}>{fmtC(skuAnnualCopyChange)}</td>
                  <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap text-green-600 dark:text-green-400">$0</td>
                </tr>
                <tr className="border-t-2 border-border font-semibold">
                  <td className="py-2.5 px-3 text-sm font-semibold">Combined Annual Plate Spend on this Job Family</td>
                  <td className={cn("py-2.5 px-3 text-sm text-right whitespace-nowrap font-semibold", flexoRedClass(skuCombinedFlexo))}>{fmtC(skuCombinedFlexo)}</td>
                  <td className="py-2.5 px-3 text-sm text-right whitespace-nowrap font-semibold text-green-600 dark:text-green-400">$0</td>
                </tr>
              </tbody>
            </table>
          </div>
          {skuCombinedFlexo > 0 && (
            <div className="rounded-lg border-2 border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/30 px-5 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 mb-1">Annual Plate Savings by Moving This Job Family to V12</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">{fmtC(skuCombinedFlexo)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

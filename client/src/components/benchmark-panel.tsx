import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type AuditInputs,
  type AuditResults,
  type BenchmarkBand,
  getBenchmarks,
  bandLabel,
} from "@/lib/calculations";

interface Props {
  inputs: AuditInputs;
  results: AuditResults;
}

function BandBadge({ band }: { band: BenchmarkBand }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap",
      band === 'below-typical' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      band === 'typical' && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      band === 'above-typical' && "bg-red-500/10 text-red-700 dark:text-red-400",
    )}>
      {bandLabel(band)}
    </span>
  );
}

export function BenchmarkPanel({ inputs, results }: Props) {
  const { metrics, overall } = getBenchmarks(inputs, results);

  return (
    <Card data-testid="benchmark-panel">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Benchmark (Directional)</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Overall:</span>
            <BandBadge band={overall} />
          </div>
        </div>

        <div className="space-y-3">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-center justify-between gap-4" data-testid={`benchmark-metric-${i}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-foreground/80">{m.label}:</span>
                <span className="text-sm font-semibold">{m.value}</span>
              </div>
              <BandBadge band={m.band} />
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground mt-4 italic">
          Benchmarks are directional estimates and may vary depending on product mix, SKU complexity, and plant operating practices.
        </p>
      </CardContent>
    </Card>
  );
}

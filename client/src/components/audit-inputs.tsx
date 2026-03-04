import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, RotateCcw, Shield, Target, Zap, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AuditInputs, type OperatingMode, getModePresets, formatNumber } from "@/lib/calculations";

interface Props {
  inputs: AuditInputs;
  mode: OperatingMode;
  onInputChange: (field: keyof AuditInputs, value: number | null) => void;
  onModeChange: (mode: OperatingMode) => void;
  onReset: () => void;
}

const modes: { value: OperatingMode; label: string; icon: typeof Shield; subtitle: string; desc: string }[] = [
  { value: 'conservative', label: 'Conservative', icon: Shield, subtitle: 'Slow Setup Environment', desc: 'Assumes setups take ~20% longer; sets reduction target to 30%.' },
  { value: 'typical', label: 'Typical', icon: Target, subtitle: 'Current Operation', desc: 'Uses your entered setup time; sets reduction target to 40%.' },
  { value: 'aggressive', label: 'Aggressive', icon: Zap, subtitle: 'Best-Practice Setup', desc: 'Assumes disciplined setups (~15% faster); sets reduction target to 50%.' },
];

export function AuditInputsSection({ inputs, mode, onInputChange, onModeChange, onReset }: Props) {
  const presets = getModePresets(mode);
  const effectiveSetupTime = inputs.setupMinutesPerChangeover * presets.setupMultiplier;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating Mode</CardTitle>
          <p className="text-[11px] text-muted-foreground mt-1" data-testid="text-operating-reality">
            <span className="font-medium text-foreground/70">Operating Reality</span> — Adjusts the assumed setup efficiency before modeling improvement scenarios.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex bg-muted/60 rounded-md p-1 gap-1">
            {modes.map((m) => (
              <button
                key={m.value}
                data-testid={`mode-${m.value}`}
                onClick={() => onModeChange(m.value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1.5 rounded-sm px-2 py-2.5 text-xs font-medium transition-all cursor-pointer relative z-10 pointer-events-auto",
                  mode === m.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
                style={{ touchAction: "manipulation" }}
              >
                <m.icon className="w-4 h-4" />
                <span>{m.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1.5" data-testid="text-mode-descriptions">
            {modes.map((m) => (
              <p key={m.value} className={cn(
                "text-[11px] leading-snug",
                mode === m.value ? "text-foreground/80" : "text-muted-foreground/60"
              )}>
                <span className="font-semibold">{m.label}</span>{' '}
                <span className="text-muted-foreground">({m.subtitle})</span>{' '}
                <span className="italic">{m.desc}</span>
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Press Configuration</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField
              label="Number of Flexo Presses"
              value={inputs.presses}
              onChange={(v) => onInputChange('presses', v)}
              min={1}
              testId="input-presses"
            />
            <NumberField
              label="Avg Changeovers / Press / Day"
              value={inputs.changeoversPerPressPerDay}
              onChange={(v) => onInputChange('changeoversPerPressPerDay', v)}
              min={1}
              testId="input-changeovers"
            />
            <div className="space-y-1.5">
              <NumberField
                label="Setup Time per Changeover"
                value={inputs.setupMinutesPerChangeover}
                onChange={(v) => onInputChange('setupMinutesPerChangeover', v)}
                min={1}
                suffix="min"
                testId="input-setup-time"
                tooltip="Include washups, plate mounting, and registration."
              />
              {mode !== 'typical' && (
                <p className="text-xs text-muted-foreground pl-0.5" data-testid="text-adjusted-time">
                  Adjusted Setup Time: <span className="font-medium text-foreground">{formatNumber(effectiveSetupTime, 1)} min</span>
                  {' '}({mode === 'conservative' ? '\u00d71.2' : '\u00d70.85'})
                </p>
              )}
            </div>
            <NumberField
              label="Shifts per Day"
              value={inputs.shiftsPerDay}
              onChange={(v) => onInputChange('shiftsPerDay', v)}
              min={1}
              testId="input-shifts"
            />
            <NumberField
              label="Hours per Shift"
              value={inputs.hoursPerShift}
              onChange={(v) => onInputChange('hoursPerShift', v)}
              min={1}
              testId="input-hours-per-shift"
            />
            <NumberField
              label="Operating Days per Year"
              value={inputs.operatingDaysPerYear}
              onChange={(v) => onInputChange('operatingDaysPerYear', v)}
              min={1}
              testId="input-operating-days"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Optional &mdash; Financial &amp; Speed</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <OptionalNumberField
              label="Avg Press Speed"
              value={inputs.pressSpeedFPM}
              onChange={(v) => onInputChange('pressSpeedFPM', v)}
              suffix="ft/min"
              testId="input-speed"
            />
            <OptionalNumberField
              label="Avg Selling Price"
              value={inputs.pricePerFoot}
              onChange={(v) => onInputChange('pricePerFoot', v)}
              prefix="$"
              suffix="/ft"
              step={0.01}
              testId="input-price"
            />
            <OptionalNumberField
              label="Operator Labor Rate"
              value={inputs.laborRate}
              onChange={(v) => onInputChange('laborRate', v)}
              prefix="$"
              suffix="/hr"
              testId="input-labor-rate"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setup Reduction Scenario</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-3xl font-bold tracking-tight" data-testid="text-reduction-pct">{inputs.reductionPct}</span>
                <span className="text-lg font-semibold text-muted-foreground ml-0.5">%</span>
              </div>
              <div className="flex gap-1.5">
                {[30, 40, 50].map((pct) => (
                  <Button
                    key={pct}
                    variant={inputs.reductionPct === pct ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => onInputChange('reductionPct', pct)}
                    data-testid={`btn-reduction-${pct}`}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>
            <Slider
              value={[inputs.reductionPct]}
              onValueChange={([v]) => onInputChange('reductionPct', v)}
              min={0}
              max={100}
              step={1}
              data-testid="slider-reduction"
            />
            <p className="text-xs text-muted-foreground">
              Drag the slider or use quick-set buttons to model different reduction scenarios.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pb-4">
        <Button variant="secondary" onClick={onReset} data-testid="btn-reset">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}

function handleSelectAll(e: React.FocusEvent<HTMLInputElement>) {
  e.target.select();
}

function NumberField({ label, value, onChange, min = 0, suffix, prefix, step = 1, testId, tooltip }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  suffix?: string;
  prefix?: string;
  step?: number;
  testId: string;
  tooltip?: string;
}) {
  const increment = () => onChange(Math.round((value + step) * 1000) / 1000);
  const decrement = () => { const next = Math.round((value - step) * 1000) / 1000; if (next >= min) onChange(next); };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="max-w-[220px] text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">{prefix}</span>
          )}
          <Input
            type="number"
            inputMode="numeric"
            min={min}
            step={step}
            value={value}
            onFocus={handleSelectAll}
            onChange={(e) => {
              const v = e.target.valueAsNumber;
              if (!isNaN(v) && v >= min) onChange(v);
            }}
            className={cn("relative z-10 pointer-events-auto", prefix && "pl-7", suffix && "pr-16")}
            style={{ touchAction: "manipulation" }}
            data-testid={testId}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">{suffix}</span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={increment}
            className="flex items-center justify-center w-7 h-4 rounded bg-muted hover:bg-muted/80 active:bg-primary/10 transition-colors pointer-events-auto"
            style={{ touchAction: "manipulation" }}
            data-testid={`${testId}-inc`}
            aria-label="Increase"
          >
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={decrement}
            className="flex items-center justify-center w-7 h-4 rounded bg-muted hover:bg-muted/80 active:bg-primary/10 transition-colors pointer-events-auto"
            style={{ touchAction: "manipulation" }}
            data-testid={`${testId}-dec`}
            aria-label="Decrease"
          >
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionalNumberField({ label, value, onChange, suffix, prefix, step = 1, testId }: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  suffix?: string;
  prefix?: string;
  step?: number;
  testId: string;
}) {
  const isDecimal = step !== undefined && step < 1;
  const current = value ?? 0;
  const increment = () => onChange(Math.round((current + step) * 1000) / 1000);
  const decrement = () => { const next = Math.round((current - step) * 1000) / 1000; if (next >= 0) onChange(next); else onChange(0); };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">{prefix}</span>
          )}
          <Input
            type="number"
            inputMode={isDecimal ? "decimal" : "numeric"}
            min={0}
            step={step}
            value={value !== null ? String(value) : ''}
            placeholder="\u2014"
            onFocus={handleSelectAll}
            onChange={(e) => {
              const raw = e.target.value;
              onChange(raw === '' ? null : Math.max(0, Number(raw)));
            }}
            className={cn("relative z-10 pointer-events-auto", prefix && "pl-7", suffix && "pr-16")}
            style={{ touchAction: "manipulation" }}
            data-testid={testId}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">{suffix}</span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={increment}
            className="flex items-center justify-center w-7 h-4 rounded bg-muted hover:bg-muted/80 active:bg-primary/10 transition-colors pointer-events-auto"
            style={{ touchAction: "manipulation" }}
            data-testid={`${testId}-inc`}
            aria-label="Increase"
          >
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={decrement}
            className="flex items-center justify-center w-7 h-4 rounded bg-muted hover:bg-muted/80 active:bg-primary/10 transition-colors pointer-events-auto"
            style={{ touchAction: "manipulation" }}
            data-testid={`${testId}-dec`}
            aria-label="Decrease"
          >
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AuditInputsSection } from "@/components/audit-inputs";
import { AuditResultsSection } from "@/components/audit-results";
import { AuditSnapshotSection } from "@/components/audit-snapshot";
import { RunLengthAnalysisSection } from "@/components/run-length-analysis";
import { V12ComparisonSection } from "@/components/v12-comparison";
import {
  type AuditInputs,
  type OperatingMode,
  DEFAULT_INPUTS,
  getModePresets,
  calculate,
  decodeParamsToInputs,
} from "@/lib/calculations";
import { Gauge } from "lucide-react";

export default function Home() {
  const [inputs, setInputs] = useState<AuditInputs>(DEFAULT_INPUTS);
  const [mode, setMode] = useState<OperatingMode>('typical');
  const [activeTab, setActiveTab] = useState('inputs');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const snapshotRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => calculate(inputs, mode), [inputs, mode]);

  useEffect(() => {
    const decoded = decodeParamsToInputs(window.location.search);
    if (decoded) {
      setInputs((prev) => ({ ...prev, ...decoded.inputs }));
      if (decoded.mode) setMode(decoded.mode);
      setActiveTab('results');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleInputChange = (field: keyof AuditInputs, value: number | null) => {
    if (field === 'reductionPct' && (value === null || value < 0 || value > 100)) return;
    if (value !== null && value < 0) return;
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleModeChange = (newMode: OperatingMode) => {
    setMode(newMode);
    const presets = getModePresets(newMode);
    setInputs((prev) => ({
      ...prev,
      reductionPct: presets.reductionPct,
    }));
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setMode('typical');
  };

  const handleStartOver = () => {
    handleReset();
    setActiveTab('inputs');
  };

  return (
    <div className="min-h-screen bg-background print:bg-white" style={{ touchAction: "manipulation" }}>
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
              <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight leading-tight" data-testid="text-app-title">
                Flexo Setup Tax &mdash; Plant Capacity Audit
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                Quantify setup loss. Model recovered capacity.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="hidden print:block max-w-4xl mx-auto px-4 pt-8 pb-2">
        <h1 className="text-xl font-bold text-black">Flexo Setup Tax &mdash; Capacity Audit</h1>
        <p className="text-sm text-gray-500 mt-1">Executive Snapshot</p>
        <div className="border-b border-gray-200 mt-3" />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-end gap-2 mb-3 print:hidden">
            <Switch
              id="benchmark-toggle"
              checked={showBenchmark}
              onCheckedChange={setShowBenchmark}
              data-testid="toggle-benchmark"
            />
            <Label htmlFor="benchmark-toggle" className="text-xs text-muted-foreground cursor-pointer" data-testid="label-benchmark-toggle">
              Show Benchmark
            </Label>
          </div>
          <TabsList className="grid w-full grid-cols-4 print:hidden" data-testid="tab-list">
            <TabsTrigger value="inputs" data-testid="tab-inputs">Inputs</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">Results</TabsTrigger>
            <TabsTrigger value="run-length" data-testid="tab-run-length">Run Length</TabsTrigger>
            <TabsTrigger value="snapshot" data-testid="tab-snapshot">Snapshot</TabsTrigger>
          </TabsList>

          <div className="mt-5 sm:mt-6">
            <TabsContent value="inputs" className="mt-0 print:hidden">
              <AuditInputsSection
                inputs={inputs}
                mode={mode}
                onInputChange={handleInputChange}
                onModeChange={handleModeChange}
                onReset={handleReset}
              />
            </TabsContent>
            <TabsContent value="results" className="mt-0 print:hidden">
              <AuditResultsSection inputs={inputs} results={results} showBenchmark={showBenchmark} />
            </TabsContent>
            <TabsContent value="run-length" className="mt-0 print:hidden">
              <RunLengthAnalysisSection inputs={inputs} results={results} mode={mode} />
            </TabsContent>
            <TabsContent value="snapshot" className="mt-0">
              <AuditSnapshotSection
                inputs={inputs}
                results={results}
                mode={mode}
                onStartOver={handleStartOver}
                snapshotRef={snapshotRef}
                showBenchmark={showBenchmark}
              />
            </TabsContent>
            {/* V12 Comparison tab hidden — code retained for future re-enable */}
            {/* <TabsContent value="v12" className="mt-0 print:hidden">
              <V12ComparisonSection inputs={inputs} results={results} mode={mode} />
            </TabsContent> */}
          </div>
        </Tabs>
      </main>
    </div>
  );
}

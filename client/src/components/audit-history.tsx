import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Upload } from "lucide-react";
import { type AuditInputs, type OperatingMode, formatCurrency, formatNumber } from "@/lib/calculations";

interface SavedAudit {
  timestamp: number;
  companyName: string;
  contactName: string;
  auditDate: string;
  notes: string;
  mode: string;
  inputs: AuditInputs;
  setupHoursPerYear: number;
  totalSetupCost: number | null;
}

interface Props {
  onLoadAudit: (inputs: AuditInputs, mode: OperatingMode) => void;
}

function loadAudits(): SavedAudit[] {
  const audits: SavedAudit[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('audit:')) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) audits.push(JSON.parse(raw));
      } catch {}
    }
  }
  return audits.sort((a, b) => b.timestamp - a.timestamp);
}

function formatPayback(totalSetupCost: number | null): string {
  if (totalSetupCost === null || totalSetupCost <= 0) return '—';
  const payback = 2_000_000 / totalSetupCost;
  return `${payback.toFixed(1)} yrs`;
}

function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function AuditHistorySection({ onLoadAudit }: Props) {
  const [audits, setAudits] = useState<SavedAudit[]>([]);

  useEffect(() => {
    setAudits(loadAudits());
  }, []);

  const refresh = () => setAudits(loadAudits());

  const totalHours = audits.reduce((sum, a) => sum + (a.setupHoursPerYear || 0), 0);
  const totalCost = audits.reduce((sum, a) => sum + (a.totalSetupCost || 0), 0);

  const handleLoad = (audit: SavedAudit) => {
    if (window.confirm('Loading this audit will replace all current inputs. Continue?')) {
      onLoadAudit(audit.inputs, audit.mode as OperatingMode);
    }
  };

  const handleDelete = (timestamp: number) => {
    if (window.confirm('Delete this audit? This cannot be undone.')) {
      localStorage.removeItem(`audit:${timestamp}`);
      refresh();
    }
  };

  return (
    <div className="space-y-5">
      <Card data-testid="card-audit-history">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit History</h2>

          <div className="rounded-md border border-muted bg-muted/30 px-4 py-3 text-sm text-foreground/80 leading-relaxed" data-testid="text-audit-summary">
            {audits.length === 0 ? (
              <>No audits saved yet.</>
            ) : (
              <>
                You have <span className="font-semibold">{audits.length}</span> saved audit{audits.length !== 1 ? 's' : ''}.{' '}
                Total setups documented: <span className="font-semibold">{formatNumber(totalHours)} hrs</span>.{' '}
                Total setup cost documented: <span className="font-semibold">{formatCurrency(totalCost)}</span>.
              </>
            )}
          </div>

          {audits.length === 0 ? (
            <p className="text-sm text-muted-foreground italic" data-testid="text-no-audits">
              No audits saved yet. Complete an audit and click Save Audit on the Exec Report tab to save your first audit.
            </p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left border-collapse" data-testid="table-audit-history">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Company Name</th>
                      <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contact Name</th>
                      <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Setup Hrs Lost</th>
                      <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Setup Cost</th>
                      <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Payback (yrs)</th>
                      <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</th>
                      <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {audits.map((audit) => (
                      <tr key={audit.timestamp} className="text-sm hover:bg-muted/30 transition-colors" data-testid={`row-audit-${audit.timestamp}`}>
                        <td className="py-2.5 px-3 font-medium whitespace-nowrap" data-testid={`text-company-${audit.timestamp}`}>{audit.companyName}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-foreground/80">{audit.contactName || '—'}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-foreground/80">{audit.auditDate}</td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">{formatNumber(audit.setupHoursPerYear)}</td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {audit.totalSetupCost !== null ? formatCurrency(audit.totalSetupCost) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap text-muted-foreground text-xs">
                          {formatPayback(audit.totalSetupCost)}
                        </td>
                        <td className="py-2.5 px-3 text-foreground/70 text-xs max-w-[160px]">
                          {truncate(audit.notes, 50)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoad(audit)}
                              data-testid={`btn-load-audit-${audit.timestamp}`}
                              className="h-7 px-2 text-xs gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              Load
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(audit.timestamp)}
                              data-testid={`btn-delete-audit-${audit.timestamp}`}
                              className="h-7 px-2 text-xs gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {audits.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Payback period calculated using default $2M V12 investment assumption. Audits are stored privately in your browser.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

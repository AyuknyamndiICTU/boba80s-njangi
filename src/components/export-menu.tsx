"use client";

import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n-provider";
import { useLedger } from "@/components/ledger-provider";
import { Popover } from "@/components/ui/popover";
import type { ExportFormat, ReportKind } from "@/lib/export";

export function ExportMenu({ reports }: { reports: ReportKind[] }) {
  const { t, lang, months, monthsShort } = useI18n();
  const ledger = useLedger();
  const [busy, setBusy] = useState<string | null>(null);

  const labels: Record<ReportKind, string> = {
    annual: t("reportAnnual"),
    monthly: t("reportMonth"),
    alerts: t("reportAlerts"),
    analysis: t("reportAnalysis"),
  };

  const run = async (kind: ReportKind, format: ExportFormat) => {
    const id = `${kind}-${format}`;
    setBusy(id);
    try {
      const { exportReport } = await import("@/lib/export");
      await exportReport(kind, format, {
        year: ledger.data.year,
        today: ledger.data.today,
        rows: ledger.rows,
        months: ledger.months,
        totals: ledger.totals,
        lang,
        t,
        monthNames: months,
        monthsShort,
      });
    } catch (err) {
      console.error(err);
      toast.error(t("errGeneric"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Popover
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-card transition hover:bg-primary-2"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4 text-gold-bright" />}
          {t("export")}
        </button>
      )}
    >
      {(close) => (
        <div className="w-72 p-1">
          {reports.map((kind) => (
            <div key={kind} className="rounded-xl p-2">
              <p className="px-1 pb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">{labels[kind]}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => run(kind, "xlsx").then(close)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-line-soft px-3 py-2.5 text-sm font-semibold text-positive transition hover:bg-positive-soft disabled:opacity-50"
                >
                  <FileSpreadsheet className="size-4" /> Excel
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => run(kind, "pdf").then(close)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-line-soft px-3 py-2.5 text-sm font-semibold text-negative transition hover:bg-negative-soft disabled:opacity-50"
                >
                  <FileText className="size-4" /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Popover>
  );
}

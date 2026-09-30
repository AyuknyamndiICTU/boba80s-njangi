"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { EntryEditor, type EditorTarget } from "@/components/entry-editor";
import { buildRows, grandTotals, missingCount, summarizeMonths, type LedgerData, type MemberRow, type MonthSummary } from "@/lib/ledger";

type LedgerContextValue = {
  data: LedgerData;
  years: number[];
  rows: MemberRow[];
  months: MonthSummary[];
  totals: { total: number; withdraw: number; balance: number };
  missing: number;
  openMonth: (month: number) => void;
  openMember: (memberId: number) => void;
};

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ data, years, children }: { data: LedgerData; years: number[]; children: React.ReactNode }) {
  const [editor, setEditor] = useState<{ target: EditorTarget; open: boolean; version: number } | null>(null);

  const rows = useMemo(() => buildRows(data), [data]);
  const months = useMemo(() => summarizeMonths(rows, data), [rows, data]);
  const totals = useMemo(() => grandTotals(rows), [rows]);
  const missing = useMemo(() => missingCount(rows), [rows]);

  const open = useCallback(
    (target: EditorTarget) => setEditor((prev) => ({ target, open: true, version: (prev?.version ?? 0) + 1 })),
    [],
  );
  const openMonth = useCallback((month: number) => open({ kind: "month", month }), [open]);
  const openMember = useCallback((memberId: number) => open({ kind: "member", memberId }), [open]);
  const close = useCallback(() => setEditor((prev) => (prev ? { ...prev, open: false } : prev)), []);

  const value = useMemo(
    () => ({ data, years, rows, months, totals, missing, openMonth, openMember }),
    [data, years, rows, months, totals, missing, openMonth, openMember],
  );

  return (
    <LedgerContext.Provider value={value}>
      {children}
      {editor && (
        <EntryEditor
          key={editor.version}
          target={editor.target}
          open={editor.open}
          onClose={close}
          year={data.year}
          today={data.today}
          rows={rows}
        />
      )}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used inside LedgerProvider");
  return ctx;
}

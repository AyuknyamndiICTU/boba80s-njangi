"use client";

import { useMemo, useState, useTransition } from "react";
import { CircleAlert, Copy, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { saveEntriesAction } from "@/app/actions/ledger";
import { useI18n } from "@/components/i18n-provider";
import { Modal } from "@/components/ui/modal";
import { MoneyInput } from "@/components/ui/money-input";
import { monthStatus } from "@/lib/dates";
import { formatAmount, formatSigned, parseAmount } from "@/lib/format";
import { isPaid, type MemberRow, type YearMonth } from "@/lib/ledger";

export type EditorTarget = { kind: "month"; month: number } | { kind: "member"; memberId: number };

type Line = {
  key: string;
  memberId: number;
  month: number;
  label: string;
  sub?: string;
  contribution: number | null;
  withdrawal: number;
  missing: boolean;
};

type Values = Record<string, { c: string; w: string }>;

export function EntryEditor({
  target,
  open,
  onClose,
  year,
  today,
  rows,
}: {
  target: EditorTarget;
  open: boolean;
  onClose: () => void;
  year: number;
  today: YearMonth;
  rows: MemberRow[];
}) {
  const { t, lang, months } = useI18n();
  const [pending, startTransition] = useTransition();
  const [fillValue, setFillValue] = useState("");

  const lines = useMemo<Line[]>(() => {
    if (target.kind === "month") {
      const i = target.month - 1;
      const past = monthStatus(year, target.month, today) === "past";
      return rows.map((r) => ({
        key: `${r.id}-${target.month}`,
        memberId: r.id,
        month: target.month,
        label: r.name,
        sub: `${t("sn")} ${r.sn}`,
        contribution: r.contributions[i],
        withdrawal: r.withdrawals[i],
        missing: past && !isPaid(r.contributions[i]),
      }));
    }
    const row = rows.find((r) => r.id === target.memberId);
    if (!row) return [];
    return months.map((name, i) => ({
      key: `${row.id}-${i + 1}`,
      memberId: row.id,
      month: i + 1,
      label: name,
      contribution: row.contributions[i],
      withdrawal: row.withdrawals[i],
      missing: monthStatus(year, i + 1, today) === "past" && !isPaid(row.contributions[i]),
    }));
  }, [target, rows, months, year, today, t]);

  const initial = useMemo<Values>(
    () =>
      Object.fromEntries(
        lines.map((l) => [
          l.key,
          {
            c: l.contribution === null ? "" : formatAmount(l.contribution, lang),
            w: l.withdrawal ? formatAmount(l.withdrawal, lang) : "",
          },
        ]),
      ),
    [lines, lang],
  );
  const [values, setValues] = useState<Values>(initial);

  const setLine = (key: string, field: "c" | "w", v: string) =>
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], [field]: v } }));

  const sumC = lines.reduce((s, l) => s + (parseAmount(values[l.key]?.c ?? "") ?? 0), 0);
  const sumW = lines.reduce((s, l) => s + (parseAmount(values[l.key]?.w ?? "") ?? 0), 0);

  const applyFill = () => {
    const amount = parseAmount(fillValue);
    if (amount === null) return;
    setValues((prev) => {
      const next = { ...prev };
      for (const l of lines) if (!next[l.key].c) next[l.key] = { ...next[l.key], c: formatAmount(amount, lang) };
      return next;
    });
  };

  const copyPrevious = () => {
    if (target.kind !== "month" || target.month === 1) return;
    const prevIndex = target.month - 2;
    setValues((prev) => {
      const next = { ...prev };
      for (const l of lines) {
        const source = rows.find((r) => r.id === l.memberId)?.contributions[prevIndex];
        if (!next[l.key].c && source != null) next[l.key] = { ...next[l.key], c: formatAmount(source, lang) };
      }
      return next;
    });
  };

  const save = () => {
    const cells = lines
      .filter((l) => values[l.key].c !== initial[l.key].c || values[l.key].w !== initial[l.key].w)
      .map((l) => ({
        memberId: l.memberId,
        month: l.month,
        contribution: parseAmount(values[l.key].c),
        withdrawal: parseAmount(values[l.key].w) ?? 0,
      }));

    if (cells.length === 0) return onClose();
    startTransition(async () => {
      const res = await saveEntriesAction({ year, cells });
      if (res.ok) {
        toast.success(t("entriesSaved"));
        onClose();
      } else {
        toast.error(t(res.error));
      }
    });
  };

  const title =
    target.kind === "month"
      ? `${months[target.month - 1]} ${year}`
      : `${rows.find((r) => r.id === target.memberId)?.name ?? ""} - ${year}`;
  const description = target.kind === "month" ? t("monthEditorHint") : t("memberEditorHint", { year });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="tabular flex flex-1 flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="text-ink-muted">
              {t("total")}: <b className="text-primary">{formatAmount(sumC, lang)}</b>
            </span>
            <span className="text-ink-muted">
              {t("withdraw")}: <b className="text-gold-deep">{formatAmount(sumW, lang)}</b>
            </span>
            {target.kind === "member" && (
              <span className="text-ink-muted">
                {t("balance")}:{" "}
                <b className={sumC - sumW > 0 ? "text-positive" : sumC - sumW < 0 ? "text-negative" : ""}>
                  {formatSigned(sumC - sumW, lang)}
                </b>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-line px-5 font-semibold text-ink-muted transition hover:bg-surface-mid sm:flex-none"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-2 px-6 font-semibold text-white shadow-card transition hover:bg-primary disabled:opacity-60 sm:flex-none"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-surface-low p-3 sm:flex-row sm:items-center">
        <span className="flex items-center gap-2 text-sm font-medium text-ink-muted">
          <Wand2 className="size-4 text-gold" />
          {t("fillEmpty")}
        </span>
        <div className="flex flex-1 gap-2">
          <div className="flex-1 sm:max-w-44">
            <MoneyInput value={fillValue} onChange={setFillValue} label={t("fillEmpty")} />
          </div>
          <button
            type="button"
            onClick={applyFill}
            className="h-11 rounded-xl bg-gold px-4 text-sm font-semibold text-white transition hover:bg-gold-deep"
          >
            {t("apply")}
          </button>
        </div>
        {target.kind === "month" && target.month > 1 && (
          <button
            type="button"
            onClick={copyPrevious}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-primary-2 transition hover:bg-surface-mid"
          >
            <Copy className="size-4" />
            {t("copyPrevious")}
          </button>
        )}
      </div>

      <div className="hidden grid-cols-[minmax(0,1fr)_170px_170px] gap-3 px-1 pb-2 text-xs font-bold uppercase tracking-wide text-ink-muted sm:grid">
        <span>{target.kind === "month" ? t("member") : t("month")}</span>
        <span className="text-right">{t("contribution")}</span>
        <span className="text-right">{t("withdrawal")}</span>
      </div>

      <ul className="divide-y divide-line-soft">
        {lines.map((l) => (
          <li key={l.key} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_170px_170px] sm:items-center sm:gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold text-ink">{l.label}</span>
              {l.missing && !values[l.key].c && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-negative-soft px-2 py-0.5 text-[11px] font-bold text-negative">
                  <CircleAlert className="size-3" />
                  {t("notPaid")}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:contents">
              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase text-ink-muted sm:hidden">{t("contribution")}</span>
                <MoneyInput value={values[l.key].c} onChange={(v) => setLine(l.key, "c", v)} label={`${t("contribution")} ${l.label}`} />
              </div>
              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase text-ink-muted sm:hidden">{t("withdrawal")}</span>
                <MoneyInput
                  value={values[l.key].w}
                  onChange={(v) => setLine(l.key, "w", v)}
                  label={`${t("withdrawal")} ${l.label}`}
                  tone="gold"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

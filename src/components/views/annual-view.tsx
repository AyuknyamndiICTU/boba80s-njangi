"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { LayoutGrid, Table2, UserPlus } from "lucide-react";
import { ExportMenu } from "@/components/export-menu";
import { useI18n } from "@/components/i18n-provider";
import { useLedger } from "@/components/ledger-provider";
import { SignedAmount } from "@/components/ui/animated-number";
import { monthStatus } from "@/lib/dates";
import { formatAmount } from "@/lib/format";
import { isPaid } from "@/lib/ledger";

const MOBILE_QUERY = "(max-width: 767px)";

function subscribeMobile(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function AnnualView() {
  const { t } = useI18n();
  const { data, rows } = useLedger();
  const isMobile = useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE_QUERY).matches, () => false);
  const [chosen, setView] = useState<"table" | "cards" | null>(null);
  const view = chosen ?? (isMobile ? "cards" : "table");

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-line-soft bg-white px-5 py-6 shadow-card sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-gold-bright to-primary-2" />
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Image src="/logo.png" alt="" width={84} height={84} className="rounded-full ring-4 ring-gold/30" />
          <div className="flex-1 sm:text-center">
            <p className="font-display text-lg font-extrabold text-primary sm:text-2xl">{t("school")}</p>
            <p className="font-display text-base font-bold tracking-[0.2em] text-gold-deep sm:text-lg">{t("boba")}</p>
            <p className="font-display text-base font-bold text-ink sm:text-xl">{t("njangiTitle", { year: data.year })}</p>
          </div>
          <span className="hidden w-[84px] sm:block" />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-line-soft bg-white p-1 shadow-card">
          {(
            [
              ["table", Table2, t("viewTable")],
              ["cards", LayoutGrid, t("viewCards")],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition ${
                view === key ? "text-white" : "text-ink-muted hover:text-primary"
              }`}
            >
              {view === key && <motion.span layoutId="annual-view" className="absolute inset-0 rounded-full bg-primary" />}
              <Icon className="relative size-4" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <p className="hidden flex-1 text-sm text-ink-muted lg:block">{t("tapMemberHint")}</p>
        <div className="ml-auto flex gap-2">
          <Link
            href="/members"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line-soft bg-white px-4 text-sm font-semibold text-primary-2 shadow-card transition hover:bg-surface-mid"
          >
            <UserPlus className="size-4 text-gold" />
            <span className="hidden sm:inline">{t("manageMembers")}</span>
          </Link>
          <ExportMenu reports={["annual"]} />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">{t("noMembers")}</p>
      ) : view === "table" ? (
        <LedgerTable />
      ) : (
        <LedgerCards />
      )}
    </div>
  );
}

function LedgerTable() {
  const { t, lang, monthsShort } = useI18n();
  const { data, rows, months, totals, openMember } = useLedger();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="scrollbar-thin overflow-x-auto rounded-3xl border border-line-soft bg-white shadow-card"
    >
      <table className="tabular w-full min-w-[1320px] border-collapse text-sm">
        <thead>
          <tr className="bg-primary text-white">
            <th className="sticky left-0 z-20 w-12 bg-primary px-3 py-3 text-center text-xs font-bold uppercase">{t("sn")}</th>
            <th className="sticky left-12 z-20 min-w-52 bg-primary px-3 py-3 text-left text-xs font-bold uppercase shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]">
              {t("membersName")}
            </th>
            {monthsShort.map((m, i) => (
              <th
                key={m}
                className={`px-2 py-3 text-right text-xs font-bold uppercase ${
                  monthStatus(data.year, i + 1, data.today) === "current" ? "bg-gold text-white" : ""
                }`}
              >
                {m}
              </th>
            ))}
            <th className="bg-primary-3 px-3 py-3 text-right text-xs font-bold uppercase">{t("total")}</th>
            <th className="bg-gold-deep px-3 py-3 text-right text-xs font-bold uppercase">{t("withdraw")}</th>
            <th className="px-3 py-3 text-right text-xs font-bold uppercase">{t("balance")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <motion.tr
              key={r.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * idx }}
              onClick={() => openMember(r.id)}
              className="group cursor-pointer border-b border-line-soft odd:bg-white even:bg-surface-low/60 hover:bg-lavender/60"
            >
              <td className="sticky left-0 z-10 px-3 py-3 text-center font-semibold text-ink-muted group-odd:bg-white group-even:bg-surface-low group-hover:bg-lavender">
                {r.sn}
              </td>
              <td className="sticky left-12 z-10 px-3 py-3 font-semibold text-ink shadow-[4px_0_8px_-4px_rgba(47,0,82,0.12)] group-odd:bg-white group-even:bg-surface-low group-hover:bg-lavender">
                {r.name}
              </td>
              {r.contributions.map((c, i) => {
                const missing = r.missingMonths.includes(i + 1);
                return (
                  <td key={i} className={`px-2 py-3 text-right ${missing ? "bg-negative-soft/70" : ""}`}>
                    {isPaid(c) ? (
                      <span className="font-medium text-ink">{formatAmount(c!, lang)}</span>
                    ) : missing ? (
                      <span className="text-xs font-bold text-negative">&mdash;</span>
                    ) : (
                      <span className="text-line">&middot;</span>
                    )}
                  </td>
                );
              })}
              <td className="bg-lavender/50 px-3 py-3 text-right font-bold text-primary">{formatAmount(r.total, lang)}</td>
              <td className="bg-gold-soft/50 px-3 py-3 text-right font-bold text-gold-deep">{formatAmount(r.withdraw, lang)}</td>
              <td className="px-3 py-3 text-right">
                <SignedAmount value={r.balance} />
              </td>
            </motion.tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-surface-high font-bold">
            <td className="sticky left-0 z-10 bg-surface-high px-3 py-3" />
            <td className="sticky left-12 z-10 bg-surface-high px-3 py-3 text-primary uppercase">{t("totals")}</td>
            {months.map((m) => (
              <td key={m.month} className="px-2 py-3 text-right text-primary">
                {m.contributed ? formatAmount(m.contributed, lang) : "-"}
              </td>
            ))}
            <td className="bg-lavender px-3 py-3 text-right text-primary">{formatAmount(totals.total, lang)}</td>
            <td className="bg-gold-soft px-3 py-3 text-right text-gold-deep">{formatAmount(totals.withdraw, lang)}</td>
            <td className="px-3 py-3 text-right">
              <SignedAmount value={totals.balance} />
            </td>
          </tr>
        </tfoot>
      </table>
    </motion.div>
  );
}

function LedgerCards() {
  const { t, lang, monthsShort } = useI18n();
  const { data, rows, totals, openMember } = useLedger();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-3xl bg-primary p-4 text-white shadow-lift">
        <div>
          <p className="text-[10px] font-bold uppercase text-white/60">{t("total")}</p>
          <p className="tabular font-display font-extrabold">{formatAmount(totals.total, lang)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-white/60">{t("withdraw")}</p>
          <p className="tabular font-display font-extrabold text-gold-bright">{formatAmount(totals.withdraw, lang)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-white/60">{t("balance")}</p>
          <SignedAmount
            value={totals.balance}
            className={`font-display ${totals.balance > 0 ? "!text-emerald-300" : totals.balance < 0 ? "!text-red-300" : "!text-white"}`}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((r, idx) => (
          <motion.button
            key={r.id}
            type="button"
            onClick={() => openMember(r.id)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * idx }}
            whileTap={{ scale: 0.98 }}
            className="rounded-3xl border border-line-soft bg-white p-4 text-left shadow-card transition hover:shadow-lift"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-2 to-primary-3 font-display text-sm font-bold text-white">
                {r.sn}
              </span>
              <p className="min-w-0 flex-1 truncate font-display font-bold text-ink">{r.name}</p>
              <SignedAmount value={r.balance} />
            </div>
            <div className="mt-3 grid grid-cols-12 gap-1">
              {r.contributions.map((c, i) => {
                const status = monthStatus(data.year, i + 1, data.today);
                const paid = isPaid(c);
                const missing = r.missingMonths.includes(i + 1);
                return (
                  <span key={i} className="flex flex-col items-center gap-1">
                    <span
                      className={`h-6 w-full rounded-md ${
                        paid ? "bg-gradient-to-t from-primary-2 to-primary-3" : missing ? "bg-negative/80" : status === "current" ? "bg-gold-soft ring-1 ring-gold" : "bg-surface-high"
                      }`}
                      title={paid ? formatAmount(c!, lang) : undefined}
                    />
                    <span className="text-[9px] font-semibold text-ink-muted">{monthsShort[i].slice(0, 1)}</span>
                  </span>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-lavender/60 px-3 py-1.5">
                <p className="text-[10px] font-bold uppercase text-primary-3">{t("total")}</p>
                <p className="tabular font-bold text-primary">{formatAmount(r.total, lang)}</p>
              </div>
              <div className="rounded-xl bg-gold-soft/60 px-3 py-1.5">
                <p className="text-[10px] font-bold uppercase text-gold-deep">{t("withdraw")}</p>
                <p className="tabular font-bold text-gold-deep">{formatAmount(r.withdraw, lang)}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

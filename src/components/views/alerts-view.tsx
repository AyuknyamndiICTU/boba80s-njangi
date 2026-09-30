"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BellRing, CalendarX2, CheckCircle2, MessageCircle, PencilLine, UserX } from "lucide-react";
import { ExportMenu } from "@/components/export-menu";
import { useI18n } from "@/components/i18n-provider";
import { useLedger } from "@/components/ledger-provider";
import { passedMonths } from "@/lib/dates";

export function AlertsView() {
  const { t, months } = useI18n();
  const { data, rows, months: summaries, missing, openMonth, openMember } = useLedger();
  const [mode, setMode] = useState<"month" | "member">("month");

  const monthGroups = useMemo(() => summaries.filter((m) => m.missing.length > 0).reverse(), [summaries]);
  const memberGroups = useMemo(
    () => rows.filter((r) => r.missingMonths.length > 0).sort((a, b) => b.missingMonths.length - a.missingMonths.length),
    [rows],
  );
  const noneEnded = passedMonths(data.year, data.today).length === 0;

  const whatsappLink = (month: number, names: string[]) =>
    `https://wa.me/?text=${encodeURIComponent(
      t("whatsappMessage", { month: months[month - 1], year: data.year, names: names.join(", ") }),
    )}`;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-2 to-[#7f1d1d] p-6 text-white shadow-lift sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 animate-float rounded-full bg-red-400/30 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <motion.span
            animate={missing > 0 ? { rotate: [0, -14, 12, -8, 6, 0] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
            className={`grid size-16 shrink-0 place-items-center rounded-2xl ${missing > 0 ? "bg-negative" : "bg-positive"} shadow-lift`}
          >
            {missing > 0 ? <BellRing className="size-8" /> : <CheckCircle2 className="size-8" />}
          </motion.span>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{t("alertsTitle")}</h1>
            <p className="mt-1 text-sm text-white/75">{t("alertsSubtitle")}</p>
            {missing > 0 && (
              <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-bold backdrop-blur">
                {t("alertsSummary", { n: missing, m: memberGroups.length })}
              </p>
            )}
          </div>
          <ExportMenu reports={["alerts"]} />
        </div>
      </section>

      {missing === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center rounded-3xl border border-line-soft bg-white px-6 py-14 text-center shadow-card"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.1 }}
            className="grid size-20 place-items-center rounded-full bg-positive-soft text-positive"
          >
            <CheckCircle2 className="size-10" />
          </motion.span>
          <h2 className="mt-4 font-display text-xl font-extrabold text-primary">{t("allClear")}</h2>
          <p className="mt-1 text-ink-muted">{noneEnded ? t("noPassedMonths", { year: data.year }) : t("allClearHint", { year: data.year })}</p>
        </motion.div>
      ) : (
        <>
          <div className="flex rounded-full border border-line-soft bg-white p-1 shadow-card sm:w-fit">
            {(
              [
                ["month", CalendarX2, t("byMonth")],
                ["member", UserX, t("byMember")],
              ] as const
            ).map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                aria-pressed={mode === key}
                className={`relative flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition sm:flex-none ${
                  mode === key ? "text-white" : "text-ink-muted hover:text-primary"
                }`}
              >
                {mode === key && <motion.span layoutId="alerts-mode" className="absolute inset-0 rounded-full bg-primary" />}
                <Icon className="relative size-4" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "month" ? (
              <motion.div
                key="month"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid gap-4 lg:grid-cols-2"
              >
                {monthGroups.map((g, idx) => (
                  <motion.article
                    key={g.month}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative overflow-hidden rounded-3xl border border-line-soft bg-white p-5 shadow-card"
                  >
                    <span className="absolute inset-y-0 left-0 w-1.5 bg-negative" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-negative">{t("monthEnded")}</p>
                        <h3 className="font-display text-xl font-extrabold text-primary">
                          {months[g.month - 1]} {data.year}
                        </h3>
                      </div>
                      <span className="rounded-full bg-negative-soft px-3 py-1 text-sm font-bold text-negative">
                        {t("missingCount", { n: g.missing.length })}
                      </span>
                    </div>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {g.missing.map((r) => (
                        <li key={r.id} className="rounded-full border border-negative/20 bg-negative-soft/50 px-3 py-1 text-sm font-semibold text-ink">
                          {r.name}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openMonth(g.month)}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-2 px-4 text-sm font-semibold text-white transition hover:bg-primary"
                      >
                        <PencilLine className="size-4" />
                        {t("record")}
                      </button>
                      <a
                        href={whatsappLink(g.month, g.missing.map((r) => r.name))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white transition hover:brightness-95"
                      >
                        <MessageCircle className="size-4" />
                        {t("shareWhatsApp")}
                      </a>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="member"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid gap-3 md:grid-cols-2"
              >
                {memberGroups.map((r, idx) => (
                  <motion.article
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="rounded-3xl border border-line-soft bg-white p-4 shadow-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-negative-soft font-display font-bold text-negative">
                        {r.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display font-bold text-ink">{r.name}</p>
                        <p className="text-sm font-semibold text-negative">{t("monthsMissing", { n: r.missingMonths.length })}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openMember(r.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary-2 px-3.5 text-sm font-semibold text-white hover:bg-primary"
                      >
                        <PencilLine className="size-4" />
                        {t("record")}
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.missingMonths.map((m) => (
                        <span key={m} className="rounded-lg bg-negative-soft px-2 py-1 text-xs font-bold text-negative">
                          {months[m - 1]}
                        </span>
                      ))}
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

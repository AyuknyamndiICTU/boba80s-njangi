"use client";

import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { ArrowDownRight, CheckCircle2, CircleAlert, PencilLine, Sparkles, TrendingUp, Users, Wallet } from "lucide-react";
import { ExportMenu } from "@/components/export-menu";
import { useI18n } from "@/components/i18n-provider";
import { useLedger } from "@/components/ledger-provider";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { formatAmount, formatSigned } from "@/lib/format";
import type { MonthSummary } from "@/lib/ledger";

export const MONTH_GRADIENTS = [
  ["#2f0052", "#7b2cbf"],
  ["#4a0e78", "#c026d3"],
  ["#3b0764", "#6d28d9"],
  ["#5a189a", "#d97706"],
  ["#6b21a8", "#fe932c"],
  ["#904d00", "#f59e0b"],
  ["#9a3412", "#fbbf24"],
  ["#831843", "#f97316"],
  ["#5b21b6", "#db2777"],
  ["#4c1d95", "#c2410c"],
  ["#312e81", "#7c3aed"],
  ["#2f0052", "#d97706"],
];

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export function MonthsView() {
  const { t } = useI18n();
  const { data, rows, months, totals } = useLedger();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-2 to-[#6b1d5c] bg-[length:200%_200%] p-6 text-white shadow-lift animate-gradient sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 animate-float rounded-full bg-gold-bright/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 size-80 animate-float rounded-full bg-primary-3/50 blur-3xl [animation-delay:-3s]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4 lg:flex-1">
            <motion.span
              initial={{ rotate: -20, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="grid size-16 shrink-0 place-items-center rounded-full bg-white p-1 ring-4 ring-gold-bright/50 sm:size-20"
            >
              <Image src="/logo.png" alt="" width={76} height={76} className="rounded-full" />
            </motion.span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-bright sm:text-xs">{t("school")}</p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">{t("njangiTitle", { year: data.year })}</h1>
              <p className="mt-1 max-w-xl text-sm text-white/75">{t("heroSubtitle")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[34rem]">
            <HeroStat icon={<TrendingUp className="size-4" />} label={t("totalContributed")}>
              <AnimatedNumber value={totals.total} />
            </HeroStat>
            <HeroStat icon={<ArrowDownRight className="size-4" />} label={t("totalWithdrawn")}>
              <AnimatedNumber value={totals.withdraw} />
            </HeroStat>
            <HeroStat icon={<Wallet className="size-4" />} label={t("netBalance")}>
              <AnimatedNumber
                value={totals.balance}
                signed
                className={totals.balance > 0 ? "text-emerald-300" : totals.balance < 0 ? "text-red-300" : ""}
              />
            </HeroStat>
            <HeroStat icon={<Users className="size-4" />} label={t("activeMembers")}>
              <span className="tabular">{rows.length}</span>
            </HeroStat>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-primary sm:text-2xl">
            <Sparkles className="size-5 text-gold" />
            {t("navMonths")} {data.year}
          </h2>
          <ExportMenu reports={["monthly", "annual"]} />
        </div>

        <motion.div
          variants={grid}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5"
        >
          {months.map((m) => (
            <MonthCard key={m.month} summary={m} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}

function HeroStat({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md sm:p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
        <span className="text-gold-bright">{icon}</span>
        {label}
      </p>
      <p className="mt-1 truncate font-display text-lg font-extrabold sm:text-2xl">{children}</p>
    </div>
  );
}

function MonthCard({ summary }: { summary: MonthSummary }) {
  const { t, lang, months } = useI18n();
  const { data, openMonth } = useLedger();
  const [from, to] = MONTH_GRADIENTS[summary.month - 1];
  const net = summary.contributed - summary.withdrawn;
  const pct = summary.count ? Math.round((summary.paid / summary.count) * 100) : 0;
  const isCurrent = summary.status === "current";
  const missing = summary.missing.length;

  return (
    <motion.button
      type="button"
      variants={card}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => openMonth(summary.month)}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white text-left shadow-card transition-shadow duration-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-2/30 ${
        isCurrent ? "outline-2 outline-gold-bright animate-pulse-ring" : "ring-1 ring-line-soft"
      }`}
    >
      <div className="relative h-28 overflow-hidden p-4 text-white" style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}>
        <span className="pointer-events-none absolute -bottom-6 -right-2 font-display text-[6.5rem] font-extrabold leading-none text-white/15 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-110">
          {String(summary.month).padStart(2, "0")}
        </span>
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/35 to-transparent group-hover:animate-shine" />
        <div className="relative flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-2xl font-extrabold tracking-tight">{months[summary.month - 1]}</p>
            <p className="text-sm font-medium text-white/75">{data.year}</p>
          </div>
          <StatusChip status={summary.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{t("totalContributed")}</p>
          <p className="font-display text-2xl font-extrabold text-primary">
            <AnimatedNumber value={summary.contributed} /> <span className="text-xs font-bold text-ink-muted">FCFA</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-gold-soft/60 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-gold-deep">{t("withdraw")}</p>
            <p className="tabular font-bold text-gold-deep">{formatAmount(summary.withdrawn, lang)}</p>
          </div>
          <div className="rounded-xl bg-surface-mid px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-ink-muted">{t("balance")}</p>
            <p className={`tabular font-bold ${net > 0 ? "text-positive" : net < 0 ? "text-negative" : "text-ink-muted"}`}>
              {formatSigned(net, lang)}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-ink-muted">
            <span>{t("paidCount", { paid: summary.paid, total: summary.count })}</span>
            <span className="tabular">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-high">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundImage: `linear-gradient(90deg, ${from}, ${to})` }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.3 + summary.month * 0.04, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <div className="mt-auto pt-1">
          {summary.status === "past" && missing > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-negative-soft px-2.5 py-1 text-xs font-bold text-negative">
              <CircleAlert className="size-3.5" />
              {t("missingCount", { n: missing })}
            </span>
          ) : summary.count > 0 && summary.paid === summary.count ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-positive-soft px-2.5 py-1 text-xs font-bold text-positive">
              <CheckCircle2 className="size-3.5" />
              {t("allPaid")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-3 transition group-hover:text-gold-deep">
              <PencilLine className="size-3.5" />
              {t("tapToRecord")}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function StatusChip({ status }: { status: MonthSummary["status"] }) {
  const { t } = useI18n();
  if (status === "current") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-bright px-2.5 py-1 text-[11px] font-bold text-primary shadow">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
        {t("statusCurrent")}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
      {status === "past" ? t("statusPast") : t("statusUpcoming")}
    </span>
  );
}

"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, Award, CalendarCheck2, Gauge, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { ExportMenu } from "@/components/export-menu";
import { useI18n } from "@/components/i18n-provider";
import { useLedger } from "@/components/ledger-provider";
import { AnimatedNumber, SignedAmount } from "@/components/ui/animated-number";
import { analyze } from "@/lib/analysis";
import { formatAmount, formatCompact } from "@/lib/format";

const PALETTE = ["#4a0e78", "#d97706", "#7b2cbf", "#fe932c", "#c026d3", "#904d00", "#6d28d9", "#db2777", "#2f0052", "#f59e0b", "#a855f7", "#c2410c"];

export function AnalysisView() {
  const { t, lang, months: monthNames, monthsShort } = useI18n();
  const { data, rows, months } = useLedger();
  const a = useMemo(() => analyze(rows, months, data.year, data.today), [rows, months, data]);

  const monthly = months.map((m, i) => ({ name: monthsShort[i], contributed: m.contributed, withdrawn: m.withdrawn }));
  const cumulative = a.cumulative.map((c, i) => ({ name: monthsShort[i], balance: c.balance }));
  const byMember = [...a.memberStats].sort((x, y) => y.total - x.total).map((r) => ({ name: r.name, total: r.total }));
  const pie = byMember.filter((m) => m.total > 0);
  const money = (v: unknown) => `${formatAmount(Number(v), lang)} FCFA`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">{t("analysisTitle")}</h1>
          <p className="mt-1 text-ink-muted">{t("analysisSubtitle", { year: data.year })}</p>
        </div>
        <ExportMenu reports={["analysis", "annual"]} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi i={0} icon={<TrendingUp />} label={t("totalContributed")} tone="primary">
          <AnimatedNumber value={a.total} />
        </Kpi>
        <Kpi i={1} icon={<ArrowDownRight />} label={t("totalWithdrawn")} tone="gold">
          <AnimatedNumber value={a.withdraw} />
        </Kpi>
        <Kpi i={2} icon={<Wallet />} label={t("netBalance")} tone={a.balance < 0 ? "negative" : "positive"}>
          <AnimatedNumber value={a.balance} signed />
        </Kpi>
        <Kpi i={3} icon={<Gauge />} label={t("collectionRate")} tone="primary" hint={t("collectionRateHint")}>
          {a.collectionRate === null ? "-" : <AnimatedNumber value={a.collectionRate} decimals={1} suffix="%" />}
        </Kpi>
        <Kpi i={4} icon={<PiggyBank />} label={t("avgMonthly")} tone="gold">
          <AnimatedNumber value={a.avgMonthly} />
        </Kpi>
        <Kpi i={5} icon={<Award />} label={t("bestMonth")} tone="primary" hint={a.best ? `${formatAmount(a.best.contributed, lang)} FCFA` : undefined}>
          {a.best ? monthNames[a.best.month - 1] : "-"}
        </Kpi>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title={t("monthlyChart")} className="lg:col-span-3" i={0}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} margin={{ left: -8, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gContrib" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7b2cbf" />
                  <stop offset="100%" stopColor="#2f0052" />
                </linearGradient>
                <linearGradient id="gWithdraw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fe932c" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eadff0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4c4451" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: "#4c4451" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={money} cursor={{ fill: "#f6e9ff" }} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="contributed" name={t("contribution")} fill="url(#gContrib)" radius={[6, 6, 0, 0]} animationDuration={1200} />
              <Bar dataKey="withdrawn" name={t("withdrawal")} fill="url(#gWithdraw)" radius={[6, 6, 0, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title={t("cumulativeChart")} className="lg:col-span-2" i={1}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cumulative} margin={{ left: -8, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7b2cbf" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#7b2cbf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eadff0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4c4451" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: "#4c4451" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={money} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="balance" name={t("balance")} stroke="#4a0e78" strokeWidth={3} fill="url(#gBalance)" animationDuration={1400} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title={t("memberTotalsChart")} className="lg:col-span-3" i={2}>
          <ResponsiveContainer width="100%" height={Math.max(240, byMember.length * 30)}>
            <BarChart data={byMember} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eadff0" horizontal={false} />
              <XAxis type="number" tickFormatter={formatCompact} tick={{ fontSize: 11, fill: "#4c4451" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#20182b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={money} cursor={{ fill: "#f6e9ff" }} contentStyle={tooltipStyle} />
              <Bar dataKey="total" name={t("total")} radius={[0, 8, 8, 0]} animationDuration={1200}>
                {byMember.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title={t("shareChart")} className="lg:col-span-2" i={3}>
          {pie.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pie} dataKey="total" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} animationDuration={1200}>
                  {pie.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={money} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title={t("complianceChart")} className="lg:col-span-2" i={4}>
          {a.passedCount === 0 ? (
            <Empty text={t("noPassedMonths", { year: data.year })} />
          ) : (
            <ul className="space-y-3">
              {[...a.memberStats]
                .sort((x, y) => (y.rate ?? 0) - (x.rate ?? 0))
                .map((r, i) => {
                  const rate = r.rate ?? 0;
                  const color = rate >= 90 ? "#0f8a4f" : rate >= 60 ? "#d97706" : "#c81e1e";
                  return (
                    <li key={r.id}>
                      <div className="mb-1 flex justify-between gap-2 text-sm">
                        <span className="truncate font-semibold text-ink">{r.name}</span>
                        <span className="tabular shrink-0 font-bold" style={{ color }}>
                          {r.paidMonths}/{a.passedCount} &middot; {rate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-high">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${rate}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </Panel>

        <Panel title={t("memberSummary")} className="lg:col-span-3" i={5}>
          <div className="scrollbar-thin -mx-5 overflow-x-auto px-5">
            <table className="tabular w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line-soft text-left text-xs font-bold uppercase text-ink-muted">
                  <th className="py-2 pr-2">{t("sn")}</th>
                  <th className="py-2 pr-2">{t("member")}</th>
                  <th className="py-2 pr-2 text-right">{t("monthsPaid")}</th>
                  <th className="py-2 pr-2 text-right">{t("total")}</th>
                  <th className="py-2 pr-2 text-right">{t("withdraw")}</th>
                  <th className="py-2 text-right">{t("balance")}</th>
                </tr>
              </thead>
              <tbody>
                {a.memberStats.map((r) => (
                  <tr key={r.id} className="border-b border-line-soft/70 last:border-0">
                    <td className="py-2.5 pr-2 text-ink-muted">{r.sn}</td>
                    <td className="py-2.5 pr-2 font-semibold">
                      <span className="flex items-center gap-1.5">
                        {a.top?.id === r.id && <CalendarCheck2 className="size-4 shrink-0 text-gold" aria-label={t("topContributor")} />}
                        {r.name}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 text-right">{r.paidMonths}</td>
                    <td className="py-2.5 pr-2 text-right font-semibold text-primary">{formatAmount(r.total, lang)}</td>
                    <td className="py-2.5 pr-2 text-right text-gold-deep">{formatAmount(r.withdraw, lang)}</td>
                    <td className="py-2.5 text-right">
                      <SignedAmount value={r.balance} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #eadff0",
  boxShadow: "0 8px 24px -4px rgba(74,14,120,0.18)",
  fontSize: 12,
};

function Kpi({
  icon,
  label,
  hint,
  tone,
  children,
  i,
}: {
  icon: React.ReactElement;
  label: string;
  hint?: string;
  tone: "primary" | "gold" | "positive" | "negative";
  children: React.ReactNode;
  i: number;
}) {
  const iconBg = {
    primary: "from-primary-2 to-primary-3",
    gold: "from-gold to-gold-bright",
    positive: "from-emerald-600 to-emerald-400",
    negative: "from-red-700 to-red-500",
  };
  const text = { primary: "text-primary", gold: "text-gold-deep", positive: "text-positive", negative: "text-negative" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }}
      className="rounded-3xl border border-line-soft bg-white p-4 shadow-card"
    >
      <span className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br text-white [&>svg]:size-5 ${iconBg[tone]}`}>
        {icon}
      </span>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-0.5 truncate font-display text-lg font-extrabold sm:text-xl ${text[tone]}`}>{children}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-ink-muted">{hint}</p>}
    </motion.div>
  );
}

function Panel({ title, className = "", children, i }: { title: string; className?: string; children: React.ReactNode; i: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (i % 2) * 0.08, duration: 0.5 }}
      className={`rounded-3xl border border-line-soft bg-white p-5 shadow-card ${className}`}
    >
      <h2 className="mb-4 font-display text-base font-bold text-primary">{title}</h2>
      {children}
    </motion.section>
  );
}

function Empty({ text }: { text?: string }) {
  const { t } = useI18n();
  return <p className="grid h-60 place-items-center text-center text-sm text-ink-muted">{text ?? t("noData")}</p>;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { BarChart3, Bell, CalendarDays, CalendarPlus, Check, ChevronDown, LogOut, Sheet, Users } from "lucide-react";
import { toast } from "sonner";
import { logoutAction } from "@/app/actions/auth";
import { createYearAction, setYearAction } from "@/app/actions/ledger";
import { useI18n } from "@/components/i18n-provider";
import { useLedger } from "@/components/ledger-provider";
import { Modal } from "@/components/ui/modal";
import { MenuItem, Popover } from "@/components/ui/popover";
import type { DictKey } from "@/lib/i18n";

const NAV: { href: string; label: DictKey; icon: typeof CalendarDays }[] = [
  { href: "/", label: "navMonths", icon: CalendarDays },
  { href: "/annual", label: "navAnnual", icon: Sheet },
  { href: "/alerts", label: "navAlerts", icon: Bell },
  { href: "/analysis", label: "navAnalysis", icon: BarChart3 },
];

export function AppShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { missing } = useLedger();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line-soft/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-white ring-2 ring-gold/60 shadow-card">
              <Image src="/logo.png" alt="BOBA 80s" width={44} height={44} className="rounded-full" priority />
            </span>
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block font-display text-lg font-extrabold tracking-tight text-primary">BOBA 80s</span>
              <span className="block truncate text-xs font-medium text-ink-muted">Njangi &middot; CPC Bali</span>
            </span>
          </Link>

          <nav className="mx-auto hidden items-center gap-1 rounded-full bg-surface-mid/80 p-1 md:flex">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active ? "text-white" : "text-ink-muted hover:text-primary"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary-2 shadow-card"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className="relative size-4" />
                  <span className="relative">{t(item.label)}</span>
                  {item.href === "/alerts" && missing > 0 && (
                    <span className="relative grid min-w-5 place-items-center rounded-full bg-negative px-1.5 text-[11px] font-bold text-white">
                      {missing}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <YearPicker />
            <LangToggle />
            <UserMenu userName={userName} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-5 sm:px-6 md:pb-12 md:pt-8">{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-3xl border border-white/60 bg-white/90 p-1.5 shadow-lift backdrop-blur-xl pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden">
        <ul className="grid grid-cols-4">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold transition ${
                    active ? "text-white" : "text-ink-muted"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="bottom-pill"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary-2"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">
                    <item.icon className="size-5" />
                    {item.href === "/alerts" && missing > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-negative px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {missing}
                      </span>
                    )}
                  </span>
                  <span className="relative">{t(item.label)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function YearPicker() {
  const { t } = useI18n();
  const { data, years } = useLedger();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [newYear, setNewYear] = useState(String(Math.max(...years, data.year) + 1));

  const select = (year: number) =>
    startTransition(async () => {
      const res = await setYearAction(year);
      if (!res.ok) toast.error(t(res.error));
    });

  const create = () => {
    const year = Number(newYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return;
    startTransition(async () => {
      const res = await createYearAction(year);
      if (res.ok) setCreating(false);
      else toast.error(t(res.error));
    });
  };

  return (
    <>
      <Popover
        trigger={({ open, toggle }) => (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label={t("year")}
            className={`flex h-10 items-center gap-1.5 rounded-full border border-line-soft bg-white px-3.5 font-display text-sm font-bold text-primary shadow-card transition hover:border-primary-3 ${
              pending ? "opacity-60" : ""
            }`}
          >
            <CalendarDays className="size-4 text-gold" />
            {data.year}
            <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      >
        {(close) => (
          <div className="w-48">
            <div className="max-h-64 overflow-y-auto">
              {years.map((y) => (
                <MenuItem
                  key={y}
                  active={y === data.year}
                  onClick={() => {
                    close();
                    if (y !== data.year) select(y);
                  }}
                  icon={y === data.year ? <Check className="size-4" /> : <span className="size-4" />}
                >
                  {y}
                </MenuItem>
              ))}
            </div>
            <div className="my-1 h-px bg-line-soft" />
            <MenuItem
              icon={<CalendarPlus className="size-4 text-gold" />}
              onClick={() => {
                close();
                setCreating(true);
              }}
            >
              {t("newYear")}
            </MenuItem>
          </div>
        )}
      </Popover>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={t("newYear")}
        description={t("newYearHint")}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="h-11 rounded-xl border border-line px-5 font-semibold text-ink-muted hover:bg-surface-mid"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={create}
              disabled={pending}
              className="h-11 rounded-xl bg-primary-2 px-6 font-semibold text-white hover:bg-primary disabled:opacity-60"
            >
              {t("create")}
            </button>
          </div>
        }
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-muted">{t("year")}</span>
          <input
            type="number"
            min={2000}
            max={2100}
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            className="h-12 w-full rounded-xl border border-line px-4 font-display text-xl font-bold text-primary outline-none focus:border-primary-2 focus:ring-4 focus:ring-primary-2/20"
          />
        </label>
      </Modal>
    </>
  );
}

function LangToggle() {
  const { lang, setLang, pending } = useI18n();
  return (
    <div className={`hidden h-10 items-center rounded-full border border-line-soft bg-white p-1 shadow-card sm:flex ${pending ? "opacity-60" : ""}`}>
      {(["en", "fr"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => l !== lang && setLang(l)}
          aria-pressed={l === lang}
          className={`h-8 rounded-full px-3 text-xs font-bold uppercase transition ${
            l === lang ? "bg-primary text-white" : "text-ink-muted hover:text-primary"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function UserMenu({ userName }: { userName: string }) {
  const { t, lang, setLang } = useI18n();
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <Popover
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={userName}
          className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary-2 to-gold font-display text-sm font-bold text-white shadow-card ring-2 ring-white transition hover:scale-105"
        >
          {initials || "?"}
        </button>
      )}
    >
      {(close) => (
        <div className="w-56">
          <div className="px-3 py-2">
            <p className="truncate font-semibold text-ink">{userName}</p>
          </div>
          <div className="my-1 h-px bg-line-soft" />
          <Link
            href="/members"
            onClick={close}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-mid"
          >
            <Users className="size-4 text-primary-3" />
            {t("manageMembers")}
          </Link>
          <div className="flex gap-1 px-3 py-2 sm:hidden">
            {(["en", "fr"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  close();
                  if (l !== lang) setLang(l);
                }}
                className={`h-8 flex-1 rounded-full text-xs font-bold uppercase ${
                  l === lang ? "bg-primary text-white" : "bg-surface-mid text-ink-muted"
                }`}
              >
                {l === "en" ? "English" : "Français"}
              </button>
            ))}
          </div>
          <div className="my-1 h-px bg-line-soft" />
          <form action={logoutAction}>
            <MenuItem type="submit" tone="danger" icon={<LogOut className="size-4" />}>
              {t("logout")}
            </MenuItem>
          </form>
        </div>
      )}
    </Popover>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, Lock, User, UserRound } from "lucide-react";
import { loginAction, signupAction, type AuthState } from "@/app/actions/auth";
import { useI18n } from "@/components/i18n-provider";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t, lang, setLang } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? loginAction : signupAction,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-2 to-[#7a2d0a] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="absolute -left-24 top-10 size-96 animate-float rounded-full bg-gold-bright/25 blur-3xl" />
        <div className="absolute -bottom-24 right-0 size-[28rem] animate-float rounded-full bg-primary-3/40 blur-3xl [animation-delay:-4s]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative grid size-72 place-items-center rounded-full bg-white p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] ring-8 ring-gold/40"
        >
          <Image src="/logo.png" alt="BOBA 80s crest" width={280} height={280} className="rounded-full" priority />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7 }}
          className="relative mt-10 max-w-md px-8 text-center text-white"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-bright">{t("school")}</p>
          <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight">BOBA 80S</h1>
          <p className="mt-2 font-display text-xl font-semibold text-white/80">Njangi Contribution</p>
        </motion.div>
      </aside>

      <section className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-10">
        <div className="absolute right-5 top-5 flex rounded-full border border-line-soft bg-white p-1 shadow-card">
          {(["en", "fr"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => l !== lang && setLang(l)}
              className={`h-8 rounded-full px-3 text-xs font-bold uppercase ${l === lang ? "bg-primary text-white" : "text-ink-muted"}`}
            >
              {l}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <span className="grid size-28 place-items-center rounded-full bg-white p-1.5 shadow-lift ring-4 ring-gold/40">
              <Image src="/logo.png" alt="BOBA 80s crest" width={108} height={108} className="rounded-full" priority />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">{t("school")}</p>
            <p className="font-display text-3xl font-extrabold text-primary">BOBA 80S</p>
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight text-primary">
            {mode === "login" ? t("loginTitle") : t("signupTitle")}
          </h2>
          <p className="mt-2 text-ink-muted">{mode === "login" ? t("loginSubtitle") : t("signupSubtitle")}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              startTransition(() => action(formData));
            }}
            className="mt-8 space-y-4"
          >
            {mode === "signup" && (
              <Field icon={<UserRound className="size-5" />} label={t("fullName")}>
                <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={inputClass} />
              </Field>
            )}
            <Field icon={<User className="size-5" />} label={t("identifier")}>
              <input name="identifier" required maxLength={120} autoComplete="username" className={inputClass} />
            </Field>
            <Field
              icon={<Lock className="size-5" />}
              label={t("password")}
              hint={mode === "signup" ? t("passwordHint") : undefined}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="grid size-9 place-items-center rounded-full text-ink-muted hover:text-primary"
                  aria-label={t("password")}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              }
            >
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={mode === "signup" ? 8 : 1}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={inputClass}
              />
            </Field>
            {mode === "signup" && (
              <Field icon={<KeyRound className="size-5" />} label={t("accessCode")}>
                <input name="accessCode" required autoComplete="off" className={inputClass} />
              </Field>
            )}

            {state?.error && (
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                className="rounded-xl bg-negative-soft px-4 py-3 text-sm font-semibold text-negative"
                role="alert"
              >
                {t(state.error)}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="group relative flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-2 to-primary bg-[length:200%_100%] font-display text-base font-bold text-white shadow-lift transition hover:bg-right disabled:opacity-70"
            >
              {pending ? <Loader2 className="size-5 animate-spin" /> : null}
              {mode === "login" ? t("signIn") : t("signUp")}
              {!pending && <ArrowRight className="size-5 text-gold-bright transition group-hover:translate-x-1" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
            <Link href={mode === "login" ? "/signup" : "/login"} className="font-bold text-primary-2 hover:text-gold-deep">
              {mode === "login" ? t("signUp") : t("signIn")}
            </Link>
          </p>
        </motion.div>
      </section>
    </div>
  );
}

const inputClass = "h-12 w-full min-w-0 bg-transparent text-[15px] font-medium text-ink outline-none";

function Field({
  icon,
  label,
  hint,
  trailing,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-muted">{label}</span>
      <span className="flex items-center gap-2 rounded-2xl border border-line bg-white pl-4 pr-1.5 shadow-card transition focus-within:border-primary-2 focus-within:ring-4 focus-within:ring-primary-2/15">
        <span className="text-primary-3">{icon}</span>
        {children}
        {trailing}
      </span>
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

"use client";

import { createContext, useContext, useMemo, useTransition } from "react";
import { setLangAction } from "@/app/actions/ledger";
import { MONTHS, MONTHS_SHORT, translator, type Lang, type Translate } from "@/lib/i18n";

type I18nValue = {
  lang: Lang;
  t: Translate;
  months: string[];
  monthsShort: string[];
  setLang: (lang: Lang) => void;
  pending: boolean;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const [pending, startTransition] = useTransition();
  const value = useMemo<I18nValue>(
    () => ({
      lang,
      t: translator(lang),
      months: MONTHS[lang],
      monthsShort: MONTHS_SHORT[lang],
      setLang: (next) => startTransition(() => setLangAction(next)),
      pending,
    }),
    [lang, pending],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

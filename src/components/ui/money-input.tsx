"use client";

import { forwardRef } from "react";
import { useI18n } from "@/components/i18n-provider";
import { formatAmount, parseAmount } from "@/lib/format";

type MoneyInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  tone?: "default" | "gold";
  placeholder?: string;
};

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, label, tone = "default", placeholder = "0" },
  ref,
) {
  const { lang } = useI18n();
  const ring =
    tone === "gold"
      ? "focus-within:border-gold focus-within:ring-gold/25"
      : "focus-within:border-primary-2 focus-within:ring-primary-2/20";
  return (
    <label className={`flex h-11 items-center gap-1 rounded-xl border border-line bg-white px-3 transition focus-within:ring-4 ${ring}`}>
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const n = parseAmount(e.target.value);
          onChange(n === null ? "" : formatAmount(n, lang));
        }}
        className="tabular w-full min-w-0 bg-transparent text-right text-[15px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-line"
      />
      <span className="text-[11px] font-semibold text-ink-muted">FCFA</span>
    </label>
  );
});

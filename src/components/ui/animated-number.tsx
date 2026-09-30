"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";
import { useI18n } from "@/components/i18n-provider";
import { formatAmount, formatSigned } from "@/lib/format";

export function AnimatedNumber({
  value,
  signed = false,
  suffix = "",
  decimals = 0,
  className,
}: {
  value: number;
  signed?: boolean;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const { lang } = useI18n();
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const format = (v: number) => {
      if (decimals > 0) return `${v.toFixed(decimals)}${suffix}`;
      const rounded = Math.round(v);
      return `${signed ? formatSigned(rounded, lang) : formatAmount(rounded, lang)}${suffix}`;
    };
    const controls = animate(previous.current, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = format(v)),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, signed, suffix, decimals, lang]);

  return <span ref={ref} className={`tabular ${className ?? ""}`} />;
}

export function SignedAmount({ value, className = "" }: { value: number; className?: string }) {
  const { lang } = useI18n();
  const tone = value > 0 ? "text-positive" : value < 0 ? "text-negative" : "text-ink-muted";
  return <span className={`tabular font-bold ${tone} ${className}`}>{formatSigned(value, lang)}</span>;
}

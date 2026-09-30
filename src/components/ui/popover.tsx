"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export function Popover({
  trigger,
  children,
  align = "right",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className={`absolute top-full z-40 mt-2 min-w-52 overflow-hidden rounded-2xl border border-line-soft bg-white p-1.5 shadow-lift ${
              align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
            }`}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  active,
  tone = "default",
  type = "button",
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  tone?: "default" | "danger";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
        tone === "danger"
          ? "text-negative hover:bg-negative-soft"
          : active
            ? "bg-lavender text-primary"
            : "text-ink hover:bg-surface-mid"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

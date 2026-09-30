"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const subscribe = () => () => {};

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const width = size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={`relative flex max-h-[92dvh] w-full ${width} flex-col overflow-hidden rounded-t-3xl bg-white shadow-modal outline-none sm:rounded-3xl`}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line sm:hidden" />
            <div className="flex items-start gap-3 border-b border-line-soft px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="font-display text-lg font-bold text-primary sm:text-xl">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted transition hover:bg-surface-mid hover:text-primary"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
            {footer && (
              <div className="border-t border-line-soft bg-surface-low/60 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

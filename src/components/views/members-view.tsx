"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { addMemberAction, moveMemberAction, removeMemberAction, renameMemberAction } from "@/app/actions/ledger";
import { useI18n } from "@/components/i18n-provider";
import { useLedger } from "@/components/ledger-provider";
import { SignedAmount } from "@/components/ui/animated-number";
import { Modal } from "@/components/ui/modal";
import type { MemberRow } from "@/lib/ledger";

export function MembersView() {
  const { t } = useI18n();
  const { data, rows } = useLedger();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<MemberRow | null>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await addMemberAction(data.year, name.trim());
      if (res.ok) {
        toast.success(t("memberAdded"));
        setName("");
      } else toast.error(t(res.error));
    });
  };

  const confirmRemove = () => {
    if (!removing) return;
    const target = removing;
    startTransition(async () => {
      const res = await removeMemberAction(data.year, target.id);
      if (res.ok) toast.success(t("memberRemoved"));
      else toast.error(t(res.error));
      setRemoving(null);
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-3 text-white shadow-lift">
          <Users className="size-7" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">{t("membersTitle")}</h1>
          <p className="text-ink-muted">{t("membersSubtitle", { year: data.year })}</p>
        </div>
      </div>

      <form onSubmit={add} className="flex flex-col gap-2 rounded-3xl border border-line-soft bg-white p-3 shadow-card sm:flex-row">
        <label className="flex h-12 flex-1 items-center gap-2 rounded-2xl bg-surface-low px-4 focus-within:ring-4 focus-within:ring-primary-2/15">
          <UserPlus className="size-5 text-primary-3" />
          <span className="sr-only">{t("newMemberPlaceholder")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={t("newMemberPlaceholder")}
            className="h-full w-full bg-transparent font-medium outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-gold-bright px-6 font-semibold text-white shadow-card transition hover:brightness-105 disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
          {t("addMember")}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-white p-10 text-center text-ink-muted">{t("noMembers")}</p>
      ) : (
        <motion.ul layout className="space-y-2">
          <AnimatePresence initial={false}>
            {rows.map((r, i) => (
              <MemberItem key={r.id} row={r} first={i === 0} last={i === rows.length - 1} onRemove={() => setRemoving(r)} />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <Modal
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={removing ? t("removeConfirmTitle", { name: removing.name }) : ""}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRemoving(null)} className="h-11 rounded-xl border border-line px-5 font-semibold text-ink-muted hover:bg-surface-mid">
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              disabled={pending}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-negative px-5 font-semibold text-white hover:brightness-95 disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {t("remove")}
            </button>
          </div>
        }
      >
        {removing && <p className="text-ink-muted">{t("removeConfirm", { name: removing.name, year: data.year })}</p>}
      </Modal>
    </div>
  );
}

function MemberItem({ row, first, last, onRemove }: { row: MemberRow; first: boolean; last: boolean; onRemove: () => void }) {
  const { t } = useI18n();
  const { data } = useLedger();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [pending, startTransition] = useTransition();

  const saveName = () => {
    const next = name.trim();
    if (!next || next === row.name) {
      setEditing(false);
      setName(row.name);
      return;
    }
    startTransition(async () => {
      const res = await renameMemberAction(row.id, next);
      if (res.ok) {
        toast.success(t("memberRenamed"));
        setEditing(false);
      } else toast.error(t(res.error));
    });
  };

  const move = (dir: "up" | "down") =>
    startTransition(async () => {
      const res = await moveMemberAction(data.year, row.id, dir);
      if (!res.ok) toast.error(t(res.error));
    });

  const iconBtn = "grid size-9 place-items-center rounded-full text-ink-muted transition hover:bg-surface-mid hover:text-primary disabled:opacity-30";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex items-center gap-3 rounded-2xl border border-line-soft bg-white p-3 shadow-card"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lavender font-display font-bold text-primary">{row.sn}</span>
      {editing ? (
        <form
          className="flex min-w-0 flex-1 items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
          }}
        >
          <input
            autoFocus
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (setEditing(false), setName(row.name))}
            className="h-10 min-w-0 flex-1 rounded-xl border border-primary-2 px-3 font-semibold outline-none ring-4 ring-primary-2/15"
          />
          <button type="submit" className={`${iconBtn} text-positive`} aria-label={t("save")} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-5" />}
          </button>
          <button type="button" className={iconBtn} aria-label={t("cancel")} onClick={() => (setEditing(false), setName(row.name))}>
            <X className="size-5" />
          </button>
        </form>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{row.name}</p>
            <p className="text-xs text-ink-muted">
              {t("balance")}: <SignedAmount value={row.balance} className="text-xs" />
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            <button type="button" className={iconBtn} onClick={() => move("up")} disabled={first || pending} aria-label={t("moveUp")}>
              <ArrowUp className="size-4" />
            </button>
            <button type="button" className={iconBtn} onClick={() => move("down")} disabled={last || pending} aria-label={t("moveDown")}>
              <ArrowDown className="size-4" />
            </button>
            <button type="button" className={iconBtn} onClick={() => setEditing(true)} aria-label={t("edit")}>
              <Pencil className="size-4" />
            </button>
            <button type="button" className={`${iconBtn} hover:!bg-negative-soft hover:!text-negative`} onClick={onRemove} aria-label={t("remove")}>
              <Trash2 className="size-4" />
            </button>
          </div>
        </>
      )}
    </motion.li>
  );
}

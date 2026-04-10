"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "./ui/ConfirmDialog";

export function DeleteMemberButton({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    setOpen(false);
    setBusy(true);
    const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete member");
      setBusy(false);
      return;
    }
    toast.success(`${memberName} deleted`);
    router.push("/members");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-400 disabled:opacity-50"
      >
        <Trash2 size={14} />
        {busy ? "Deleting…" : "Delete"}
      </button>
      <ConfirmDialog
        open={open}
        title={`Delete ${memberName}?`}
        message="This will also remove all their subscriptions and check-in history. This action cannot be undone."
        confirmLabel="Delete Member"
        cancelLabel="Keep"
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

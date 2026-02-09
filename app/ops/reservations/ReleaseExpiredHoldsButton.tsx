"use client";

import { useState, useTransition } from "react";
import { releaseExpiredHoldsAction } from "@/app/ops/actions/releaseExpiredHoldsAction";

export function ReleaseExpiredHoldsButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={pending}
        className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
        onClick={() => {
          setMsg(null);
          if (!confirm("Release all expired seat holds now?")) return;

          start(async () => {
            try {
              const out = await releaseExpiredHoldsAction();
              const released = Array.isArray(out) ? out?.[0]?.released_count : undefined;
              setMsg(`Released: ${released ?? "OK"}`);
            } catch (e: any) {
              setMsg(e?.message ?? "Failed");
            }
          });
        }}
      >
        {pending ? "Releasing…" : "Release expired holds"}
      </button>

      {msg ? <span className="text-xs text-slate-600">{msg}</span> : null}
    </div>
  );
}

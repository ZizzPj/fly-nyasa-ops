"use client";

import { useTransition } from "react";
import { createAgentAction } from "@/app/ops/actions/createAgentAction";

export function CreateAgentForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 md:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        startTransition(async () => {
          try {
            await createAgentAction(form);
            e.currentTarget.reset();
          } catch (err: any) {
            alert(err?.message ?? "Failed to create agent");
          }
        });
      }}
    >
      <div>
        <label className="text-sm font-medium">Name</label>
        <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <input name="email" type="email" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>

      <div>
        <label className="text-sm font-medium">Phone</label>
        <input name="phone" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>

      <div className="flex items-end">
        <button
          disabled={pending}
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Add Agent"}
        </button>
      </div>
    </form>
  );
}
"use client";

import { useTransition } from "react";
import { createFlightRuleAction } from "@/app/ops/actions/createFlightRuleAction";

export function CreateFlightRuleForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        startTransition(async () => {
          try {
            await createFlightRuleAction(form);
          } catch (err: any) {
            alert(err?.message ?? "Failed to create rule");
          }
        });
      }}
    >
      <div>
        <label className="text-sm font-medium">Rule</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="Weather delay"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description (Optional)</label>
        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="Operational note or explanation"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Status</label>
        <select
          name="is_active"
          className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          defaultValue="true"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div>
        <button
          disabled={pending}
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Add Flight Rule"}
        </button>
      </div>
    </form>
  );
}
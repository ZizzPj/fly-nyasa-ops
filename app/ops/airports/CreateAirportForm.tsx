"use client";

import { useTransition } from "react";
import { createAirportAction } from "@/app/ops/actions/createAirportAction";

export function CreateAirportForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 md:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        startTransition(async () => {
          try {
            await createAirportAction(form);
            e.currentTarget.reset();
          } catch (err: any) {
            alert(err?.message ?? "Failed to create airport");
          }
        });
      }}
    >
      <div>
        <label className="text-sm font-medium">Airport Name</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium">ICAO Code</label>
        <input
          name="icao"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="flex items-end">
        <button
          disabled={pending}
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Add Airport"}
        </button>
      </div>
    </form>
  );
}
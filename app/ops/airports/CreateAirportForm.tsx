"use client";

import { useTransition } from "react";
import { createAirportAction } from "@/app/ops/actions/createAirportAction";

export function CreateAirportForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 md:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        startTransition(async () => {
          try {
            await createAirportAction(form);
            e.currentTarget.reset();
          } catch (err: any) {
            alert(err?.message ?? "Failed to create location");
          }
        });
      }}
    >
      <div>
        <label className="text-sm font-medium">Name</label>
        <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>

      <div>
        <label className="text-sm font-medium">ICAO</label>
        <input name="icao" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>

      <div>
        <label className="text-sm font-medium">Type</label>
        <select name="airport_type" defaultValue="AIRPORT" className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
          <option value="AIRPORT">Airport</option>
          <option value="AIRSTRIP">Airstrip</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          disabled={pending}
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Add Location"}
        </button>
      </div>
    </form>
  );
}
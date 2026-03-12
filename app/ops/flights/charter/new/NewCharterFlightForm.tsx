"use client";

import { useTransition } from "react";
import { createCharterFlightConfigAction } from "@/app/ops/actions/createCharterFlightConfigAction";

type AirportRow = {
  id: string;
  name: string;
  icao?: string | null;
};

type RuleRow = {
  id: string;
  name: string;
};

function airportLabel(a: AirportRow) {
  return `${a.name}${a.icao ? ` (${a.icao})` : ""}`;
}

export function NewCharterFlightForm({
  airports,
  rules,
}: {
  airports: AirportRow[];
  rules: RuleRow[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-6 max-w-5xl"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        startTransition(async () => {
          try {
            await createCharterFlightConfigAction(form);
          } catch (err: any) {
            alert(err?.message ?? "Failed to save charter flight configuration");
          }
        });
      }}
    >
      <div className="text-sm font-semibold text-slate-900">Flight Setup</div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Flight Number</label>
          <input
            name="flight_number"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="CH201"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Charter Flight Status</label>
          <select
            name="charter_status"
            required
            defaultValue="ACTIVE"
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Flight Rule</label>
          <select
            name="flight_rule_id"
            defaultValue=""
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            <option value="">None</option>
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm font-semibold text-slate-900">Route</div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Departure Airport</label>
          <select
            name="departure_airport_id"
            required
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            defaultValue=""
          >
            <option value="" disabled>
              Select departure airport
            </option>
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {airportLabel(a)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Via Airport (Optional)</label>
          <select
            name="via_airport_id"
            defaultValue=""
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            <option value="">None</option>
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {airportLabel(a)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Arrival Airport</label>
          <select
            name="arrival_airport_id"
            required
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            defaultValue=""
          >
            <option value="" disabled>
              Select arrival airport
            </option>
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {airportLabel(a)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm font-semibold text-slate-900">Commercials</div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-sm font-medium">Cost</label>
          <input
            type="number"
            step="0.01"
            name="cost"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Departure Tax</label>
          <input
            type="number"
            step="0.01"
            name="departure_tax"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Maximum Baggage Allowance (kg)</label>
          <input
            type="number"
            step="0.01"
            name="max_baggage_allowance_kg"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Flight Duration (mins)</label>
          <input
            type="number"
            min={1}
            name="flight_duration_minutes"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Add Charter Flight"}
        </button>

        <a href="/ops/flights/charter" className="text-sm underline text-slate-700">
          Back to Charter Flights
        </a>
      </div>
    </form>
  );
}
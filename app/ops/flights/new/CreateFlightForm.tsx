"use client";

import { useMemo, useTransition } from "react";
import { createFlightAction } from "@/app/ops/actions/createFlightAction";

type RouteRow = {
  route_id: string;
  origin_code: string | null;
  origin_name: string | null;
  destination_code: string | null;
  destination_name: string | null;
};

type AircraftRow = {
  aircraft_id: string;
  model: string | null;
  registration_code: string | null;
  seat_config_id: string;
  seat_count: number;
};

function must(v: FormDataEntryValue | null, label: string) {
  const s = String(v ?? "").trim();
  if (!s) throw new Error(`Missing ${label}`);
  return s;
}

export function CreateFlightForm({
  routes,
  aircraft,
}: {
  routes: RouteRow[];
  aircraft: AircraftRow[];
}) {
  const [pending, startTransition] = useTransition();

  const defaultRoute = routes?.[0]?.route_id ?? "";
  const defaultAircraft = aircraft?.[0]?.aircraft_id ?? "";

  const aircraftById = useMemo(() => {
    const m = new Map<string, AircraftRow>();
    for (const a of aircraft) m.set(a.aircraft_id, a);
    return m;
  }, [aircraft]);

  return (
    <form
      className="grid gap-4 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        // Auto-inject seat_config_id based on aircraft selection
        const aircraftId = must(form.get("aircraft_id"), "aircraft");
        const a = aircraftById.get(aircraftId);
        if (!a) {
          alert("Invalid aircraft selected");
          return;
        }
        form.set("seat_config_id", a.seat_config_id);

        startTransition(async () => {
          try {
            await createFlightAction(form);
          } catch (err: any) {
            alert(err?.message ?? "Failed to create flight");
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Flight Number</label>
          <input
            name="flight_number"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="FN101"
          />
          <div className="mt-1 text-xs text-slate-500">Short code ops will recognize.</div>
        </div>

        <div>
          <label className="text-sm font-medium">Route</label>
          <select
            name="route_id"
            defaultValue={defaultRoute}
            required
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            {routes.map((r) => {
              const o = r.origin_code ?? r.origin_name ?? "Origin";
              const d = r.destination_code ?? r.destination_name ?? "Destination";
              return (
                <option key={r.route_id} value={r.route_id}>
                  {o} → {d}
                </option>
              );
            })}
          </select>
          <div className="mt-1 text-xs text-slate-500">Choose where the aircraft is flying.</div>
        </div>

        <div>
          <label className="text-sm font-medium">Aircraft</label>
          <select
            name="aircraft_id"
            defaultValue={defaultAircraft}
            required
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            {aircraft.map((a) => {
              const reg = a.registration_code ? ` · ${a.registration_code}` : "";
              const seats = a.seat_count ? ` (${a.seat_count} seats)` : "";
              return (
                <option key={a.aircraft_id} value={a.aircraft_id}>
                  {(a.model ?? "Aircraft") + reg + seats}
                </option>
              );
            })}
          </select>
          <div className="mt-1 text-xs text-slate-500">
            Seat layout is selected automatically.
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Booking Cutoff (minutes)</label>
          <input
            type="number"
            name="booking_cutoff_minutes"
            defaultValue={60}
            min={0}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
          <div className="mt-1 text-xs text-slate-500">
            Lock bookings this many minutes before departure.
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Departure (UTC)</label>
          <input
            type="datetime-local"
            name="departure_time"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Arrival (UTC)</label>
          <input
            type="datetime-local"
            name="arrival_time"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      {/* hidden seat config injected from aircraft */}
      <input type="hidden" name="seat_config_id" value="" />

      <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-white">
        {pending ? "Creating..." : "Create Flight"}
      </button>
    </form>
  );
}

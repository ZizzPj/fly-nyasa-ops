"use client";

import { useMemo, useState, useTransition } from "react";
import { createFlightAction } from "@/app/ops/actions/createFlightAction";

type RouteRow = { id: string; origin_airport: string; destination_airport: string };
type AircraftRow = { id: string; registration_code: string; model: string };
type SeatConfigRow = { id: string; aircraft_id: string; version: number; is_active: boolean };

export function CreateFlightForm({
  routes,
  aircraft,
  seatConfigs,
}: {
  routes: RouteRow[];
  aircraft: AircraftRow[];
  seatConfigs: SeatConfigRow[];
}) {
  const [pending, startTransition] = useTransition();

  const [routeId, setRouteId] = useState(routes[0]?.id ?? "");
  const [aircraftId, setAircraftId] = useState(aircraft[0]?.id ?? "");
  const [seatConfigId, setSeatConfigId] = useState("");

  const configsForAircraft = useMemo(
    () => seatConfigs.filter((s) => s.aircraft_id === aircraftId),
    [seatConfigs, aircraftId]
  );

  // auto select latest active config for chosen aircraft
  useMemo(() => {
    if (!seatConfigId && configsForAircraft.length) {
      setSeatConfigId(configsForAircraft[0].id);
    }
  }, [configsForAircraft, seatConfigId]);

  return (
    <form
      className="grid gap-4 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        startTransition(async () => {
          try {
            await createFlightAction(form);
          } catch (err: any) {
            alert(err?.message ?? "Failed to create flight");
          }
        });
      }}
    >
      <div>
        <label className="text-sm font-medium">Flight Number</label>
        <input name="flight_number" required className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="FN101" />
      </div>

      <div>
        <label className="text-sm font-medium">Route</label>
        <select
          name="route_id"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
        >
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.origin_airport} → {r.destination_airport}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Aircraft</label>
        <select
          name="aircraft_id"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={aircraftId}
          onChange={(e) => {
            setAircraftId(e.target.value);
            setSeatConfigId("");
          }}
        >
          {aircraft.map((a) => (
            <option key={a.id} value={a.id}>
              {a.registration_code} · {a.model}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Seat Config</label>
        <select
          name="seat_config_id"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={seatConfigId}
          onChange={(e) => setSeatConfigId(e.target.value)}
        >
          {configsForAircraft.map((s) => (
            <option key={s.id} value={s.id}>
              v{s.version} (active)
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Departure Time (UTC)</label>
          <input type="datetime-local" name="departure_time" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>

        <div>
          <label className="text-sm font-medium">Arrival Time (UTC)</label>
          <input type="datetime-local" name="arrival_time" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Booking Cutoff (minutes)</label>
        <input
          type="number"
          min={0}
          name="booking_cutoff_minutes"
          defaultValue={60}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60">
        {pending ? "Creating..." : "Create Flight"}
      </button>
    </form>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { createSeatRateFlightAction } from "@/app/ops/actions/createSeatRateFlightAction";

type AirportRow = {
  id: string;
  name: string;
  icao?: string | null;
};

type AircraftRow = {
  aircraft_id: string;
  model: string | null;
  registration_code: string | null;
  seat_config_id: string;
  seat_count: number;
};

type RuleRow = {
  id: string;
  name: string;
};

const WEEKDAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

function addMinutesToTime(time: string, minutes: number) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const total = h * 60 + m + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  const nh = String(Math.floor(normalized / 60)).padStart(2, "0");
  const nm = String(normalized % 60).padStart(2, "0");
  return `${nh}:${nm}`;
}

function airportLabel(a: AirportRow) {
  return `${a.name}${a.icao ? ` (${a.icao})` : ""}`;
}

export function NewSeatRateForm({
  airports,
  aircraft,
  rules,
}: {
  airports: AirportRow[];
  aircraft: AircraftRow[];
  rules: RuleRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [etd, setEtd] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const eta = useMemo(() => addMinutesToTime(etd, durationMinutes), [etd, durationMinutes]);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  return (
    <form
      className="grid gap-6 max-w-5xl"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        startTransition(async () => {
          try {
            await createSeatRateFlightAction(form);
          } catch (err: any) {
            alert(err?.message ?? "Failed to save seat rate flight");
          }
        });
      }}
    >
      <div className="text-sm font-semibold text-slate-900">Flight Setup</div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Aircraft Type</label>
          <select
            name="aircraft_id"
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select aircraft
            </option>
            {aircraft.map((a) => (
              <option key={a.aircraft_id} value={a.aircraft_id}>
                {a.model ?? "Aircraft"}
                {` (${a.seat_count} seats)`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Flight Number</label>
          <input
            name="flight_number"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="FN101"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Schedule Status</label>
          <select
            name="schedule_status"
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            required
            defaultValue="ACTIVE"
          >
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
      </div>

      <div className="text-sm font-semibold text-slate-900">Route</div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Departure Airport</label>
          <select
            name="departure_airport_id"
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            required
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
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            defaultValue=""
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
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            required
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

      <div className="text-sm font-semibold text-slate-900">Schedule</div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Start Schedule Date</label>
          <input
            type="date"
            name="start_date"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">End Schedule Date</label>
          <input
            type="date"
            name="end_date"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Flight Rule</label>
          <select
            name="flight_rule_id"
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            defaultValue=""
          >
            <option value="">None</option>
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">ETD</label>
          <input
            type="time"
            name="etd"
            required
            value={etd}
            onChange={(e) => setEtd(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Estimated Duration (mins)</label>
          <input
            type="number"
            name="estimated_duration_minutes"
            required
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">ETA (Auto)</label>
          <input
            value={eta}
            readOnly
            className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2"
          />
          <input type="hidden" name="eta" value={eta} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Flight Day(s)</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const active = selectedDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-slate-900 text-white"
                    : "border bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>

        {selectedDays.map((day) => (
          <input key={day} type="hidden" name="weekday_numbers" value={String(day)} />
        ))}
      </div>

      <div className="text-sm font-semibold text-slate-900">Commercials</div>

      <div className="grid gap-4 md:grid-cols-4">
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
          <label className="text-sm font-medium">Adult Fare</label>
          <input
            type="number"
            step="0.01"
            name="adult_fare"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Child Fare</label>
          <input
            type="number"
            step="0.01"
            name="child_fare"
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
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Add Seat Rate Flight"}
        </button>

        <a href="/ops/flights/seat-rate" className="text-sm underline text-slate-700">
          Back to Seat Rate Flights
        </a>
      </div>
    </form>
  );
}
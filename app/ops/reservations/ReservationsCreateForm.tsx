"use client";

import { useMemo, useState, useTransition } from "react";
import { createSeatHoldAction } from "@/app/ops/actions/createSeatHoldAction";

type FlightRow = {
  flight_id: string;
  flight_number: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  flight_status: string | null;
  seats_available: number | null;
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function statusOkForHold(status: string | null | undefined) {
  const s = (status ?? "").toUpperCase();
  return s !== "CANCELLED" && s !== "CLOSED";
}

export function ReservationsCreateForm({ flights }: { flights: FlightRow[] }) {
  const [pending, startTransition] = useTransition();
  const [flightId, setFlightId] = useState<string>(flights?.[0]?.flight_id ?? "");
  const [seatCount, setSeatCount] = useState<number>(1);
  const [holdMinutes, setHoldMinutes] = useState<number>(60);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const selected = useMemo(
    () => flights.find((f) => f.flight_id === flightId) ?? null,
    [flights, flightId]
  );

  const canSubmit =
    !!flightId &&
    seatCount > 0 &&
    holdMinutes >= 1 &&
    holdMinutes <= 2160 &&
    (selected ? statusOkForHold(selected.flight_status) : true);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-700">Flight</label>
          <select
            value={flightId}
            onChange={(e) => setFlightId(e.target.value)}
            className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm"
          >
            {flights.map((f) => {
              const label = `${f.flight_number ?? f.flight_id} · ${fmt(
                f.departure_time
              )} · Avail ${f.seats_available ?? 0} · ${f.flight_status ?? "—"}`;
              return (
                <option key={f.flight_id} value={f.flight_id}>
                  {label}
                </option>
              );
            })}
          </select>
          {selected && !statusOkForHold(selected.flight_status) ? (
            <div className="mt-2 text-xs text-red-700">
              This flight is {selected.flight_status}. Holds are not allowed.
            </div>
          ) : null}
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-700">Seat count</label>
          <input
            type="number"
            min={1}
            value={seatCount}
            onChange={(e) => setSeatCount(Number(e.target.value))}
            className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm"
          />
          <div className="mt-2 text-xs text-slate-500">
            Must be ≤ available seats.
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-700">Hold duration</label>
          <select
            value={holdMinutes}
            onChange={(e) => setHoldMinutes(Number(e.target.value))}
            className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm"
          >
            <option value={60}>1 hour</option>
            <option value={180}>3 hours</option>
            <option value={360}>6 hours</option>
            <option value={720}>12 hours</option>
            <option value={1440}>24 hours</option>
            <option value={2160}>36 hours (max)</option>
          </select>
          <div className="mt-2 text-xs text-slate-500">
            Max 36 hours (2160 minutes).
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={!canSubmit || pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          onClick={() => {
            setErr(null);
            setResult(null);

            // Soft guard vs obviously impossible requests
            const avail = selected?.seats_available ?? null;
            if (typeof avail === "number" && seatCount > avail) {
              setErr(`Not enough available seats. Requested ${seatCount}, available ${avail}.`);
              return;
            }

            startTransition(async () => {
              try {
                const data = await createSeatHoldAction({ flightId, seatCount, holdMinutes });
                setResult(data?.[0] ?? data);
              } catch (e: any) {
                setErr(e?.message ?? "Failed to create hold");
              }
            });
          }}
        >
          {pending ? "Creating hold..." : "Create HOLD"}
        </button>

        {result?.booking_id ? (
          <a
            className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
            href={`/ops/bookings/${result.booking_id}`}
          >
            View booking
          </a>
        ) : null}

        <a
          className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
          href="/ops/bookings"
        >
          Open bookings list
        </a>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-800">
          <div className="font-semibold">Hold created</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div>
              <div className="text-xs text-slate-600">Booking ID</div>
              <div className="font-mono text-xs">{result.booking_id ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-600">Held seats</div>
              <div className="font-semibold">{result.held_seats ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-600">Held until</div>
              <div className="font-semibold">
                {result.held_until ? new Date(result.held_until).toLocaleString() : "—"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

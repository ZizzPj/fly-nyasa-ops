// app/ops/reservations/ReservationsCreateForm.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { createSeatHoldAction } from "@/app/ops/actions/createSeatHoldAction";
import { createCharterHoldAction } from "@/app/ops/actions/createCharterHoldAction";

type FlightRow = {
  flight_id: string;
  flight_number: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  flight_status: string | null;
  seats_available: number | null;
};

type HoldMode = "SEAT" | "CHARTER";

type SeatHoldResult = {
  booking_id?: string;
  held_seats?: number;
  held_until?: string;
};

type CharterHoldResult = {
  booking_id?: string;
  charter_optioned?: boolean;
  held_until?: string;
};

/**
 * ✅ 3.4 — Stable labels + strict hold gating
 * - Prevent hydration mismatch by using a stable UTC formatter for dropdown labels
 * - Enforce: holds can ONLY be created when flight status is OPEN (UI guard)
 *   (DB remains authority, this is just UX correctness)
 */

function fmtStable(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  // Always same output everywhere
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(d);
}


function canCreateHoldOnFlight(status: string | null | undefined) {
  // ✅ 3.4 rule: only OPEN flights can receive new holds
  return (status ?? "").toUpperCase() === "OPEN";
}

function humanStatus(status: string | null | undefined) {
  const s = (status ?? "").toUpperCase();
  return s || "—";
}

export function ReservationsCreateForm({ flights }: { flights: FlightRow[] }) {
  const [pending, startTransition] = useTransition();

  const [mode, setMode] = useState<HoldMode>("SEAT");
  const [flightId, setFlightId] = useState<string>(flights?.[0]?.flight_id ?? "");
  const [seatCount, setSeatCount] = useState<number>(1);
  const [holdMinutes, setHoldMinutes] = useState<number>(60);

  const [result, setResult] = useState<SeatHoldResult | CharterHoldResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const selected = useMemo(
    () => flights.find((f) => f.flight_id === flightId) ?? null,
    [flights, flightId]
  );

  const flightOk = selected ? canCreateHoldOnFlight(selected.flight_status) : true;

  const canSubmit =
    !!flightId &&
    flightOk &&
    Number.isInteger(holdMinutes) &&
    holdMinutes >= 1 &&
    holdMinutes <= 2160 &&
    (mode === "CHARTER" || (Number.isInteger(seatCount) && seatCount >= 1));

  const optionLabel = (f: FlightRow) => {
    const dep = fmtUtcStable(f.departure_time);
    const avail = f.seats_available ?? 0;
    const st = humanStatus(f.flight_status);
    return `${f.flight_number ?? f.flight_id} · ${dep} · Avail ${avail} · ${st}`;
  };

  function submit() {
    setErr(null);
    setResult(null);

    if (!selected) {
      setErr("Please select a flight.");
      return;
    }

    if (!canCreateHoldOnFlight(selected.flight_status)) {
      setErr(
        `Holds can only be created when the flight is OPEN. Current status: ${humanStatus(
          selected.flight_status
        )}.`
      );
      return;
    }

    if (!Number.isInteger(holdMinutes) || holdMinutes < 1 || holdMinutes > 2160) {
      setErr("Hold duration must be between 1 and 2160 minutes (36 hours).");
      return;
    }

    if (mode === "SEAT") {
      if (!Number.isInteger(seatCount) || seatCount < 1) {
        setErr("Seat count must be >= 1.");
        return;
      }

      const avail = selected.seats_available;
      if (typeof avail === "number" && seatCount > avail) {
        setErr(`Not enough available seats. Requested ${seatCount}, available ${avail}.`);
        return;
      }
    }

    startTransition(async () => {
      try {
        if (mode === "SEAT") {
          const data = await createSeatHoldAction({
            flightId,
            seatCount,
            holdMinutes,
          });
          setResult((data?.[0] ?? data) as SeatHoldResult);
        } else {
          const data = await createCharterHoldAction({
            flightId,
            holdMinutes,
          });
          setResult((data?.[0] ?? data) as CharterHoldResult);
        }
      } catch (e: any) {
        setErr(e?.message ?? "Failed to create hold");
      }
    });
  }

  const bookingId = (result as any)?.booking_id as string | undefined;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-medium border ${
            mode === "SEAT"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white hover:bg-slate-50"
          }`}
          onClick={() => {
            setMode("SEAT");
            setErr(null);
            setResult(null);
          }}
        >
          Seat reservation hold
        </button>

        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-medium border ${
            mode === "CHARTER"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white hover:bg-slate-50"
          }`}
          onClick={() => {
            setMode("CHARTER");
            setErr(null);
            setResult(null);
          }}
        >
          Charter reservation hold
        </button>

        <div className="text-xs text-slate-600">
          Max hold: <span className="font-semibold">36 hours</span>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col sm:col-span-2">
          <label className="text-xs font-medium text-slate-700">Flight</label>
          <select
            value={flightId}
            onChange={(e) => setFlightId(e.target.value)}
            className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm"
          >
            {flights.map((f) => (
              <option key={f.flight_id} value={f.flight_id}>
                {optionLabel(f)}
              </option>
            ))}
          </select>

          {selected && !canCreateHoldOnFlight(selected.flight_status) ? (
            <div className="mt-2 text-xs text-red-700">
              Holds can only be created when the flight is <b>OPEN</b>. Current status:{" "}
              <b>{humanStatus(selected.flight_status)}</b>.
            </div>
          ) : null}
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
          <div className="mt-2 text-xs text-slate-500">Max 36 hours (2160 minutes).</div>
        </div>

        {mode === "SEAT" ? (
          <div className="flex flex-col sm:col-span-3">
            <label className="text-xs font-medium text-slate-700">Seat count</label>
            <input
              type="number"
              min={1}
              value={seatCount}
              onChange={(e) => setSeatCount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
            <div className="mt-2 text-xs text-slate-500">Must be ≤ available seats.</div>
          </div>
        ) : (
          <div className="sm:col-span-3 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
            Charter hold will OPTION the charter inventory for this flight. Ops can confirm or cancel later.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={!canSubmit || pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          onClick={submit}
          type="button"
        >
          {pending
            ? "Creating hold..."
            : mode === "SEAT"
            ? "Create SEAT HOLD"
            : "Create CHARTER HOLD"}
        </button>

        {bookingId ? (
          <a
            className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
            href={`/ops/bookings/${bookingId}`}
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

      {/* Errors */}
      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{err}</div>
      ) : null}

      {/* Result */}
      {result ? (
        <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-800">
          <div className="font-semibold">Hold created</div>

          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div>
              <div className="text-xs text-slate-600">Booking ID</div>
              <div className="font-mono text-xs">{(result as any)?.booking_id ?? "—"}</div>
            </div>

            {mode === "SEAT" ? (
              <div>
                <div className="text-xs text-slate-600">Held seats</div>
                <div className="font-semibold">{(result as any)?.held_seats ?? "—"}</div>
              </div>
            ) : (
              <div>
                <div className="text-xs text-slate-600">Charter optioned</div>
                <div className="font-semibold">{String((result as any)?.charter_optioned ?? "—")}</div>
              </div>
            )}

            <div>
              <div className="text-xs text-slate-600">Held until</div>
              <div className="font-semibold">
                {(result as any)?.held_until
                  ? fmtUtcStable((result as any).held_until)
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

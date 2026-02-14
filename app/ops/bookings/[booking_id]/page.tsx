import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, statusTone } from "@/components/ui/Badge";

import { CancelBookingButton } from "./CancelBookingButton";
import { ConfirmBookingButton } from "./ConfirmBookingButton";
import { ConfirmCharterBookingButton } from "./ConfirmCharterBookingButton";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

type BookingRow = {
  booking_id: string;
  booking_type: string | null;
  status: string | null;

  flight_id: string;
  flight_number: string | null;
  departure_time: string | null;

  created_at: string | null;
  updated_at: string | null;

  seat_count: number | null;
  charter_count: number | null;
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ booking_id: string }>;
}) {
  await requireOpsUser();

  const { booking_id } = await params;
  const bookingId = booking_id;

  if (!bookingId || !isUuid(bookingId)) {
    return (
      <Alert title="Invalid booking id" tone="red">
        Received: <code>{String(bookingId)}</code>
      </Alert>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_booking_operations")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) {
    return (
      <Alert title="Booking load failed" tone="red">
        {error.message}
      </Alert>
    );
  }

  if (!data) notFound();

  const b = data as BookingRow;

  const bookingType = (b.booking_type ?? "").toUpperCase();
  const status = (b.status ?? "").toUpperCase();

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs text-slate-600">Booking detail</div>
          <h1 className="mt-1 text-2xl font-semibold">{b.booking_id}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(b.status)}>{b.status ?? "—"}</Badge>
            <Badge tone={statusTone(b.booking_type)}>{b.booking_type ?? "—"}</Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {/* SEAT confirm */}
          <ConfirmBookingButton bookingId={b.booking_id} status={b.status} />

          {/* CHARTER confirm */}
          <ConfirmCharterBookingButton
            bookingId={b.booking_id}
            status={b.status}
            bookingType={b.booking_type}
          />

          {/* Cancel */}
          <CancelBookingButton bookingId={b.booking_id} status={b.status} />

          <a className="text-sm underline text-slate-700" href="/ops/bookings">
            Back to Bookings
          </a>
        </div>
      </div>

      {/* Timeline */}
      <Card title="Booking timeline" subtitle="Audit-safe timestamps from the authoritative view.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Created" value={fmt(b.created_at)} />
          <Field label="Last updated" value={fmt(b.updated_at)} />
        </div>
      </Card>

      {/* Flight Reference */}
      <Card title="Flight reference" subtitle="This booking is attached to a specific scheduled flight.">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">
              <a className="underline" href={`/ops/flights/${b.flight_id}`}>
                {b.flight_number ?? b.flight_id}
              </a>
            </div>
            <div className="mt-1 text-sm text-slate-600">Departure: {fmt(b.departure_time)}</div>
          </div>

          <a
            href={`/ops/flights/${b.flight_id}`}
            className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            View flight
          </a>
        </div>
      </Card>

      {/* Counts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat title="Seat Count" value={b.seat_count ?? 0} />
        <Stat title="Charter Count" value={b.charter_count ?? 0} />
      </div>

      {/* Operational note */}
      {status === "CONFIRMED" ? (
        <Alert title="Operational note" tone="slate">
          This booking is confirmed. Any cancellation will release inventory atomically via database RPC.
        </Alert>
      ) : null}

      {bookingType === "CHARTER" && status === "HELD" ? (
        <Alert title="Charter hold" tone="slate">
          This booking is currently holding a full-flight charter (inventory: OPTIONED/HELD). Confirming will
          lock it as CONFIRMED.
        </Alert>
      ) : null}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-600">{label}</div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

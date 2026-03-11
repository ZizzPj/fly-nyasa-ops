import { requireOpsUser } from "@/lib/auth/guard";
import { Card } from "@/components/ui/Card";

export default async function ReservationsPage() {
  await requireOpsUser();

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Reservations</div>
        <h1 className="mt-1 text-2xl font-semibold">Reservation Operations</h1>
        <div className="mt-1 text-sm text-slate-700">
          Create seat and charter reservations, then ticket or cancel them from Bookings.
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          title="Seat Rate Reservation"
          subtitle="Create passenger reservations for scheduled flights."
        >
          <a
            href="/ops/reservations/new/seat"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            + New Seat Reservation
          </a>
        </Card>

        <Card
          title="Charter Reservation"
          subtitle="Reserve the full aircraft and block passenger inventory."
        >
          <a
            href="/ops/reservations/new/charter"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            + New Charter Reservation
          </a>
        </Card>
      </div>

      <Card
        title="Booking Control"
        subtitle="Review, ticket or cancel active reservations."
      >
        <a
          href="/ops/bookings"
          className="inline-block rounded-lg border px-4 py-2"
        >
          Open Bookings
        </a>
      </Card>
    </section>
  );
}
import { requireOpsUser } from "@/lib/auth/guard";
import { Card } from "@/components/ui/Card";

export default async function NewReservationPage() {
  await requireOpsUser();

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Reservations</div>
        <h1 className="mt-1 text-2xl font-semibold">New Reservation</h1>
        <div className="mt-1 text-sm text-slate-700">
          Choose the reservation workflow you want to start.
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          title="Seat Rate Reservation"
          subtitle="Passenger seat booking on an operational flight."
        >
          <a
            href="/ops/reservations/new/seat"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            Continue
          </a>
        </Card>

        <Card
          title="Charter Reservation"
          subtitle="Full aircraft charter booking."
        >
          <a
            href="/ops/reservations/new/charter"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            Continue
          </a>
        </Card>
      </div>
    </section>
  );
}
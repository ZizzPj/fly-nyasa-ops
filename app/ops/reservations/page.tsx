import Link from "next/link";
import { requireOpsUser } from "@/lib/auth/guard";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function ReservationsPage() {
  await requireOpsUser();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Reservations"
        title="Reservation operations"
        subtitle="Launch seat and charter reservations with a clearer path into booking control and downstream ticketing."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          title="Seat rate reservation"
          subtitle="Create passenger reservations for scheduled flights."
        >
          <Link
            href="/ops/reservations/new/seat"
            className="button-primary inline-block rounded-full px-4 py-2 text-sm font-semibold"
          >
            New seat reservation
          </Link>
        </Card>

        <Card
          title="Charter reservation"
          subtitle="Reserve the full aircraft and block passenger inventory."
        >
          <Link
            href="/ops/reservations/new/charter"
            className="button-primary inline-block rounded-full px-4 py-2 text-sm font-semibold"
          >
            New charter reservation
          </Link>
        </Card>
      </div>

      <Card
        title="Booking control"
        subtitle="Review, ticket, or cancel active reservations."
      >
        <Link
          href="/ops/bookings"
          className="button-secondary inline-block rounded-full px-4 py-2 text-sm font-semibold"
        >
          Open bookings
        </Link>
      </Card>
    </section>
  );
}

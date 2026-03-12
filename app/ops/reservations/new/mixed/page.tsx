import { requireOpsUser } from "@/lib/auth/guard";
import { Card } from "@/components/ui/Card";

export default async function MixedReservationPage() {
  await requireOpsUser();

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Reservations</div>
        <h1 className="mt-1 text-2xl font-semibold">Mixed Reservation</h1>
        <div className="mt-1 text-sm text-slate-700">
          This workflow has been added for review and can be finalized in the next phase based on the exact mixed allocation rules required by operations.
        </div>
      </div>

      <Card title="Mixed Booking Workflow" subtitle="Combined seat-rate and charter workflow placeholder.">
        <div className="space-y-3 text-sm text-slate-700">
          <div>• Seat Rate + Charter workflow option is now visible in the system.</div>
          <div>• Final mixed inventory allocation rules should be confirmed with operations before activation.</div>
        </div>
      </Card>
    </section>
  );
}
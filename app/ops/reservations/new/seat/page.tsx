import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { SeatReservationForm } from "./SeatReservationForm";

type FlightRow = {
  flight_id: string;
  flight_number: string | null;
  departure_airport_name: string;
  via_airport_name: string | null;
  arrival_airport_name: string;
  departure_time: string | null;
  arrival_time: string | null;
  seats_available: number | null;
};

export default async function NewSeatReservationPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_operational_flights_display")
    .select(
      "flight_id, flight_number, departure_airport_name, via_airport_name, arrival_airport_name, departure_time, arrival_time, seats_available"
    )
    .order("departure_time", { ascending: true });

  if (error) {
    return (
      <Alert title="Flights load failed" tone="red">
        {error.message}
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <Card title="Seat Reservation" subtitle="Create a passenger seat reservation.">
        <SeatReservationForm flights={(data ?? []) as FlightRow[]} />
      </Card>
    </section>
  );
}
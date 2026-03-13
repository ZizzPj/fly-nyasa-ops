"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SeatReservationForm } from "./seat/SeatReservationForm";
import { CharterReservationForm } from "./charter/CharterReservationForm";
import { MixedReservationForm } from "./mixed/MixedReservationForm";

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

type BookingType = "SEAT" | "CHARTER" | "MIXED";

export function UnifiedReservationPageClient({
  flights,
}: {
  flights: FlightRow[];
}) {
  const [bookingType, setBookingType] = useState<BookingType>("SEAT");

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Reservations</div>
        <h1 className="mt-1 text-2xl font-semibold">New Reservation</h1>
        <div className="mt-1 text-sm text-slate-700">
          Create seat-rate, charter, or mixed reservations from one page.
        </div>
      </div>

      <Card title="Booking Type" subtitle="Select booking type here">
        <div className="max-w-xl">
          <label className="text-sm font-medium">Booking Type</label>
          <select
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value as BookingType)}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            <option value="SEAT">Seat Rate Flight</option>
            <option value="CHARTER">Charter Flight</option>
            <option value="MIXED">Both (Charter - Seat Rate) Reservations</option>
          </select>
        </div>
      </Card>

      {bookingType === "SEAT" && (
        <Card title="Seat Rate Booking" subtitle="Scheduled passenger booking workflow.">
          <SeatReservationForm flights={flights} />
        </Card>
      )}

      {bookingType === "CHARTER" && (
        <Card title="Charter Flight Booking" subtitle="Charter reservation workflow.">
          <CharterReservationForm flights={flights} />
        </Card>
      )}

      {bookingType === "MIXED" && (
        <Card
          title="Both (Charter - Seat Rate) Reservations"
          subtitle="Combined reservation workflow for both seat-rate and charter."
        >
          <MixedReservationForm flights={flights} />
        </Card>
      )}
    </section>
  );
}
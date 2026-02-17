"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOpsUser } from "@/lib/auth/guard";

function must(v: string, label: string) {
  if (!v) throw new Error(`Missing ${label}`);
}

function normalizeDatetimeLocalToTimestamptz(v: string) {
  // v like "2026-02-16T14:30"
  // store as +02:00 (Malawi) unless user included timezone already
  if (!v) return v;
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(v)) return v; // already has tz
  return `${v}:00+02:00`; // Malawi offset
}

export async function createFlightAction(formData: FormData) {
  await requireOpsUser();

  const supabase = createSupabaseAdminClient();

  const flightNumber = String(formData.get("flight_number") ?? "").trim();
  const routeId = String(formData.get("route_id") ?? "").trim();
  const aircraftId = String(formData.get("aircraft_id") ?? "").trim();
  const seatConfigId = String(formData.get("seat_config_id") ?? "").trim();

  const departureLocal = String(formData.get("departure_time") ?? "").trim();
  const arrivalLocal = String(formData.get("arrival_time") ?? "").trim();

  const cutoffRaw = String(formData.get("booking_cutoff_minutes") ?? "60").trim();
  const cutoff = Number.isFinite(Number(cutoffRaw)) ? Number(cutoffRaw) : 60;

  must(flightNumber, "flight_number");
  must(routeId, "route_id");
  must(aircraftId, "aircraft_id");
  must(seatConfigId, "seat_config_id");
  must(departureLocal, "departure_time");
  must(arrivalLocal, "arrival_time");

  const departureTime = normalizeDatetimeLocalToTimestamptz(departureLocal);
  const arrivalTime = normalizeDatetimeLocalToTimestamptz(arrivalLocal);

  const { data, error } = await supabase.rpc("ops_create_flight_with_inventory", {
    p_route_id: routeId,
    p_aircraft_id: aircraftId,
    p_seat_config_id: seatConfigId,
    p_flight_number: flightNumber,
    p_departure_time: departureTime,
    p_arrival_time: arrivalTime,
    p_booking_cutoff_minutes: cutoff,
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  const flightId = row?.flight_id as string | undefined;

  revalidatePath("/ops");
  revalidatePath("/ops/flights");
  revalidatePath("/ops/reservations");

  if (flightId) redirect(`/ops/flights/${flightId}`);
  redirect("/ops/flights");
}

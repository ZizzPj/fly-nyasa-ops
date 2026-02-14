"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOpsUser } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function mustUuid(v: string, label: string) {
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (!ok) throw new Error(`Invalid ${label}`);
}

// datetime-local -> timestamptz with Malawi offset (+02:00)
function toMalawiTimestamptz(datetimeLocal: string) {
  // expected: "YYYY-MM-DDTHH:mm"
  if (!datetimeLocal || !datetimeLocal.includes("T")) throw new Error("Invalid datetime");
  // add seconds + explicit offset
  return `${datetimeLocal}:00+02:00`;
}

export async function createFlightAction(formData: FormData) {
  // Enforce demo cookie OR real ops allowlist (your guard handles both)
  await requireOpsUser();

  const flightNumber = String(formData.get("flight_number") ?? "").trim();
  const routeId = String(formData.get("route_id") ?? "").trim();
  const aircraftId = String(formData.get("aircraft_id") ?? "").trim();
  const seatConfigId = String(formData.get("seat_config_id") ?? "").trim();

  const depLocal = String(formData.get("departure_time") ?? "").trim();
  const arrLocal = String(formData.get("arrival_time") ?? "").trim();
  const cutoff = Number(formData.get("booking_cutoff_minutes") ?? 60);

  if (!flightNumber) throw new Error("Missing flight_number");
  mustUuid(routeId, "route_id");
  mustUuid(aircraftId, "aircraft_id");
  mustUuid(seatConfigId, "seat_config_id");

  if (!Number.isFinite(cutoff) || cutoff < 0 || cutoff > 1440) {
    throw new Error("booking_cutoff_minutes must be between 0 and 1440");
  }

  const departure_time = toMalawiTimestamptz(depLocal);
  const arrival_time = toMalawiTimestamptz(arrLocal);

  // Validate time ordering safely (string -> Date)
  const depDate = new Date(departure_time);
  const arrDate = new Date(arrival_time);
  if (!(depDate instanceof Date) || isNaN(depDate.getTime())) throw new Error("Invalid departure_time");
  if (!(arrDate instanceof Date) || isNaN(arrDate.getTime())) throw new Error("Invalid arrival_time");
  if (arrDate.getTime() <= depDate.getTime()) throw new Error("arrival_time must be after departure_time");

  // If your RPC requires p_user_id, fetch the current user id from Supabase auth
  // (works in normal mode; in demo mode you can use a fixed DEMO_USER_ID env)
  const supabaseAuth = await createSupabaseServerClient();
  const { data: auth } = await supabaseAuth.auth.getUser();
  const userId = auth?.user?.id ?? process.env.OPS_DEMO_USER_ID ?? null;

  const supabase = createSupabaseAdminClient();

  // ✅ Choose the most complete RPC (usually this one)
  // NOTE: if your function definition shows p_user_id is required,
  // include it; otherwise remove it.
  const payload: Record<string, any> = {
    p_route_id: routeId,
    p_aircraft_id: aircraftId,
    p_seat_config_id: seatConfigId,
    p_flight_number: flightNumber,
    p_departure_time: departure_time,
    p_arrival_time: arrival_time,
    p_booking_cutoff_minutes: cutoff,
  };

  // Only pass p_user_id if you actually have one and your RPC expects it
  // (once you paste the signature, we’ll lock this down exactly)
  if (userId) payload.p_user_id = userId;

  const { data, error } = await supabase.rpc("ops_create_flight_with_inventory", payload);

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  const flightId = row?.flight_id ?? row?.id;

  revalidatePath("/ops");
  revalidatePath("/ops/flights");
  revalidatePath("/ops/reservations");

  if (flightId) redirect(`/ops/flights/${flightId}`);
  redirect("/ops/flights");
}

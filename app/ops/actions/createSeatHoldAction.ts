"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireOpsUser } from "@/lib/auth/guard";

function assertUuid(v: string, label: string) {
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (!ok) throw new Error(`Invalid ${label}`);
}

// ✅ Set this to a REAL uuid you control.
// Best: create one demo user row and use its id.
// Temporary: use any existing users.id that exists in your DB.
const DEMO_USER_ID = process.env.OPS_DEMO_USER_ID ?? "";

export async function createSeatHoldAction(input: {
  flightId: string;
  seatCount: number;
  holdMinutes: number;
}) {
  await requireOpsUser();

  assertUuid(input.flightId, "flightId");
  if (!Number.isInteger(input.seatCount) || input.seatCount < 1) {
    throw new Error("seatCount must be >= 1");
  }
  if (!Number.isInteger(input.holdMinutes) || input.holdMinutes < 1 || input.holdMinutes > 2160) {
    throw new Error("holdMinutes must be between 1 and 2160");
  }

  // ✅ Must be provided because bookings.user_id is NOT NULL
  if (!DEMO_USER_ID) {
    throw new Error("Missing OPS_DEMO_USER_ID env var (required for demo booking creation).");
  }
  assertUuid(DEMO_USER_ID, "OPS_DEMO_USER_ID");

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("ops_create_seat_booking_hold", {
    p_flight_id: input.flightId,
    p_seat_count: input.seatCount,
    p_user_id: DEMO_USER_ID,
    p_hold_minutes: input.holdMinutes, // this is DEFAULT in SQL but we can still pass it
  });

  if (error) throw new Error(error.message);

  revalidatePath("/ops");
  revalidatePath("/ops/flights");
  revalidatePath(`/ops/flights/${input.flightId}`);
  revalidatePath("/ops/bookings");
  revalidatePath("/ops/reservations");

  return data; // [{ booking_id, held_seats, held_until }]
}

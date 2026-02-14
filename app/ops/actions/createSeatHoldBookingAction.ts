"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOpsUser } from "@/lib/auth/guard";

function mustUuid(v: string, label = "uuid") {
  const ok =
    /^[0-9a-f-FA-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (!ok) throw new Error(`Invalid ${label}: ${v}`);
}

// ✅ For demo: set this in .env.local + Vercel env vars
const DEMO_USER_ID = process.env.OPS_DEMO_USER_ID ?? "";

export async function createSeatHoldBookingAction(formData: FormData) {
  await requireOpsUser();

  const flightId = String(formData.get("flight_id") ?? "").trim();
  const seatCount = Number(formData.get("seat_count") ?? 0);
  const holdMinutes = Number(formData.get("hold_minutes") ?? 60);

  mustUuid(flightId, "flight_id");
  if (!Number.isFinite(seatCount) || seatCount <= 0) throw new Error("seat_count must be > 0");
  if (!Number.isFinite(holdMinutes) || holdMinutes < 1 || holdMinutes > 2160) {
    throw new Error("hold_minutes must be between 1 and 2160 (36 hours)");
  }

  // ✅ REQUIRED because bookings.user_id is NOT NULL
  if (!DEMO_USER_ID) throw new Error("Missing OPS_DEMO_USER_ID env var.");
  mustUuid(DEMO_USER_ID, "OPS_DEMO_USER_ID");

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("ops_create_seat_booking_hold", {
    p_flight_id: flightId,
    p_seat_count: seatCount,
    p_user_id: DEMO_USER_ID,     // ✅ NEW
    p_hold_minutes: holdMinutes, // ✅
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  const bookingId = row?.booking_id as string | undefined;
  if (!bookingId) throw new Error("RPC did not return booking_id");

  revalidatePath("/ops");
  revalidatePath("/ops/bookings");
  revalidatePath("/ops/flights");
  revalidatePath("/ops/reservations");

  redirect(`/ops/bookings/${bookingId}`);
}

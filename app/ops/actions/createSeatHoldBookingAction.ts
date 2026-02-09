"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOpsUser } from "@/lib/auth/guard";

export async function createSeatHoldBookingAction(formData: FormData) {
  await requireOpsUser();

  const flightId = String(formData.get("flight_id") ?? "");
  const seatCount = Number(formData.get("seat_count") ?? 0);
  const holdMinutes = Number(formData.get("hold_minutes") ?? 60);

  if (!flightId) throw new Error("Missing flight_id");
  if (!Number.isFinite(seatCount) || seatCount <= 0) throw new Error("seat_count must be > 0");
  if (!Number.isFinite(holdMinutes) || holdMinutes < 1 || holdMinutes > 2160) {
    throw new Error("hold_minutes must be between 1 and 2160 (36 hours)");
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("ops_create_seat_booking_hold", {
    p_flight_id: flightId,
    p_seat_count: seatCount,
    p_hold_minutes: holdMinutes,
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

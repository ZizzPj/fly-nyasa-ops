"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function assertUuid(v: string, label: string) {
  const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (!ok) throw new Error(`Invalid ${label}`);
}

export async function createSeatHoldAction(input: {
  flightId: string;
  seatCount: number;
  holdMinutes: number;
}) {
  assertUuid(input.flightId, "flightId");
  if (!Number.isInteger(input.seatCount) || input.seatCount < 1) throw new Error("seatCount must be >= 1");
  if (!Number.isInteger(input.holdMinutes) || input.holdMinutes < 1 || input.holdMinutes > 2160)
    throw new Error("holdMinutes must be between 1 and 2160");

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("ops_create_seat_booking_hold", {
    p_flight_id: input.flightId,
    p_seat_count: input.seatCount,
    p_hold_minutes: input.holdMinutes,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/ops");
  revalidatePath("/ops/flights");
  revalidatePath(`/ops/flights/${input.flightId}`);
  revalidatePath("/ops/bookings");
  revalidatePath("/ops/reservations");

  return data; // [{ booking_id, held_seats, held_until }]
}

export async function createCharterHoldAction(input: {
  flightId: string;
  holdMinutes: number;
}) {
  assertUuid(input.flightId, "flightId");
  if (!Number.isInteger(input.holdMinutes) || input.holdMinutes < 1 || input.holdMinutes > 2160)
    throw new Error("holdMinutes must be between 1 and 2160");

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("ops_create_charter_booking_hold", {
    p_flight_id: input.flightId,
    p_hold_minutes: input.holdMinutes,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/ops");
  revalidatePath("/ops/flights");
  revalidatePath(`/ops/flights/${input.flightId}`);
  revalidatePath("/ops/bookings");
  revalidatePath("/ops/reservations");

  return data; // [{ booking_id, charter_optioned, held_until }]
}

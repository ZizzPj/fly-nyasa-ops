"use server";

import { revalidatePath } from "next/cache";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function mustUuid(v: string) {
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (!ok) throw new Error(`Invalid booking id: ${v}`);
}

export async function cancelBookingAction(bookingId: string) {
  // 🔐 HARD GATE — ops/admin only
  await requireOpsUser();

  mustUuid(bookingId);

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    throw new Error(error.message);
  }

  // 🔁 Revalidate authoritative views
  revalidatePath("/ops");
  revalidatePath("/ops/bookings");
  revalidatePath(`/ops/bookings/${bookingId}`);
  revalidatePath("/ops/flights");
  revalidatePath("/ops/reservations");

  // [{ booking_id, released_seats, released_charter }]
  return data;
}

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireOpsUser } from "@/lib/auth/guard";

function mustUuid(v: string) {
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (!ok) throw new Error(`Invalid uuid: ${v}`);
}

export async function confirmCharterBookingAction(bookingId: string) {
  await requireOpsUser();
  mustUuid(bookingId);

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("confirm_charter_booking", {
    p_booking_id: bookingId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/ops");
  revalidatePath("/ops/bookings");
  revalidatePath(`/ops/bookings/${bookingId}`);
  revalidatePath("/ops/flights");
  revalidatePath("/ops/reservations");

  return data; // [{ booking_id, confirmed_charter }]
}

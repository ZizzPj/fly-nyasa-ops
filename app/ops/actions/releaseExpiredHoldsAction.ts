"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function releaseExpiredHoldsAction() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("release_expired_seat_holds");
  if (error) throw new Error(error.message);

  // refresh all operational surfaces
  revalidatePath("/ops");
  revalidatePath("/ops/flights");
  revalidatePath("/ops/bookings");
  revalidatePath("/ops/reservations");

  return data; // [{ released_count }]
}

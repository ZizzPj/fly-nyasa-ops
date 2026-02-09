"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function closeFlightsPastCutoffAction() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("close_flights_past_cutoff");

  if (error) throw new Error(error.message);

  // refresh command center + flights listing/details
  revalidatePath("/ops");
  revalidatePath("/ops/flights");

  // RPC returns integer count (per your function)
  return data as number;
}

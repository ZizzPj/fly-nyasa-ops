"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED = new Set(["SCHEDULED", "OPEN", "CLOSED", "CANCELLED"]);

export async function setFlightStatusAction(flightId: string, nextStatus: string) {
  if (!flightId) throw new Error("Missing flightId");
  if (!ALLOWED.has(nextStatus)) throw new Error(`Invalid status: ${nextStatus}`);

  const supabase = createSupabaseAdminClient();

  // Direct update: professional + safe when server-only + allowlisted
  const { data, error } = await supabase
    .from("flights")
    .update({ status: nextStatus })
    .eq("id", flightId)
    .select("id,status")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Flight not found");

  revalidatePath("/ops/flights");
  revalidatePath(`/ops/flights/${flightId}`);

  return data;
}

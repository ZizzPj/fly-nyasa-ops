"use server";

import { revalidatePath } from "next/cache";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createAirportAction(formData: FormData) {
  await requireOpsUser();

  const name = String(formData.get("name") ?? "").trim();
  const icao = String(formData.get("icao") ?? "").trim() || null;

  if (!name) throw new Error("Airport name is required");

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("airports").insert({
    name,
    icao,
    is_active: true,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/ops/airports");
  revalidatePath("/ops/flights/seat-rate/new");
  revalidatePath("/ops/flights/charter/new");
}
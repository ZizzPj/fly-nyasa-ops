"use server";

import { revalidatePath } from "next/cache";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createAirportAction(formData: FormData) {
  await requireOpsUser();

  const name = String(formData.get("name") ?? "").trim();
  const icao = String(formData.get("icao") ?? "").trim() || null;
  const airportType = String(formData.get("airport_type") ?? "AIRPORT").trim().toUpperCase();

  if (!name) throw new Error("Name is required");

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("airports").insert({
    name,
    icao,
    airport_type: airportType,
    is_active: true,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/ops/airports");
}
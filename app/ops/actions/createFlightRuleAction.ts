"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireOpsUser } from "@/lib/auth/guard";

function must(value: string, label: string) {
  if (!value) throw new Error(`Missing ${label}`);
}

export async function createFlightRuleAction(formData: FormData) {
  await requireOpsUser();

  const supabase = createSupabaseAdminClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isActiveRaw = String(formData.get("is_active") ?? "true").trim();

  must(name, "name");

  const { error } = await supabase.from("flight_rules").insert({
    name,
    description: description || null,
    is_active: isActiveRaw === "true",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/ops/rules");
  revalidatePath("/ops/flights/seat-rate/new");
  revalidatePath("/ops/flights/charter/new");
}
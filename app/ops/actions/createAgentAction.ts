"use server";

import { revalidatePath } from "next/cache";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createAgentAction(formData: FormData) {
  await requireOpsUser();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name) throw new Error("Name is required");

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("agents").insert({
    name,
    email,
    phone,
    is_active: true,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/ops/agents");
}
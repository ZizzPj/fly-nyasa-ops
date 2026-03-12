"use server";

import { revalidatePath } from "next/cache";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function mustUuid(v: string, label = "uuid") {
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (!ok) throw new Error(`Invalid ${label}: ${v}`);
}

export async function reactivateFlightAction(flightId: string) {
  await requireOpsUser();
  mustUuid(flightId, "flight_id");

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("flights")
    .update({ status: "OPEN" })
    .eq("id", flightId);

  if (error) throw new Error(error.message);

  revalidatePath("/ops");
  revalidatePath("/ops/flights");
  revalidatePath(`/ops/flights/${flightId}`);
}
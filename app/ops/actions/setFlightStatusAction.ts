"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireOpsUser } from "@/lib/auth/guard";

const ALLOWED = new Set(["SCHEDULED", "OPEN", "CLOSED", "CANCELLED", "DEPARTED"]);

function assertUuid(v: string, label: string) {
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (!ok) throw new Error(`Invalid ${label}`);
}

export async function setFlightStatusAction(flightId: string, nextStatus: string) {
  await requireOpsUser(); // ✅ demo token or allowlist enforced here

  if (!flightId) throw new Error("Missing flightId");
  assertUuid(flightId, "flightId");

  const status = (nextStatus ?? "").toUpperCase();
  if (!ALLOWED.has(status)) throw new Error(`Invalid status: ${nextStatus}`);

  const supabase = createSupabaseAdminClient();

  // Direct update is OK here (server-only). DB constraints still apply.
  const { data, error } = await supabase
    .from("flights")
    .update({ status })
    .eq("id", flightId)
    .select("id,status")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Flight not found");

  revalidatePath("/ops");
  revalidatePath("/ops/flights");
  revalidatePath(`/ops/flights/${flightId}`);
  revalidatePath("/ops/reservations");
  revalidatePath("/ops/bookings");

  return data;
}

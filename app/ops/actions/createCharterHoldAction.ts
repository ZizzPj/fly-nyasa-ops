"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOpsUser } from "@/lib/auth/guard";

function mustUuid(v: string, label: string) {
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (!ok) throw new Error(`Invalid ${label}`);
}

export async function createCharterHoldAction(input: { flightId: string; holdMinutes: number }) {
  await requireOpsUser();

  mustUuid(input.flightId, "flightId");
  if (!Number.isInteger(input.holdMinutes) || input.holdMinutes < 1 || input.holdMinutes > 2160) {
    throw new Error("holdMinutes must be between 1 and 2160");
  }

  const sb = await createSupabaseServerClient();
  const { data: u } = await sb.auth.getUser();
  const userId = u?.user?.id ?? process.env.OPS_DEMO_USER_ID;
  if (!userId) throw new Error("Missing OPS_DEMO_USER_ID for demo mode.");
  mustUuid(userId, "user_id");

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("ops_create_charter_booking_hold", {
    p_flight_id: input.flightId,
    p_hold_minutes: input.holdMinutes,
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/ops");
  revalidatePath("/ops/flights");
  revalidatePath(`/ops/flights/${input.flightId}`);
  revalidatePath("/ops/bookings");
  revalidatePath("/ops/reservations");

  return data;
}

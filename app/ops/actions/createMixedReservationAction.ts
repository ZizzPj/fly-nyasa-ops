"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOpsUser } from "@/lib/auth/guard";

const DEMO_USER_ID = process.env.OPS_DEMO_USER_ID ?? "";

function must(value: string, label: string) {
  if (!value) throw new Error(`Missing ${label}`);
}

function mustUuid(v: string, label = "uuid") {
  const ok =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  if (!ok) throw new Error(`Invalid ${label}: ${v}`);
}

function num(v: FormDataEntryValue | null, fallback = 0) {
  const n = Number(v ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

function generatePnr() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const l = () => letters[Math.floor(Math.random() * letters.length)];
  const n = () => numbers[Math.floor(Math.random() * numbers.length)];
  return `NYA-${l()}${l()}${n()}${n()}${n()}`;
}

function extractPassengerDetails(formData: FormData, total: number) {
  const rows: Array<{
    name: string;
    phone: string;
    email: string;
    weight: number | null;
    nationality: string;
    document: string;
  }> = [];

  for (let i = 1; i <= total; i++) {
    const weightRaw = String(formData.get(`passenger_${i}_weight`) ?? "").trim();

    rows.push({
      name: String(formData.get(`passenger_${i}_name`) ?? "").trim(),
      phone: String(formData.get(`passenger_${i}_phone`) ?? "").trim(),
      email: String(formData.get(`passenger_${i}_email`) ?? "").trim(),
      weight: weightRaw ? Number(weightRaw) : null,
      nationality: String(formData.get(`passenger_${i}_nationality`) ?? "").trim(),
      document: String(formData.get(`passenger_${i}_document`) ?? "").trim(),
    });
  }

  return rows;
}

export async function createMixedReservationAction(formData: FormData) {
  await requireOpsUser();

  const seatFlightId = String(formData.get("seat_flight_id") ?? "").trim();
  const charterFlightId = String(formData.get("charter_flight_id") ?? "").trim();
  const holdMinutes = num(formData.get("hold_minutes"), 60);
  const adults = num(formData.get("no_of_adults"), 0);
  const children = num(formData.get("no_of_children"), 0);
  const seatCount = adults + children;

  must(seatFlightId, "seat_flight_id");
  must(charterFlightId, "charter_flight_id");
  mustUuid(seatFlightId, "seat_flight_id");
  mustUuid(charterFlightId, "charter_flight_id");

  if (seatCount <= 0) throw new Error("At least 1 passenger is required");

  const sb = await createSupabaseServerClient();
  const { data: u } = await sb.auth.getUser();
  const userId = u?.user?.id ?? DEMO_USER_ID;

  if (!userId) throw new Error("Missing OPS_DEMO_USER_ID.");
  mustUuid(userId, "user_id");

  const supabase = createSupabaseAdminClient();
  const pnr = generatePnr();

  const passengerDetails = extractPassengerDetails(formData, seatCount);

  const { data: seatData, error: seatErr } = await supabase.rpc("ops_create_seat_booking_hold", {
    p_flight_id: seatFlightId,
    p_seat_count: seatCount,
    p_user_id: userId,
    p_hold_minutes: holdMinutes,
  });

  if (seatErr) throw new Error(seatErr.message);

  const seatBookingId = (Array.isArray(seatData) ? seatData[0] : seatData)?.booking_id as string | undefined;
  if (!seatBookingId) throw new Error("Seat booking was not created");

  const { data: charterData, error: charterErr } = await supabase.rpc("ops_create_charter_booking_hold", {
    p_flight_id: charterFlightId,
    p_hold_minutes: holdMinutes,
    p_user_id: userId,
  });

  if (charterErr) {
    await supabase.rpc("cancel_booking", { p_booking_id: seatBookingId });
    throw new Error(charterErr.message);
  }

  const charterBookingId = (Array.isArray(charterData) ? charterData[0] : charterData)?.booking_id as string | undefined;
  if (!charterBookingId) {
    await supabase.rpc("cancel_booking", { p_booking_id: seatBookingId });
    throw new Error("Charter booking was not created");
  }

  const commonDetails = {
    pnr,
    booking_date: new Date().toISOString(),
    staff_name: String(formData.get("staff_name") ?? "").trim() || null,
    agent_name: String(formData.get("agent_name") ?? "").trim() || null,
    passenger_name: String(formData.get("passenger_name") ?? "").trim() || null,
    preferred_departure_date: String(formData.get("preferred_departure_date") ?? "").trim() || null,
    return_date: String(formData.get("return_date") ?? "").trim() || null,
    no_of_adults: adults,
    no_of_children: children,
    notes: String(formData.get("notes") ?? "").trim() || null,
    passenger_details_json: passengerDetails,
  };

  await supabase.from("booking_details").insert([
    {
      booking_id: seatBookingId,
      reservation_mode: "MIXED",
      route_type: "SEAT_RATE",
      ...commonDetails,
    },
    {
      booking_id: charterBookingId,
      reservation_mode: "MIXED",
      route_type: "CHARTER",
      ...commonDetails,
    },
  ]);

  const { error: mixedErr } = await supabase.from("mixed_reservations").insert({
    seat_booking_id: seatBookingId,
    charter_booking_id: charterBookingId,
    pnr,
  });

  if (mixedErr) throw new Error(mixedErr.message);

  revalidatePath("/ops");
  revalidatePath("/ops/bookings");
  revalidatePath("/ops/flights");
  revalidatePath("/ops/reservations");

  redirect(`/ops/bookings/${seatBookingId}`);
}
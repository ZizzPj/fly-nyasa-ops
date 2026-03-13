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

function bool(v: FormDataEntryValue | null) {
  return String(v ?? "") === "true";
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

export async function createCharterReservationAction(formData: FormData) {
  await requireOpsUser();

  const flightId = String(formData.get("flight_id") ?? "").trim();
  const holdMinutes = num(formData.get("hold_minutes"), 60);
  const adults = num(formData.get("no_of_adults"), 0);
  const children = num(formData.get("no_of_children"), 0);
  const totalPassengers = adults + children;

  must(flightId, "flight_id");
  mustUuid(flightId, "flight_id");

  if (holdMinutes < 1 || holdMinutes > 2160) {
    throw new Error("hold_minutes must be between 1 and 2160");
  }

  const sb = await createSupabaseServerClient();
  const { data: u } = await sb.auth.getUser();

  const userId = u?.user?.id ?? DEMO_USER_ID;
  if (!userId) throw new Error("Missing OPS_DEMO_USER_ID.");
  mustUuid(userId, "user_id");

  const supabase = createSupabaseAdminClient();

  const { data: flightRow, error: flightErr } = await supabase
    .from("v_operational_flights_display")
    .select("*")
    .eq("flight_id", flightId)
    .maybeSingle();

  if (flightErr) throw new Error(flightErr.message);
  if (!flightRow) throw new Error("Flight not found");

  const pnr = generatePnr();

  const { data, error } = await supabase.rpc("ops_create_charter_booking_hold", {
    p_flight_id: flightId,
    p_hold_minutes: holdMinutes,
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  const bookingId = row?.booking_id as string | undefined;
  if (!bookingId) throw new Error("RPC did not return booking_id");

  const passengerDetails = extractPassengerDetails(formData, totalPassengers);

  const { error: detailsErr } = await supabase.from("booking_details").insert({
    booking_id: bookingId,
    reservation_mode: "CHARTER",
    pnr,
    booking_date: new Date().toISOString(),
    staff_name: String(formData.get("staff_name") ?? "").trim() || null,
    agent_name: String(formData.get("agent_name") ?? "").trim() || null,
    passenger_name: String(formData.get("passenger_name") ?? "").trim() || null,
    route_type: "CHARTER",
    departure_airport_name: flightRow.departure_airport_name ?? null,
    via_airport_name: flightRow.via_airport_name ?? null,
    arrival_airport_name: flightRow.arrival_airport_name ?? null,
    preferred_departure_date:
      String(formData.get("preferred_departure_date") ?? "").trim() || null,
    return_required: bool(formData.get("return_required")),
    return_date: String(formData.get("return_date") ?? "").trim() || null,
    no_of_adults: adults,
    no_of_children: children,
    total_cost: num(formData.get("total_cost"), 0),
    demurrage: num(formData.get("demurrage"), 0),
    change_date_fee: num(formData.get("change_date_fee"), 0),
    excess_baggage_fee: num(formData.get("excess_baggage_fee"), 0),
    fuel_surcharge: num(formData.get("fuel_surcharge"), 0),
    credit_card_surcharge: num(formData.get("credit_card_surcharge"), 0),
    departure_taxes: num(formData.get("departure_taxes"), 0),
    include_vat: bool(formData.get("include_vat")),
    from_lodge: String(formData.get("from_lodge") ?? "").trim() || null,
    to_lodge: String(formData.get("to_lodge") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    passenger_details_json: passengerDetails,
  });

  if (detailsErr) throw new Error(detailsErr.message);

  revalidatePath("/ops");
  revalidatePath("/ops/bookings");
  revalidatePath("/ops/flights");
  revalidatePath("/ops/reservations");

  redirect(`/ops/bookings/${bookingId}`);
}
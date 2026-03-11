"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireOpsUser } from "@/lib/auth/guard";

function must(value: string, label: string) {
  if (!value) throw new Error(`Missing ${label}`);
}

function parseNumber(value: string, label: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${label}`);
  return n;
}

export async function createCharterFlightConfigAction(formData: FormData) {
  await requireOpsUser();

  const supabase = createSupabaseAdminClient();

  const flightNumber = String(formData.get("flight_number") ?? "").trim();
  const departureAirportId = String(formData.get("departure_airport_id") ?? "").trim();
  const viaAirportIdRaw = String(formData.get("via_airport_id") ?? "").trim();
  const viaAirportId = viaAirportIdRaw || null;
  const arrivalAirportId = String(formData.get("arrival_airport_id") ?? "").trim();

  const cost = parseNumber(String(formData.get("cost") ?? "").trim(), "cost");
  const departureTax = parseNumber(
    String(formData.get("departure_tax") ?? "").trim(),
    "departure_tax"
  );

  const maxBaggageAllowanceKgRaw = String(
    formData.get("max_baggage_allowance_kg") ?? ""
  ).trim();

  const flightDurationMinutes = parseNumber(
    String(formData.get("flight_duration_minutes") ?? "").trim(),
    "flight_duration_minutes"
  );

  const charterStatus = String(formData.get("charter_status") ?? "ACTIVE")
    .trim()
    .toUpperCase();

  const flightRuleIdRaw = String(formData.get("flight_rule_id") ?? "").trim();
  const flightRuleId = flightRuleIdRaw || null;

  must(flightNumber, "flight_number");
  must(departureAirportId, "departure_airport_id");
  must(arrivalAirportId, "arrival_airport_id");

  if (departureAirportId === arrivalAirportId) {
    throw new Error("Departure and arrival airport cannot be the same.");
  }

  const maxBaggageAllowanceKg = maxBaggageAllowanceKgRaw
    ? parseNumber(maxBaggageAllowanceKgRaw, "max_baggage_allowance_kg")
    : null;

  const { error } = await supabase.from("charter_flights").insert({
    flight_number: flightNumber,
    departure_airport_id: departureAirportId,
    via_airport_id: viaAirportId,
    arrival_airport_id: arrivalAirportId,
    cost,
    departure_tax: departureTax,
    max_baggage_allowance_kg: maxBaggageAllowanceKg,
    flight_duration_minutes: flightDurationMinutes,
    charter_status: charterStatus,
    flight_rule_id: flightRuleId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/ops/flights/charter");
  redirect("/ops/flights/charter");
}
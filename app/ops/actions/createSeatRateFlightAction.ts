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

function toIsoDate(value: string, label: string) {
  must(value, label);
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid ${label}`);
  return d;
}

function combineDateAndTimeToMalawiTz(dateStr: string, timeStr: string) {
  if (!dateStr || !timeStr) throw new Error("Missing date/time");
  return `${dateStr}T${timeStr}:00+02:00`;
}

function weekdayFromDate(date: Date) {
  return date.getUTCDay();
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function fmtYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayOffsetFromTimeRange(etd: string, eta: string) {
  const [eh, em] = etd.split(":").map(Number);
  const [ah, am] = eta.split(":").map(Number);

  const etdMinutes = eh * 60 + em;
  const etaMinutes = ah * 60 + am;

  return etaMinutes < etdMinutes ? 1 : 0;
}

export async function createSeatRateFlightAction(formData: FormData) {
  await requireOpsUser();

  const supabase = createSupabaseAdminClient();

  const aircraftId = String(formData.get("aircraft_id") ?? "").trim();
  const flightNumber = String(formData.get("flight_number") ?? "").trim();

  const departureAirportId = String(formData.get("departure_airport_id") ?? "").trim();
  const viaAirportIdRaw = String(formData.get("via_airport_id") ?? "").trim();
  const viaAirportId = viaAirportIdRaw || null;
  const arrivalAirportId = String(formData.get("arrival_airport_id") ?? "").trim();

  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const scheduleStatus = String(formData.get("schedule_status") ?? "ACTIVE").trim().toUpperCase();

  const etd = String(formData.get("etd") ?? "").trim();
  const eta = String(formData.get("eta") ?? "").trim();
  const estimatedDurationMinutes = parseNumber(
    String(formData.get("estimated_duration_minutes") ?? "").trim(),
    "estimated_duration_minutes"
  );

  const maxBaggageAllowanceKgRaw = String(formData.get("max_baggage_allowance_kg") ?? "").trim();
  const adultFare = parseNumber(String(formData.get("adult_fare") ?? "").trim(), "adult_fare");
  const childFare = parseNumber(String(formData.get("child_fare") ?? "").trim(), "child_fare");
  const departureTax = parseNumber(
    String(formData.get("departure_tax") ?? "").trim(),
    "departure_tax"
  );

  const flightRuleIdRaw = String(formData.get("flight_rule_id") ?? "").trim();
  const flightRuleId = flightRuleIdRaw || null;

  const weekdayValues = formData
    .getAll("weekday_numbers")
    .map((v) => Number(String(v)))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

  must(aircraftId, "aircraft_id");
  must(flightNumber, "flight_number");
  must(departureAirportId, "departure_airport_id");
  must(arrivalAirportId, "arrival_airport_id");
  must(startDate, "start_date");
  must(endDate, "end_date");
  must(etd, "etd");
  must(eta, "eta");

  if (departureAirportId === arrivalAirportId) {
    throw new Error("Departure and arrival airport cannot be the same.");
  }

  if (weekdayValues.length === 0) {
    throw new Error("Select at least one flight day.");
  }

  const start = toIsoDate(startDate, "start_date");
  const end = toIsoDate(endDate, "end_date");

  if (end < start) {
    throw new Error("End schedule date cannot be before start schedule date.");
  }

  const maxBaggageAllowanceKg = maxBaggageAllowanceKgRaw
    ? parseNumber(maxBaggageAllowanceKgRaw, "max_baggage_allowance_kg")
    : null;

  // Load selected airport names
  const { data: airportRows, error: airportErr } = await supabase
    .from("airports")
    .select("id, name")
    .in("id", [departureAirportId, arrivalAirportId]);

  if (airportErr) throw new Error(airportErr.message);

  const departureAirport = airportRows?.find((a) => a.id === departureAirportId);
  const arrivalAirport = airportRows?.find((a) => a.id === arrivalAirportId);

  if (!departureAirport?.name) {
    throw new Error("Selected departure airport not found.");
  }

  if (!arrivalAirport?.name) {
    throw new Error("Selected arrival airport not found.");
  }

  // Match route using names because routes table stores text names/codes
  const { data: routeRow, error: routeErr } = await supabase
    .from("routes")
    .select("id")
    .ilike("origin_airport", departureAirport.name)
    .ilike("destination_airport", arrivalAirport.name)
    .maybeSingle();

  if (routeErr) throw new Error(routeErr.message);
  if (!routeRow?.id) {
    throw new Error(
      `No matching route found for ${departureAirport.name} → ${arrivalAirport.name}.`
    );
  }

  const { data: aircraftRow, error: aircraftErr } = await supabase
    .from("aircraft")
    .select("id, seat_config_id")
    .eq("id", aircraftId)
    .maybeSingle();

  if (aircraftErr) throw new Error(aircraftErr.message);
  if (!aircraftRow?.seat_config_id) {
    throw new Error("Selected aircraft is missing seat configuration.");
  }

  const { data: seatRateRow, error: seatRateErr } = await supabase
    .from("seat_rate_flights")
    .insert({
      aircraft_id: aircraftId,
      flight_number: flightNumber,
      departure_airport_id: departureAirportId,
      via_airport_id: viaAirportId,
      arrival_airport_id: arrivalAirportId,
      start_date: startDate,
      end_date: endDate,
      schedule_status: scheduleStatus,
      etd,
      eta,
      estimated_duration_minutes: estimatedDurationMinutes,
      max_baggage_allowance_kg: maxBaggageAllowanceKg,
      adult_fare: adultFare,
      child_fare: childFare,
      departure_tax: departureTax,
      flight_rule_id: flightRuleId,
    })
    .select("id")
    .single();

  if (seatRateErr) throw new Error(seatRateErr.message);

  const seatRateFlightId = seatRateRow.id as string;

  const weekdayInsert = weekdayValues.map((weekday) => ({
    seat_rate_flight_id: seatRateFlightId,
    weekday_number: weekday,
  }));

  const { error: dayErr } = await supabase
    .from("seat_rate_flight_days")
    .insert(weekdayInsert);

  if (dayErr) throw new Error(dayErr.message);

  const overnightOffset = dayOffsetFromTimeRange(etd, eta);
  const createdFlightIds: string[] = [];

  for (let current = new Date(start); current <= end; current = addDays(current, 1)) {
    const weekday = weekdayFromDate(current);
    if (!weekdayValues.includes(weekday)) continue;

    const departureDateStr = fmtYmd(current);
    const arrivalDate = addDays(current, overnightOffset);
    const arrivalDateStr = fmtYmd(arrivalDate);

    const departureTime = combineDateAndTimeToMalawiTz(departureDateStr, etd);
    const arrivalTime = combineDateAndTimeToMalawiTz(arrivalDateStr, eta);

    const { data: flightId, error: createErr } = await supabase.rpc(
      "ops_create_flight_with_inventory",
      {
        p_route_id: routeRow.id,
        p_aircraft_id: aircraftId,
        p_seat_config_id: aircraftRow.seat_config_id,
        p_flight_number: flightNumber,
        p_departure_time: departureTime,
        p_arrival_time: arrivalTime,
        p_booking_cutoff_minutes: 60,
      }
    );

    if (createErr) throw new Error(createErr.message);

    if (flightId) {
      createdFlightIds.push(String(flightId));
    }
  }

  revalidatePath("/ops");
  revalidatePath("/ops/flights");
  revalidatePath("/ops/flights/seat-rate");
  revalidatePath("/ops/reservations");

  if (createdFlightIds.length > 0) {
    redirect("/ops/flights/seat-rate");
  }

  throw new Error("Seat rate flight was saved, but no operational flights were generated.");
}
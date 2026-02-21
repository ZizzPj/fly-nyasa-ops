export function bookingStatusLabel(s: string | null | undefined) {
  const v = (s ?? "").toUpperCase();
  if (v === "RESERVED") return "Reservation";
  if (v === "TICKETED") return "Ticketed";
  if (v === "CANCELLED") return "Cancelled";
  if (v === "DRAFT") return "Draft";
  return v || "—";
}

export function bookingTypeLabel(t: string | null | undefined) {
  const v = (t ?? "").toUpperCase();
  if (v === "SEAT") return "Seat";
  if (v === "CHARTER") return "Charter";
  return v || "—";
}

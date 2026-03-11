export function routeLabel(row: {
  departure_airport_name: string | null | undefined;
  via_airport_name?: string | null | undefined;
  arrival_airport_name: string | null | undefined;
}) {
  const dep = row.departure_airport_name ?? "Departure";
  const via = row.via_airport_name ?? null;
  const arr = row.arrival_airport_name ?? "Arrival";

  return via ? `${dep} → ${via} → ${arr}` : `${dep} → ${arr}`;
}
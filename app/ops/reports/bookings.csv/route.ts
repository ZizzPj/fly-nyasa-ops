import { NextResponse } from "next/server";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_flight_inventory_summary")
    .select("*")
    .order("departure_time", { ascending: true })
    .limit(2000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const header = [
    "flight_id",
    "flight_number",
    "flight_status",
    "departure_time",
    "arrival_time",
    "seats_available",
    "seats_held",
    "seats_confirmed",
    "seats_blocked",
  ];

  const lines = [
    header.join(","),
    ...rows.map((r: any) => header.map((k) => csvEscape(r[k])).join(",")),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="flights_snapshot.csv"`,
      "cache-control": "no-store",
    },
  });
}

import { NextResponse } from "next/server";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  await requireOpsUser();

  const url = new URL(req.url);
  const lookahead = Math.max(30, Math.min(2160, Number(url.searchParams.get("lookahead") || 360)));
  const cutoffIso = new Date(Date.now() + lookahead * 60_000).toISOString();

  const supabase = await createSupabaseServerClient();

  const { data: seatHolds, error: shErr } = await supabase
    .from("seat_inventory")
    .select("id,flight_id,seat_id,status,held_until,booking_id,updated_at")
    .eq("status", "HELD")
    .not("held_until", "is", null)
    .lte("held_until", cutoffIso)
    .order("held_until", { ascending: true })
    .limit(2000);

  if (shErr) return NextResponse.json({ error: shErr.message }, { status: 500 });

  const { data: charterHolds, error: chErr } = await supabase
    .from("charter_inventory")
    .select("id,flight_id,status,held_until,booking_id,updated_at")
    .eq("status", "OPTIONED")
    .order("held_until", { ascending: true })
    .limit(2000);

  if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 });

  const header = [
    "kind",
    "inventory_id",
    "flight_id",
    "booking_id",
    "status",
    "seat_id",
    "held_until",
    "updated_at",
  ];

  const lines: string[] = [header.join(",")];

  for (const r of (seatHolds ?? [])) {
    lines.push(
      [
        "SEAT",
        csvEscape((r as any).id),
        csvEscape((r as any).flight_id),
        csvEscape((r as any).booking_id),
        csvEscape((r as any).status),
        csvEscape((r as any).seat_id),
        csvEscape((r as any).held_until),
        csvEscape((r as any).updated_at),
      ].join(",")
    );
  }

  for (const r of (charterHolds ?? [])) {
    lines.push(
      [
        "CHARTER",
        csvEscape((r as any).id),
        csvEscape((r as any).flight_id),
        csvEscape((r as any).booking_id),
        csvEscape((r as any).status),
        "", // seat_id blank
        csvEscape((r as any).held_until),
        csvEscape((r as any).updated_at),
      ].join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="holds_health.csv"`,
      "cache-control": "no-store",
    },
  });
}

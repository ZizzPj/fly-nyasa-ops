import { NextResponse } from "next/server";
import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function pdfEscapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

// Minimal PDF builder (single page, Helvetica)
function buildPdf(lines: string[]) {
  const fontObj = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;

  // Simple content stream: line by line
  const textLines = lines
    .map((t, i) => {
      const y = 760 - i * 18;
      return `1 0 0 1 50 ${y} Tm (${pdfEscapeText(t)}) Tj`;
    })
    .join("\n");

  const contentStream = `BT
/F1 12 Tf
${textLines}
ET`;

  const objects: string[] = [];
  const offsets: number[] = [];

  function addObject(obj: string) {
    offsets.push(0); // placeholder
    objects.push(obj);
  }

  // 1: catalog
  addObject(`<< /Type /Catalog /Pages 2 0 R >>`);
  // 2: pages
  addObject(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  // 3: page
  addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Resources << /Font << /F1 4 0 R >> >>
/Contents 5 0 R
>>`);
  // 4: font
  addObject(fontObj);
  // 5: content stream
  addObject(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);

  let out = `%PDF-1.4\n`;
  for (let i = 0; i < objects.length; i++) {
    offsets[i] = out.length;
    out += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = out.length;
  out += `xref\n0 ${objects.length + 1}\n`;
  out += `0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(out, "binary");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ booking_id: string }> }
) {
  await requireOpsUser();

  const { booking_id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_booking_operations")
    .select("*")
    .eq("booking_id", booking_id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const b: any = data;

  const lines = [
    "Fly Nyasa — Booking Confirmation",
    "--------------------------------",
    `Booking ID: ${b.booking_id}`,
    `Status: ${b.status ?? "—"}`,
    `Type: ${b.booking_type ?? "—"}`,
    `Flight: ${b.flight_number ?? b.flight_id}`,
    `Departure: ${b.departure_time ?? "—"}`,
    `Seats: ${b.seat_count ?? 0}`,
    `Charter: ${b.charter_count ?? 0}`,
    "",
    `Generated (UTC): ${new Date().toISOString()}`,
  ];

  const pdf = buildPdf(lines);

  return new NextResponse(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="booking_${b.booking_id}.pdf"`,
      "cache-control": "no-store",
    },
  });
}

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";

  const expected = process.env.OPS_DEMO_TOKEN ?? "";
  if (!expected) return new NextResponse("OPS_DEMO_TOKEN not set", { status: 500 });
  if (token !== expected) return new NextResponse("Invalid token", { status: 401 });

  const res = NextResponse.redirect(new URL("/ops", req.url));
  res.cookies.set("ops_demo", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.set("ops_demo", "", { path: "/", maxAge: 0 });
  return res;
}

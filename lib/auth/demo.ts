import { cookies } from "next/headers";

/**
 * Demo access is enabled when OPS_DEMO_TOKEN is set.
 * Client gains access by visiting /demo/login?token=...
 * which sets cookie "ops_demo".
 */
export async function hasDemoAccess() {
  const token = process.env.OPS_DEMO_TOKEN ?? "";
  if (!token) return false;

  const store = await cookies();
  const v = store.get("ops_demo")?.value ?? "";
  return v === token;
}

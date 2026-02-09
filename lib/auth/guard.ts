import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasDemoAccess } from "@/lib/auth/demo";

function demoModeEnabled() {
  return process.env.OPS_DEMO_MODE === "true";
}

export async function requireOpsUser() {
  // ✅ Demo mode: allow only if valid demo cookie exists
  if (demoModeEnabled()) {
    const ok = await hasDemoAccess();
    if (!ok) redirect("/login");
    return;
  }

  // ✅ Normal mode: Supabase auth + allowlist
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");

  const email = (data.user.email ?? "").toLowerCase();
  const allow = (process.env.OPS_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!email || !allow.includes(email)) redirect("/login");
}

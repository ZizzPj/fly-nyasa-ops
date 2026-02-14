import { redirect } from "next/navigation";
import { hasDemoAccess } from "@/lib/auth/demo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function demoModeEnabled() {
  return process.env.OPS_DEMO_MODE === "true";
}

export async function requireOpsOrDemo() {
  if (demoModeEnabled()) {
    if (!hasDemoAccess()) redirect("/login");
    return;
  }

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

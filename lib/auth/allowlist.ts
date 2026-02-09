export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;

  const raw = process.env.OPS_ALLOWLIST ?? "";
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.trim().toLowerCase());
}

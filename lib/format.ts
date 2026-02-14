export function fmtIso(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  // Stable output across server/client:
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

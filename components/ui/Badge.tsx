export function Badge({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "green" | "red" | "amber" | "blue";
}) {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-600/20"
      : tone === "red"
      ? "bg-red-50 text-red-700 ring-red-600/20"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700 ring-amber-600/20"
      : tone === "blue"
      ? "bg-blue-50 text-blue-700 ring-blue-600/20"
      : "bg-slate-50 text-slate-700 ring-slate-600/20";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status?: string | null) {
  const s = (status ?? "").toUpperCase();
  if (s === "OPEN" || s === "CONFIRMED" || s === "AVAILABLE") return "green";
  if (s === "CANCELLED" || s === "CLOSED") return "red";
  if (s === "HELD" || s === "DRAFT" || s === "SCHEDULED") return "amber";
  return "slate";
}

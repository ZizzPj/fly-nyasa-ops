export function Badge({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "green" | "red" | "amber" | "blue";
}) {
  const cls =
    tone === "green"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-700/15"
      : tone === "red"
      ? "bg-rose-50 text-rose-800 ring-rose-700/15"
      : tone === "amber"
      ? "bg-amber-50 text-amber-800 ring-amber-700/15"
      : tone === "blue"
      ? "bg-sky-50 text-sky-800 ring-sky-700/15"
      : "bg-slate-100 text-slate-700 ring-slate-700/10";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ring-1 ring-inset ${cls}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status?: string | null) {
  const s = (status ?? "").toUpperCase();

  // ✅ "positive" / completed
  if (s === "OPEN" || s === "TICKETED" || s === "AVAILABLE") return "green";

  // ✅ "danger" / terminal
  if (s === "CANCELLED" || s === "CLOSED" || s === "UNAVAILABLE") return "red";

  // ✅ "in-progress" / operational attention
  if (s === "RESERVED" || s === "DRAFT" || s === "SCHEDULED" || s === "OPTIONED") return "amber";

  return "slate";
}

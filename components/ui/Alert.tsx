import type { ReactNode } from "react";

export function Alert({
  title,
  children,
  tone = "red",
}: {
  title: string;
  children?: ReactNode;
  tone?: "red" | "amber" | "slate";
}) {
  const cls =
    tone === "amber"
      ? "border-amber-200/80 bg-amber-50/80 text-amber-950"
      : tone === "slate"
      ? "border-slate-200/80 bg-slate-50/80 text-slate-900"
      : "border-rose-200/80 bg-rose-50/80 text-rose-950";

  return (
    <div className={`rounded-[22px] border p-4 shadow-sm ${cls}`}>
      <div className="font-semibold">{title}</div>
      {children ? <div className="mt-2 text-sm">{children}</div> : null}
    </div>
  );
}

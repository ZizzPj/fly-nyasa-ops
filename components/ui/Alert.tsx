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
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : tone === "slate"
      ? "border-slate-200 bg-slate-50 text-slate-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="font-semibold">{title}</div>
      {children ? <div className="mt-2 text-sm">{children}</div> : null}
    </div>
  );
}

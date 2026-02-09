import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white shadow-sm">
      {(title || subtitle || right) && (
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <div className="text-base font-semibold">{title}</div>}
            {subtitle && <div className="mt-1 text-sm text-slate-600">{subtitle}</div>}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

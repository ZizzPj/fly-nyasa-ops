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
    <section className="dashboard-panel rounded-[28px]">
      {(title || subtitle || right) && (
        <div className="flex flex-col gap-3 border-b border-[color:var(--border)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <div className="text-base font-semibold tracking-tight text-[color:var(--ink)]">{title}</div>}
            {subtitle && <div className="mt-1 text-sm text-[color:var(--ink-muted)]">{subtitle}</div>}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

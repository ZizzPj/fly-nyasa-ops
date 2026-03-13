import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="dashboard-panel rounded-[30px] px-5 py-5 sm:px-7 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? <div className="eyebrow text-[11px] font-semibold text-[color:var(--ink-muted)]">{eyebrow}</div> : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[color:var(--ink)]">{title}</h1>
          {subtitle ? <div className="mt-2 max-w-3xl text-sm text-[color:var(--ink-muted)]">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

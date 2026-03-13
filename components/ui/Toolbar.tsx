import type { ReactNode } from "react";

export function Toolbar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="dashboard-panel flex flex-col gap-3 rounded-[24px] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}

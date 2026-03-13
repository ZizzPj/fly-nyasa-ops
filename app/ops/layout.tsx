import type { ReactNode } from "react";
import { requireOpsUser } from "@/lib/auth/guard";
import { Container } from "@/components/ui/Container";
import { OpsNav } from "./OpsNav";

export default async function OpsLayout({ children }: { children: ReactNode }) {
  await requireOpsUser();

  return (
    <div className="dashboard-shell">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-[rgba(252,250,245,0.78)] backdrop-blur-xl">
        <Container>
          <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0e5a66_0%,#0a3b44_100%)] text-lg font-semibold text-white shadow-lg">
                FN
              </div>
              <div className="leading-tight">
                <div className="eyebrow text-[11px] font-semibold text-[color:var(--ink-muted)]">
                  Fly Nyasa
                </div>
                <div className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[color:var(--ink)]">
                  Operations Control Deck
                </div>
              </div>
            </div>

            <OpsNav />
          </div>
        </Container>
      </header>

      <div className="border-b border-white/30 bg-[rgba(255,255,255,0.3)]">
        <Container>
          <div className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[color:var(--ink)]">
              Internal access only. Ops and Admin allowlist enforced at session gate.
            </div>
            <div className="text-xs text-[color:var(--ink-muted)]">
              Data source: authoritative inventory and booking operations views
            </div>
          </div>
        </Container>
      </div>

      <main className="py-8">
        <Container>
          <div className="dashboard-grid">{children}</div>
        </Container>
      </main>
    </div>
  );
}

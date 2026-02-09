import type { ReactNode } from "react";
import { requireOpsUser } from "@/lib/auth/guard";
import { Container } from "@/components/ui/Container";
import { OpsNav } from "./OpsNav";

export default async function OpsLayout({ children }: { children: ReactNode }) {
  await requireOpsUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <Container>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                ✈
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Fly Nyasa</div>
                <div className="text-xs text-slate-600">Ops Dashboard — Module 1</div>
              </div>
            </div>

            <OpsNav />
          </div>
        </Container>
      </header>

      <div className="border-b bg-white">
        <Container>
          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-700">
              Internal access only · Ops/Admin allowlist enforced
            </div>
            <div className="text-xs text-slate-500">
              Data source: authoritative views (inventory + booking operations)
            </div>
          </div>
        </Container>
      </div>

      <main className="py-6">
        <Container>{children}</Container>
      </main>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "MAGIC_LINK" | "DEMO_TOKEN";

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<Mode>("MAGIC_LINK");

  // Magic link state
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [magicErr, setMagicErr] = useState<string | null>(null);

  // Demo token state
  const [token, setToken] = useState("");
  const [demoErr, setDemoErr] = useState<string | null>(null);
  const [demoPending, setDemoPending] = useState(false);

  const urlError =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("error")
      : null;

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicErr(null);

    try {
      const origin = window.location.origin;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });

      if (error) {
        setMagicErr(error.message);
        return;
      }

      setSent(true);
    } catch (err: any) {
      setMagicErr(err?.message ?? "Failed to send magic link.");
    }
  }

  async function useDemoToken(e: React.FormEvent) {
    e.preventDefault();
    setDemoErr(null);
    setDemoPending(true);

    try {
      const t = token.trim();
      if (!t) {
        setDemoErr("Please enter a demo token.");
        return;
      }

      // This route should set the ops_demo cookie and redirect to /ops
      // app/demo/login/route.ts
      const url = `/demo/login?token=${encodeURIComponent(t)}`;
      window.location.assign(url);
    } catch (err: any) {
      setDemoErr(err?.message ?? "Demo login failed.");
      setDemoPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            ✈
          </div>
          <div className="leading-tight">
            <div className="text-lg font-semibold">Fly Nyasa</div>
            <div className="text-sm text-slate-600">Ops Dashboard</div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 rounded-xl border bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setMode("MAGIC_LINK")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "MAGIC_LINK"
                ? "bg-white shadow-sm"
                : "text-slate-700 hover:bg-white/60"
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => setMode("DEMO_TOKEN")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "DEMO_TOKEN"
                ? "bg-white shadow-sm"
                : "text-slate-700 hover:bg-white/60"
            }`}
          >
            Demo Token
          </button>
        </div>

        {urlError && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
            Login error: <b>{urlError}</b>
          </div>
        )}

        {mode === "MAGIC_LINK" ? (
          <div className="mt-6">
            <div className="text-sm text-slate-700">
              Enter your ops email to receive a magic link.
            </div>

            <form onSubmit={sendMagicLink} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Email</label>
                <input
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  type="email"
                  placeholder="ops@flynyasa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <button
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                disabled={sent}
                type="submit"
              >
                {sent ? "Magic link sent" : "Send magic link"}
              </button>
            </form>

            {sent && (
              <div className="mt-3 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
                Check your inbox and open the magic link to sign in.
              </div>
            )}

            {magicErr && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {magicErr}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <div className="text-sm text-slate-700">
              For client testing on Vercel, enter the demo token to access the Ops
              module without email login.
            </div>

            <form onSubmit={useDemoToken} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Demo token</label>
                <input
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  type="password"
                  placeholder="Enter demo token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <button
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                disabled={demoPending}
                type="submit"
              >
                {demoPending ? "Signing in..." : "Enter demo"}
              </button>
            </form>

            <div className="mt-3 rounded-xl border bg-slate-50 p-3 text-xs text-slate-600">
              This works only if <code>OPS_DEMO_MODE=true</code> and{" "}
              <code>OPS_DEMO_TOKEN</code> are configured on the server (Vercel env).
            </div>

            {demoErr && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {demoErr}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        Internal system · Module 1 demo environment
      </div>
    </main>
  );
}

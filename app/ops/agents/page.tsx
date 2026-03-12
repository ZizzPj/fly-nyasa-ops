import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { CreateAgentForm } from "./CreateAgentForm";

type AgentRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

export default async function AgentsPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return (
      <section className="space-y-6">
        <Alert title="Agents load failed" tone="red">
          {error.message}
        </Alert>
      </section>
    );
  }

  const rows = (data ?? []) as AgentRow[];

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Ops</div>
        <h1 className="mt-1 text-2xl font-semibold">Agents</h1>
        <div className="mt-1 text-sm text-slate-700">
          Add and manage booking agents.
        </div>
      </div>

      <Card title="Add Agent" subtitle="Create a new booking agent.">
        <CreateAgentForm />
      </Card>

      <Card title="Agents" subtitle="Active and inactive agents.">
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No agents found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {rows.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-slate-50">
                    <td className="font-semibold">{a.name}</td>
                    <td>{a.email ?? "—"}</td>
                    <td>{a.phone ?? "—"}</td>
                    <td>{a.is_active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
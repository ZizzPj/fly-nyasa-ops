import { requireOpsUser } from "@/lib/auth/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { CreateFlightRuleForm } from "./CreateFlightRuleForm";

type RuleRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export default async function RulesPage() {
  await requireOpsUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("flight_rules")
    .select("id, name, description, is_active")
    .order("name", { ascending: true });

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <div className="text-xs text-slate-600">Rules</div>
          <h1 className="mt-1 text-2xl font-semibold">Flight Rules</h1>
        </div>

        <Alert title="Rules load failed" tone="red">
          {error.message}
        </Alert>
      </section>
    );
  }

  const rows = (data ?? []) as RuleRow[];

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-slate-600">Rules</div>
        <h1 className="mt-1 text-2xl font-semibold">Flight Rules</h1>
        <div className="mt-1 text-sm text-slate-700">
          Manage operational rules used in Seat Rate Flights and Charter Flights.
        </div>
      </div>

      <Card title="Add Flight Rule" subtitle="Simple Sygen-style operational rule catalog.">
        <CreateFlightRuleForm />
      </Card>

      <Card title="Flight Rules" subtitle="Active and inactive rules available to ops.">
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-700">
            No rules found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Rule</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
                {rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-slate-50">
                    <td className="font-medium">{row.name}</td>
                    <td>{row.description ?? "—"}</td>
                    <td>{row.is_active ? "Active" : "Inactive"}</td>
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
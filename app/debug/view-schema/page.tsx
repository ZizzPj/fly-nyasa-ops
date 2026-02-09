import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function ViewSchemaDebugPage() {
  // DEV ONLY: service role reads information_schema
  const supabase = createSupabaseAdminClient();

  const view = "v_flight_inventory_summary";

  const { data, error } = await supabase
    .from("information_schema.columns")
    .select("column_name,data_type,is_nullable,ordinal_position")
    .eq("table_schema", "public")
    .eq("table_name", view)
    .order("ordinal_position", { ascending: true });

  if (error) {
    return (
      <pre style={{ padding: 24, whiteSpace: "pre-wrap" }}>
        {error.message}
      </pre>
    );
  }

  return (
    <pre style={{ padding: 24 }}>
      {JSON.stringify({ view, columns: data }, null, 2)}
    </pre>
  );
}

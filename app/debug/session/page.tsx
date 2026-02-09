import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DebugSessionPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <pre style={{ padding: 24 }}>
      {JSON.stringify(
        { user: data.user ? { id: data.user.id, email: data.user.email } : null },
        null,
        2
      )}
    </pre>
  );
}

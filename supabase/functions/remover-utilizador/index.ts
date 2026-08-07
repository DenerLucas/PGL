// Edge Function: remover-utilizador
// Apaga a conta de login por completo (não só o papel na app),
// para o email poder voltar a ser usado depois.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não suportado." }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessão inválida." }, 401);

    const { data: perfilCaller } = await adminClient
      .from("perfis")
      .select("papel")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!perfilCaller || perfilCaller.papel !== "admin") {
      return json({ error: "Só o Administrador pode remover utilizadores." }, 403);
    }

    const { uid } = await req.json();
    if (!uid) return json({ error: "Falta o UID do utilizador." }, 400);

    if (uid === userData.user.id) {
      return json({ error: "Não podes remover a tua própria conta." }, 400);
    }

    const { error: delErr } = await adminClient.auth.admin.deleteUser(uid);
    if (delErr) return json({ error: delErr.message }, 400);

    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message || String(e) }, 500);
  }
});

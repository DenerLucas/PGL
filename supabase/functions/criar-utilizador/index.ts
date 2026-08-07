// Edge Function: criar-utilizador
// Cria uma conta de login (Supabase Auth) + o perfil (papel/departamento)
// numa única chamada, sem nunca expor a chave secreta ao browser.

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Método não suportado." }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    // Cliente com privilégios totais (chave secreta) — só existe aqui no servidor
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Cliente usado só para confirmar quem está a chamar esta função
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
      return json({ error: "Só o Administrador pode criar utilizadores." }, 403);
    }

    const { email, password, nome, papel, departamentoId, pessoaId } = await req.json();

    if (!email || !password || !nome || !papel) {
      return json({ error: "Faltam campos obrigatórios (email, password, nome, papel)." }, 400);
    }
    if (!["admin", "lider", "membro"].includes(papel)) {
      return json({ error: "Papel inválido." }, 400);
    }
    if (password.length < 6) {
      return json({ error: "A password deve ter pelo menos 6 caracteres." }, 400);
    }

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) return json({ error: createErr.message }, 400);

    const novoId = created.user.id;

    const { error: perfilErr } = await adminClient.from("perfis").insert({
      id: novoId,
      nome,
      papel,
      departamento_id: papel === "admin" ? null : departamentoId,
      pessoa_id: papel === "admin" ? null : (pessoaId || null),
    });

    if (perfilErr) {
      return json({ error: "Conta criada, mas falhou ao gravar o perfil: " + perfilErr.message }, 500);
    }

    return json({ ok: true, id: novoId });
  } catch (e) {
    return json({ error: e.message || String(e) }, 500);
  }
});

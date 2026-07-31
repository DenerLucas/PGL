import { supabase } from "./supabaseClient";

export async function criarUtilizador({ email, password, nome, papel, departamentoId }) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Volta a entrar e tenta de novo.");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/criar-utilizador`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password, nome, papel, departamentoId }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao criar utilizador.");
  }
  return body;
}

export function gerarPasswordAleatoria() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

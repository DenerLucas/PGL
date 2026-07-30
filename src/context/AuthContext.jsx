import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null); // utilizador do Supabase Auth
  const [profile, setProfile] = useState(null);    // linha correspondente em "perfis"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from("perfis").select("*").eq("id", userId).maybeSingle();
    if (error) {
      setError(error.message);
      setProfile(null);
      return;
    }
    if (!data) {
      // Conta existe no Supabase Auth mas ainda não tem perfil atribuído
      setProfile(null);
      setError("SEM_PERFIL");
      return;
    }
    setError(null);
    setProfile({
      id: data.id,
      nome: data.nome,
      papel: data.papel,
      departamentoId: data.departamento_id,
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const user = data?.session?.user || null;
      if (!mounted) return;
      setAuthUser(user);
      if (user) await loadProfile(user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null;
      setAuthUser(user);
      if (user) {
        await loadProfile(user.id);
      } else {
        setProfile(null);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function changePassword(novaPassword) {
    const { error } = await supabase.auth.updateUser({ password: novaPassword });
    if (error) throw error;
  }

  const value = { authUser, profile, loading, error, signIn, signOut, changePassword, refreshProfile: () => loadProfile(authUser?.id) };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

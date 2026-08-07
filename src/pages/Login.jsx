import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { Card, Field, TextInput, Button } from "../components/ui";
import { COLORS } from "../lib/constants";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setErro(
        err.message === "Invalid login credentials"
          ? "Email ou password incorretos."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: COLORS.missao, padding: 24
    }}>
      <Card style={{ width: 400, maxWidth: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <img src="/logo-ccea.png" alt="CCEA Famalicão" style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover" }} />
          <h1 style={{ margin: 0, fontFamily: "'Lora', serif", color: COLORS.info, fontSize: "1.3rem", textAlign: "center" }}>
            Plataforma de Departamentos
          </h1>
          <p style={{ margin: 0, color: COLORS.textSoft, fontSize: "0.85rem", textAlign: "center" }}>CCEA Famalicão</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Email">
            <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="o-teu-email@exemplo.com" autoComplete="username" />
          </Field>
          <Field label="Password">
            <TextInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </Field>

          {erro && (
            <div style={{ background: "#F3DAD2", color: "#8A3A28", borderRadius: 8, padding: "8px 12px", fontSize: "0.82rem" }}>
              {erro}
            </div>
          )}

          <Button type="submit" disabled={loading || !email || !password} style={{ justifyContent: "center", marginTop: 6 }}>
            <LogIn size={16} /> {loading ? "A entrar..." : "Entrar"}
          </Button>
          <p style={{ fontSize: "0.75rem", color: COLORS.textSoft, textAlign: "center", margin: 0 }}>
            Não tens conta? Pede ao Administrador para te criar um acesso.
          </p>
        </form>
      </Card>
    </div>
  );
}

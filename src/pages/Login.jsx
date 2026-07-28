import React, { useState } from "react";
import { LogIn, Cross } from "lucide-react";
import { Card, Field, Select, Button } from "../components/ui";
import { COLORS } from "../lib/constants";
import { useSession } from "../context/SessionContext";
import { useChurchData } from "../context/DataContext";

export default function Login() {
  const { setSession } = useSession();
  const { departamentos } = useChurchData();
  const [papel, setPapel] = useState("admin");
  const [deptId, setDeptId] = useState(departamentos[0]?.id || "");

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: COLORS.missao, padding: 24
    }}>
      <Card style={{ width: 420, maxWidth: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <div style={{
            width: 62, height: 62, borderRadius: "50%", background: COLORS.info,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Cross size={28} color={COLORS.valores} />
          </div>
          <h1 style={{ margin: 0, fontFamily: "'Lora', serif", color: COLORS.info, fontSize: "1.3rem", textAlign: "center" }}>
            Plataforma de Departamentos
          </h1>
          <p style={{ margin: 0, color: COLORS.textSoft, fontSize: "0.85rem", textAlign: "center" }}>CCEA Famalicão</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Entrar como">
            <Select value={papel} onChange={(e) => setPapel(e.target.value)}>
              <option value="admin">Administrador (Dener)</option>
              <option value="lider">Líder de departamento</option>
              <option value="membro">Voluntário / Membro</option>
            </Select>
          </Field>

          {papel !== "admin" && (
            <Field label="Departamento">
              <Select value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </Select>
            </Field>
          )}

          <Button
            onClick={() => setSession({ papel, departamentoId: papel !== "admin" ? deptId : null })}
            style={{ justifyContent: "center", marginTop: 6 }}
          >
            <LogIn size={16} /> Entrar
          </Button>
          <p style={{ fontSize: "0.75rem", color: COLORS.textSoft, textAlign: "center", margin: 0 }}>
            Os dados desta plataforma são partilhados entre todos os utilizadores (Supabase).
          </p>
        </div>
      </Card>
    </div>
  );
}

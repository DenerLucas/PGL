import React from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { Card, SectionTitle, StatCard, Pill, Button } from "../components/ui";
import { COLORS, fmtDate, fmtMoney } from "../lib/constants";
import { useChurchData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { profile } = useAuth();
  const { departamentos, pessoas, escalas, funcoes, gastos } = useChurchData();
  const navigate = useNavigate();
  const hoje = new Date().toISOString().slice(0, 10);

  const proximasEscalas = escalas
    .filter((e) => e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 6);
  const pendentes = gastos.filter((g) => g.estado === "pendente");

  return (
    <div>
      <SectionTitle icon={LayoutDashboard} title="Painel geral" subtitle="Visão rápida da gestão dos departamentos" />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <StatCard label="Pessoas cadastradas" value={pessoas.length} />
        <StatCard label="Departamentos" value={departamentos.length} />
        <StatCard label="Escalas futuras" value={escalas.filter(e => e.data >= hoje).length} />
        <StatCard label="Gastos pendentes" value={pendentes.length} tone={pendentes.length ? COLORS.danger : COLORS.info} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
        <Card>
          <h3 style={{ marginTop: 0, fontFamily: "'Lora', serif", color: COLORS.info, fontSize: "1.05rem" }}>Próximas escalas</h3>
          {proximasEscalas.length === 0 && <p style={{ color: COLORS.textSoft, fontSize: "0.87rem" }}>Sem escalas futuras registadas ainda.</p>}
          <table>
            <tbody>
              {proximasEscalas.map((e) => {
                const dep = departamentos.find(d => d.id === e.departamentoId);
                const pessoa = pessoas.find(p => p.id === e.pessoaId);
                const fun = funcoes.find(f => f.id === e.funcaoId);
                return (
                  <tr key={e.id}>
                    <td>{fmtDate(e.data)}</td>
                    <td><Pill tone="comunidade">{e.periodo}</Pill></td>
                    <td>{dep?.nome}</td>
                    <td style={{ color: COLORS.textSoft }}>{fun?.nome}</td>
                    <td style={{ fontWeight: 600 }}>{pessoa?.nome || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Button variant="secondary" onClick={() => navigate("/escalas")} style={{ marginTop: 14 }}>Ver todas as escalas</Button>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0, fontFamily: "'Lora', serif", color: COLORS.info, fontSize: "1.05rem" }}>Aprovações pendentes</h3>
          {pendentes.length === 0 && <p style={{ color: COLORS.textSoft, fontSize: "0.87rem" }}>Nenhum gasto à espera de aprovação.</p>}
          {pendentes.slice(0, 5).map((g) => {
            const dep = departamentos.find(d => d.id === g.departamentoId);
            return (
              <div key={g.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>{g.descricao}</div>
                  <div style={{ fontSize: "0.76rem", color: COLORS.textSoft }}>{dep?.nome} · {fmtDate(g.data)}</div>
                </div>
                <div style={{ fontWeight: 700, color: COLORS.info }}>{fmtMoney(g.valor)}</div>
              </div>
            );
          })}
          {(profile.papel === "admin" || profile.papel === "lider") && (
            <Button variant="secondary" onClick={() => navigate("/gastos")} style={{ marginTop: 14 }}>Ver gastos</Button>
          )}
        </Card>
      </div>
    </div>
  );
}

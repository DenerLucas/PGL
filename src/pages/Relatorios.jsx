import React, { useState, useMemo } from "react";
import { FileBarChart } from "lucide-react";
import { Card, SectionTitle, Button, Pill } from "../components/ui";
import { COLORS, fmtDate, fmtMoney } from "../lib/constants";
import { useChurchData } from "../context/DataContext";
import { useSession } from "../context/SessionContext";

export default function Relatorios() {
  const { session } = useSession();
  const { departamentos, pessoas, funcoes, escalas, inventario, gastos } = useChurchData();
  const [aba, setAba] = useState("escalas");

  const isAdmin = session.papel === "admin";
  const myDeptId = session.departamentoId;

  const gastosVisiveis = isAdmin ? gastos : gastos.filter(g => g.departamentoId === myDeptId);
  const inventarioVisivel = inventario.filter(i => isAdmin || i.departamentoId === myDeptId);
  const escalasVisiveis = isAdmin ? escalas : escalas.filter(e => e.departamentoId === myDeptId);

  const financeiroPorDept = useMemo(() => {
    const aprovados = gastosVisiveis.filter(g => g.estado === "aprovado");
    const map = {};
    aprovados.forEach(g => {
      const dep = departamentos.find(d => d.id === g.departamentoId)?.nome || "—";
      const mes = g.data.slice(0, 7);
      const key = dep + "|" + mes;
      map[key] = (map[key] || 0) + g.valor;
    });
    return Object.entries(map).map(([key, total]) => {
      const [dep, mes] = key.split("|");
      return { dep, mes, total };
    }).sort((a, b) => b.mes.localeCompare(a.mes));
  }, [gastosVisiveis, departamentos]);

  return (
    <div>
      <SectionTitle icon={FileBarChart} title="Relatórios" subtitle="Escalas, financeiro e inventário" />
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {[
          ["escalas", "Histórico de escalas"],
          ["financeiro", "Financeiro por departamento"],
          ["inventario", "Estado do inventário"],
        ].map(([key, label]) => (
          <Button key={key} variant={aba === key ? "primary" : "secondary"} onClick={() => setAba(key)}>{label}</Button>
        ))}
      </div>

      {aba === "escalas" && (
        <Card>
          <table>
            <thead><tr><th>Data</th><th>Período</th><th>Departamento</th><th>Função</th><th>Pessoa</th></tr></thead>
            <tbody>
              {[...escalasVisiveis].sort((a, b) => b.data.localeCompare(a.data)).map((e) => {
                const dep = departamentos.find(d => d.id === e.departamentoId);
                const pessoa = pessoas.find(p => p.id === e.pessoaId);
                const fun = funcoes.find(f => f.id === e.funcaoId);
                return (
                  <tr key={e.id}>
                    <td>{fmtDate(e.data)}</td><td>{e.periodo}</td><td>{dep?.nome}</td>
                    <td style={{ color: COLORS.textSoft }}>{fun?.nome}</td><td style={{ fontWeight: 600 }}>{pessoa?.nome}</td>
                  </tr>
                );
              })}
              {escalasVisiveis.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: COLORS.textSoft, padding: 20 }}>Sem histórico.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {aba === "financeiro" && (
        <Card>
          <table>
            <thead><tr><th>Departamento</th><th>Mês</th><th>Total aprovado</th></tr></thead>
            <tbody>
              {financeiroPorDept.map((row, i) => (
                <tr key={i}><td>{row.dep}</td><td>{row.mes}</td><td style={{ fontWeight: 700, color: COLORS.info }}>{fmtMoney(row.total)}</td></tr>
              ))}
              {financeiroPorDept.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", color: COLORS.textSoft, padding: 20 }}>Sem gastos aprovados ainda.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {aba === "inventario" && (
        <Card>
          <table>
            <thead><tr><th>Item</th><th>Departamento</th><th>Localização</th><th>Estado</th></tr></thead>
            <tbody>
              {inventarioVisivel.map((i) => {
                const dep = departamentos.find(d => d.id === i.departamentoId);
                const tone = i.estado >= 4 ? "ok" : i.estado === 3 ? "warn" : "danger";
                return (
                  <tr key={i.id}><td style={{ fontWeight: 600 }}>{i.nome}</td><td>{dep?.nome}</td><td>{i.localizacao || "—"}</td><td><Pill tone={tone}>{i.estado} / 5</Pill></td></tr>
                );
              })}
              {inventarioVisivel.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: COLORS.textSoft, padding: 20 }}>Sem itens.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

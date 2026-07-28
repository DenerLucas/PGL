import React from "react";
import { Building2 } from "lucide-react";
import { Card, SectionTitle, Field, TextInput } from "../components/ui";
import { COLORS } from "../lib/constants";
import { useChurchData } from "../context/DataContext";

export default function Departamentos() {
  const { departamentos, pessoas, inventario, departamentosActions } = useChurchData();

  async function updateLideres(dep, lideresStr) {
    const lideres = lideresStr.split(",").map(s => s.trim()).filter(Boolean);
    await departamentosActions.update(
      dep.id, { ...dep, lideres }, "Dener (Administrador)",
      `Atualizou líder(es) do departamento "${dep.nome}".`
    );
  }

  return (
    <div>
      <SectionTitle icon={Building2} title="Departamentos" subtitle="Os 12 departamentos da CCEA Famalicão e os seus líderes" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {departamentos.map((dep) => {
          const nPessoas = pessoas.filter(p => p.atribuicoes.some(a => a.departamentoId === dep.id)).length;
          const nItens = inventario.filter(i => i.departamentoId === dep.id).length;
          return (
            <Card key={dep.id}>
              <h3 style={{ margin: "0 0 4px", fontFamily: "'Lora', serif", color: COLORS.info, fontSize: "1.02rem" }}>{dep.nome}</h3>
              <div style={{ display: "flex", gap: 12, fontSize: "0.78rem", color: COLORS.textSoft, marginBottom: 10 }}>
                <span>{nPessoas} pessoa(s)</span><span>·</span><span>{nItens} item(ns)</span>
              </div>
              <Field label="Líder(es) — separados por vírgula">
                <TextInput
                  defaultValue={dep.lideres.join(", ")}
                  onBlur={(e) => updateLideres(dep, e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </Field>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

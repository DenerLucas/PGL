import React, { useState } from "react";
import { Shield, Plus, X } from "lucide-react";
import { Card, SectionTitle, Button, Pill, Field, TextInput, Select } from "../components/ui";
import { COLORS } from "../lib/constants";
import { useChurchData } from "../context/DataContext";

export default function Funcoes() {
  const { departamentos, funcoes, funcoesActions } = useChurchData();
  const [novoNome, setNovoNome] = useState("");
  const [depId, setDepId] = useState(departamentos[0]?.id || "");

  async function addFuncao() {
    if (!novoNome.trim()) return;
    const dep = departamentos.find(x => x.id === depId);
    await funcoesActions.create(
      { nome: novoNome.trim(), departamentoId: depId },
      "Dener (Administrador)",
      `Criou a função "${novoNome.trim()}" em "${dep?.nome}".`
    );
    setNovoNome("");
  }

  async function removeFuncao(f) {
    await funcoesActions.remove(f.id, "Dener (Administrador)", `Removeu a função "${f.nome}".`);
  }

  return (
    <div>
      <SectionTitle icon={Shield} title="Funções" subtitle="Só o Administrador pode criar ou editar funções por departamento" />

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Departamento">
            <Select value={depId} onChange={(e) => setDepId(e.target.value)}>
              {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </Select>
          </Field>
          <Field label="Nome da função">
            <TextInput value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Recepcionista" />
          </Field>
          <Button onClick={addFuncao} disabled={!novoNome.trim()}><Plus size={16} /> Criar função</Button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {departamentos.map((dep) => {
          const funs = funcoes.filter(f => f.departamentoId === dep.id);
          return (
            <Card key={dep.id}>
              <h3 style={{ margin: "0 0 10px", fontFamily: "'Lora', serif", color: COLORS.info, fontSize: "1rem" }}>{dep.nome}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {funs.map((f) => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Pill tone="comunidade">{f.nome}</Pill>
                    <button onClick={() => removeFuncao(f)} style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer" }}><X size={14} /></button>
                  </div>
                ))}
                {funs.length === 0 && <span style={{ fontSize: "0.78rem", color: COLORS.textSoft }}>Sem funções.</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

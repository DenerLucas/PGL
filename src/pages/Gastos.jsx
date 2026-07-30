import React, { useState } from "react";
import { Wallet, Plus, Check, X } from "lucide-react";
import { Card, SectionTitle, Button, Pill, Modal, Field, TextInput, Select, TextArea } from "../components/ui";
import { COLORS, CATEGORIAS_GASTO, fmtDate, fmtMoney, userLabel } from "../lib/constants";
import { useChurchData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function Gastos() {
  const { profile } = useAuth();
  const { departamentos, gastos, gastosActions } = useChurchData();
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const isAdmin = profile.papel === "admin";
  const myDeptId = profile.departamentoId;
  const currentUserName = userLabel(profile, departamentos);

  async function addGasto(g) {
    await gastosActions.create(
      { ...g, estado: "pendente" }, currentUserName,
      `Registou um gasto de ${fmtMoney(g.valor)} (${g.categoria}) — aguarda aprovação.`
    );
    setModalOpen(false);
  }

  async function decidir(g, novoEstado) {
    await gastosActions.update(
      g.id, { ...g, estado: novoEstado }, currentUserName,
      `${novoEstado === "aprovado" ? "Aprovou" : "Rejeitou"} o gasto "${g.descricao}".`
    );
  }

  let visiveis = isAdmin ? gastos : gastos.filter(g => g.departamentoId === myDeptId);
  if (filtroEstado !== "todos") visiveis = visiveis.filter(g => g.estado === filtroEstado);
  visiveis = [...visiveis].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div>
      <SectionTitle
        icon={Wallet}
        title="Gastos"
        subtitle="Todo gasto fica pendente até aprovação do Administrador"
        action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Registar gasto</Button>}
      />

      <Card style={{ marginBottom: 16 }}>
        <Field label="Filtrar por estado">
          <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="rejeitado">Rejeitado</option>
          </Select>
        </Field>
      </Card>

      <Card>
        <table>
          <thead>
            <tr><th>Data</th><th>Departamento</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Estado</th>{isAdmin && <th></th>}</tr>
          </thead>
          <tbody>
            {visiveis.map((g) => {
              const dep = departamentos.find(d => d.id === g.departamentoId);
              const tone = g.estado === "aprovado" ? "ok" : g.estado === "rejeitado" ? "danger" : "warn";
              return (
                <tr key={g.id}>
                  <td>{fmtDate(g.data)}</td>
                  <td>{dep?.nome}</td>
                  <td>{g.descricao}</td>
                  <td style={{ color: COLORS.textSoft }}>{g.categoria}</td>
                  <td style={{ fontWeight: 700 }}>{fmtMoney(g.valor)}</td>
                  <td><Pill tone={tone}>{g.estado}</Pill></td>
                  {isAdmin && g.estado === "pendente" && (
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button variant="valores" style={{ padding: "5px 9px" }} onClick={() => decidir(g, "aprovado")}><Check size={14} /></Button>
                        <Button variant="danger" style={{ padding: "5px 9px" }} onClick={() => decidir(g, "rejeitado")}><X size={14} /></Button>
                      </div>
                    </td>
                  )}
                  {isAdmin && g.estado !== "pendente" && <td></td>}
                </tr>
              );
            })}
            {visiveis.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: COLORS.textSoft, padding: 20 }}>Nenhum gasto registado.</td></tr>}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <GastoModal
          departamentos={isAdmin ? departamentos : departamentos.filter(d => d.id === myDeptId)}
          onClose={() => setModalOpen(false)}
          onSave={addGasto}
        />
      )}
    </div>
  );
}

function GastoModal({ departamentos, onClose, onSave }) {
  const [valor, setValor] = useState("");
  const [dataG, setDataG] = useState(new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO[0]);
  const [departamentoId, setDepartamentoId] = useState(departamentos[0]?.id || "");

  const podeGuardar = valor && Number(valor) > 0 && descricao.trim() && departamentoId;

  return (
    <Modal title="Registar gasto" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Departamento">
          <Select value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
            {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </Select>
        </Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Valor (€)"><TextInput type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0.00" /></Field>
          <Field label="Data"><TextInput type="date" value={dataG} onChange={(e) => setDataG(e.target.value)} /></Field>
        </div>
        <Field label="Categoria">
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS_GASTO.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Descrição"><TextArea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do gasto..." /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!podeGuardar} onClick={() => onSave({ valor: Number(valor), data: dataG, descricao, categoria, departamentoId })}>
            <Check size={16} /> Enviar para aprovação
          </Button>
        </div>
      </div>
    </Modal>
  );
}

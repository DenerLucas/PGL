import React, { useState, useMemo } from "react";
import { CalendarDays, Plus, Check, AlertTriangle, Trash2 } from "lucide-react";
import { Card, SectionTitle, Button, Pill, Modal, Field, TextInput, Select } from "../components/ui";
import { COLORS, PERIODOS, fmtDate, weekdayNameFromDateStr, userLabel } from "../lib/constants";
import { useChurchData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function Escalas() {
  const { profile } = useAuth();
  const { departamentos, funcoes, pessoas, escalas, escalasActions } = useChurchData();
  const [modalOpen, setModalOpen] = useState(false);
  const [mesFiltro, setMesFiltro] = useState("");

  const isAdmin = profile.papel === "admin";
  const isLider = profile.papel === "lider";
  const myDeptId = profile.departamentoId;
  const canManage = isAdmin || isLider;
  const currentUserName = userLabel(profile, departamentos);

  async function addEscala(escala) {
    const dep = departamentos.find(x => x.id === escala.departamentoId);
    const pessoa = pessoas.find(p => p.id === escala.pessoaId);
    await escalasActions.create(
      escala, currentUserName,
      `Escalou "${pessoa?.nome}" para ${dep?.nome} em ${fmtDate(escala.data)} (${escala.periodo}).`
    );
    setModalOpen(false);
  }

  async function removeEscala(e) {
    await escalasActions.remove(e.id, currentUserName, `Removeu escala de ${fmtDate(e.data)}.`);
  }

  let visiveis = isAdmin ? escalas : isLider ? escalas.filter(e => e.departamentoId === myDeptId)
    : escalas.filter(e => pessoas.find(p => p.id === e.pessoaId)?.atribuicoes.some(a => a.departamentoId === myDeptId) || e.departamentoId === myDeptId);

  if (mesFiltro) visiveis = visiveis.filter(e => e.data.startsWith(mesFiltro));
  visiveis = [...visiveis].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div>
      <SectionTitle
        icon={CalendarDays}
        title="Escalas"
        subtitle="Montagem mensal de escalas por departamento"
        action={canManage && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Nova escala</Button>}
      />

      <Card style={{ marginBottom: 16 }}>
        <Field label="Filtrar por mês">
          <TextInput type="month" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} style={{ maxWidth: 200 }} />
        </Field>
      </Card>

      <Card>
        <table>
          <thead>
            <tr><th>Data</th><th>Período</th><th>Departamento</th><th>Função</th><th>Pessoa</th>{canManage && <th></th>}</tr>
          </thead>
          <tbody>
            {visiveis.map((e) => {
              const dep = departamentos.find(d => d.id === e.departamentoId);
              const pessoa = pessoas.find(p => p.id === e.pessoaId);
              const fun = funcoes.find(f => f.id === e.funcaoId);
              return (
                <tr key={e.id}>
                  <td>{fmtDate(e.data)}</td>
                  <td><Pill tone="comunidade">{e.periodo}</Pill></td>
                  <td>{dep?.nome}</td>
                  <td style={{ color: COLORS.textSoft }}>{fun?.nome}</td>
                  <td style={{ fontWeight: 600 }}>{pessoa?.nome}</td>
                  {canManage && <td><button onClick={() => removeEscala(e)} style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer" }}><Trash2 size={14} /></button></td>}
                </tr>
              );
            })}
            {visiveis.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: COLORS.textSoft, padding: 20 }}>Nenhuma escala encontrada.</td></tr>}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <EscalaModal
          departamentos={departamentos} funcoes={funcoes} pessoas={pessoas} escalas={escalas}
          isAdmin={isAdmin} myDeptId={myDeptId}
          onClose={() => setModalOpen(false)}
          onSave={addEscala}
        />
      )}
    </div>
  );
}

function EscalaModal({ departamentos, funcoes, pessoas, escalas, isAdmin, myDeptId, onClose, onSave }) {
  const departamentosDisponiveis = isAdmin ? departamentos : departamentos.filter(d => d.id === myDeptId);
  const [depId, setDepId] = useState(departamentosDisponiveis[0]?.id || "");
  const [funcaoId, setFuncaoId] = useState("");
  const [pessoaId, setPessoaId] = useState("");
  const [dataEsc, setDataEsc] = useState("");
  const [periodo, setPeriodo] = useState(PERIODOS[0]);

  const funcoesDoDept = funcoes.filter(f => f.departamentoId === depId);
  const pessoasDoDept = pessoas.filter(p => p.atribuicoes.some(a => a.departamentoId === depId));

  const conflitos = useMemo(() => {
    if (!pessoaId || !dataEsc || !periodo) return [];
    const avisos = [];
    const outraEscala = escalas.find(e => e.pessoaId === pessoaId && e.data === dataEsc && e.periodo === periodo && e.departamentoId !== depId);
    if (outraEscala) {
      const dep2 = departamentos.find(d => d.id === outraEscala.departamentoId);
      avisos.push(`Esta pessoa já está escalada em "${dep2?.nome}" nesta mesma data/período.`);
    }
    const pessoa = pessoas.find(p => p.id === pessoaId);
    const diaSemana = weekdayNameFromDateStr(dataEsc);
    if (pessoa && pessoa.disponibilidade.length > 0 && diaSemana && !pessoa.disponibilidade.includes(diaSemana)) {
      avisos.push(`Esta pessoa indicou não ter disponibilidade às ${diaSemana}s.`);
    }
    return avisos;
  }, [pessoaId, dataEsc, periodo, depId, escalas, departamentos, pessoas]);

  const podeGuardar = depId && funcaoId && pessoaId && dataEsc && periodo;

  return (
    <Modal title="Nova escala" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Departamento">
          <Select value={depId} onChange={(e) => { setDepId(e.target.value); setFuncaoId(""); setPessoaId(""); }}>
            {departamentosDisponiveis.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </Select>
        </Field>
        <Field label="Função">
          <Select value={funcaoId} onChange={(e) => setFuncaoId(e.target.value)}>
            <option value="">Selecionar...</option>
            {funcoesDoDept.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </Select>
        </Field>
        <Field label="Pessoa">
          <Select value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}>
            <option value="">Selecionar...</option>
            {pessoasDoDept.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </Select>
        </Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Data"><TextInput type="date" value={dataEsc} onChange={(e) => setDataEsc(e.target.value)} /></Field>
          <Field label="Período">
            <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
        </div>

        {conflitos.length > 0 && (
          <div style={{ background: "#F4E3C1", borderRadius: 10, padding: 12, display: "flex", gap: 8 }}>
            <AlertTriangle size={18} color="#7A4E12" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: "0.82rem", color: "#7A4E12" }}>
              {conflitos.map((c, i) => <div key={i}>{c}</div>)}
              <div style={{ marginTop: 4, fontWeight: 600 }}>Pode continuar — a decisão final é do líder.</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!podeGuardar} onClick={() => onSave({ departamentoId: depId, funcaoId, pessoaId, data: dataEsc, periodo })}>
            <Check size={16} /> Guardar escala
          </Button>
        </div>
      </div>
    </Modal>
  );
}

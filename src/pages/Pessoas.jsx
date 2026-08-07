import React, { useState } from "react";
import { Users, Plus, X, Check, Trash2 } from "lucide-react";
import { Card, SectionTitle, Button, Pill, Modal, Field, TextInput, Select, TableScroll } from "../components/ui";
import { COLORS, DIAS_SEMANA, userLabel } from "../lib/constants";
import { useChurchData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function Pessoas() {
  const { profile } = useAuth();
  const { pessoas, departamentos, funcoes, pessoasActions } = useChurchData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const isAdmin = profile.papel === "admin";
  const isLider = profile.papel === "lider";
  const myDeptId = profile.departamentoId;
  const canManage = isAdmin || isLider;
  const currentUserName = userLabel(profile, departamentos);

  function openNew() {
    setEditing({ id: null, nome: "", contacto: "", disponibilidade: [], atribuicoes: [] });
    setModalOpen(true);
  }

  async function save(pessoa) {
    if (pessoa.id) {
      await pessoasActions.update(pessoa.id, pessoa, currentUserName, `Editou a pessoa "${pessoa.nome}".`);
    } else {
      await pessoasActions.create(pessoa, currentUserName, `Cadastrou a pessoa "${pessoa.nome}".`);
    }
    setModalOpen(false);
  }

  async function remove(p) {
    await pessoasActions.remove(p.id, currentUserName, `Removeu a pessoa "${p.nome}".`);
  }

  const visiveis = isAdmin
    ? pessoas
    : pessoas.filter((p) => p.atribuicoes.some((a) => a.departamentoId === myDeptId));

  return (
    <div>
      <SectionTitle
        icon={Users}
        title="Pessoas"
        subtitle="Contactos, disponibilidade e funções por departamento"
        action={canManage && <Button onClick={openNew}><Plus size={16} /> Nova pessoa</Button>}
      />
      <Card>
        <TableScroll><table>
          <thead>
            <tr>
              <th>Nome</th><th>Contacto</th><th>Disponibilidade</th><th>Departamentos / Funções</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.nome}</td>
                <td style={{ color: COLORS.textSoft }}>{p.contacto || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 220 }}>
                    {p.disponibilidade.length === 0 && <span style={{ color: COLORS.textSoft, fontSize: "0.8rem" }}>—</span>}
                    {p.disponibilidade.map((d) => <Pill key={d} tone="valores">{d}</Pill>)}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {p.atribuicoes.map((a, i) => {
                      const dep = departamentos.find(x => x.id === a.departamentoId);
                      const funs = a.funcaoIds.map(fid => funcoes.find(f => f.id === fid)?.nome).filter(Boolean);
                      return (
                        <div key={i} style={{ fontSize: "0.82rem" }}>
                          <strong>{dep?.nome}</strong>{funs.length ? `: ${funs.join(", ")}` : ""}
                        </div>
                      );
                    })}
                    {p.atribuicoes.length === 0 && <span style={{ color: COLORS.textSoft, fontSize: "0.8rem" }}>Sem atribuição</span>}
                  </div>
                </td>
                {canManage && (
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button variant="secondary" onClick={() => { setEditing(p); setModalOpen(true); }} style={{ padding: "6px 10px" }}>Editar</Button>
                      {isAdmin && <Button variant="danger" onClick={() => remove(p)} style={{ padding: "6px 8px" }}><Trash2 size={14} /></Button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: COLORS.textSoft, padding: 20 }}>Nenhuma pessoa cadastrada ainda.</td></tr>
            )}
          </tbody>
        </table></TableScroll>
      </Card>

      {modalOpen && (
        <PessoaModal
          pessoa={editing}
          departamentos={departamentos}
          funcoes={funcoes}
          isAdmin={isAdmin}
          myDeptId={myDeptId}
          onClose={() => setModalOpen(false)}
          onSave={save}
        />
      )}
    </div>
  );
}

function PessoaModal({ pessoa, departamentos, funcoes, isAdmin, myDeptId, onClose, onSave }) {
  const [nome, setNome] = useState(pessoa.nome);
  const [contacto, setContacto] = useState(pessoa.contacto);
  const [disponibilidade, setDisponibilidade] = useState(pessoa.disponibilidade);
  const [atribuicoes, setAtribuicoes] = useState(pessoa.atribuicoes);

  const departamentosDisponiveis = isAdmin ? departamentos : departamentos.filter(d => d.id === myDeptId);

  function toggleDia(dia) {
    setDisponibilidade((cur) => cur.includes(dia) ? cur.filter(d => d !== dia) : [...cur, dia]);
  }
  function addAtribuicao() {
    setAtribuicoes((cur) => [...cur, { departamentoId: departamentosDisponiveis[0]?.id || "", funcaoIds: [] }]);
  }
  function updateAtribuicaoDept(idx, depId) {
    setAtribuicoes((cur) => cur.map((a, i) => i === idx ? { departamentoId: depId, funcaoIds: [] } : a));
  }
  function toggleFuncao(idx, funId) {
    setAtribuicoes((cur) => cur.map((a, i) => {
      if (i !== idx) return a;
      const has = a.funcaoIds.includes(funId);
      return { ...a, funcaoIds: has ? a.funcaoIds.filter(f => f !== funId) : [...a.funcaoIds, funId] };
    }));
  }
  function removeAtribuicao(idx) {
    setAtribuicoes((cur) => cur.filter((_, i) => i !== idx));
  }

  return (
    <Modal title={pessoa.id ? "Editar pessoa" : "Nova pessoa"} onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome"><TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" /></Field>
        <Field label="Contacto"><TextInput value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Telefone ou email" /></Field>

        <Field label="Disponibilidade (dias em que pode servir)">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DIAS_SEMANA.map((dia) => (
              <button
                key={dia}
                type="button"
                onClick={() => toggleDia(dia)}
                style={{
                  padding: "6px 11px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${disponibilidade.includes(dia) ? COLORS.comunidade : COLORS.border}`,
                  background: disponibilidade.includes(dia) ? COLORS.comunidade : "transparent",
                  color: disponibilidade.includes(dia) ? "#fff" : COLORS.textSoft
                }}
              >
                {dia}
              </button>
            ))}
          </div>
        </Field>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "0.82rem", color: COLORS.textSoft, fontWeight: 600 }}>Departamentos e funções</span>
            <Button variant="secondary" onClick={addAtribuicao} style={{ padding: "5px 10px", fontSize: "0.78rem" }}><Plus size={13} /> Adicionar</Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {atribuicoes.map((a, idx) => {
              const funcoesDoDept = funcoes.filter(f => f.departamentoId === a.departamentoId);
              return (
                <Card key={idx} style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <Select value={a.departamentoId} onChange={(e) => updateAtribuicaoDept(idx, e.target.value)} style={{ flex: 1 }}>
                      {departamentosDisponiveis.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                    </Select>
                    <button onClick={() => removeAtribuicao(idx)} style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer" }}><X size={16} /></button>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {funcoesDoDept.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFuncao(idx, f.id)}
                        style={{
                          padding: "5px 10px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                          border: `1.5px solid ${a.funcaoIds.includes(f.id) ? COLORS.valoresDark : COLORS.border}`,
                          background: a.funcaoIds.includes(f.id) ? COLORS.valores : "transparent",
                          color: a.funcaoIds.includes(f.id) ? "#1D2926" : COLORS.textSoft
                        }}
                      >
                        {f.nome}
                      </button>
                    ))}
                    {funcoesDoDept.length === 0 && <span style={{ fontSize: "0.78rem", color: COLORS.textSoft }}>Sem funções cadastradas neste departamento.</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!nome.trim()} onClick={() => onSave({ ...pessoa, nome, contacto, disponibilidade, atribuicoes })}>
            <Check size={16} /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

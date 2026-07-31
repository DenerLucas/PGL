import React, { useState, useMemo } from "react";
import { CalendarDays, Plus, Check, AlertTriangle, Trash2, Users, X } from "lucide-react";
import { Card, SectionTitle, Button, Pill, Modal, Field, TextInput, Select } from "../components/ui";
import { COLORS, PERIODOS, fmtDate, weekdayNameFromDateStr, userLabel, dayMonth, initials, avatarTone } from "../lib/constants";
import { useChurchData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

function groupSessions(escalas) {
  const map = new Map();
  escalas.forEach((e) => {
    const key = `${e.data}|${e.periodo}|${e.departamentoId}`;
    if (!map.has(key)) map.set(key, { key, data: e.data, periodo: e.periodo, departamentoId: e.departamentoId, itens: [] });
    map.get(key).itens.push(e);
  });
  return Array.from(map.values());
}

function Avatar({ nome, id, size = 30 }) {
  return (
    <div title={nome} style={{
      width: size, height: size, borderRadius: "50%", background: avatarTone(id),
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0, border: "2px solid #fff",
      boxShadow: "0 0 0 1px " + COLORS.border
    }}>
      {initials(nome)}
    </div>
  );
}

function SessionCard({ sessao, dep, onClick }) {
  const { day, month, diaSemana } = dayMonth(sessao.data);
  const visiveis = sessao.itens.slice(0, 6);
  const extra = sessao.itens.length - visiveis.length;

  return (
    <Card style={{ cursor: "pointer", padding: 0, overflow: "hidden" }} onClick={onClick}>
      <div style={{ display: "flex", gap: 14, padding: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, background: COLORS.info, flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#F3EFE3"
        }}>
          <div style={{ fontFamily: "'Lora', serif", fontSize: "1.35rem", lineHeight: 1 }}>{day}</div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{month}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontFamily: "'Lora', serif", color: COLORS.info, fontSize: "1.02rem" }}>{dep?.nome}</h3>
            <Pill tone="comunidade">{sessao.periodo}</Pill>
          </div>
          <div style={{ fontSize: "0.78rem", color: COLORS.textSoft, marginTop: 2 }}>{diaSemana} · {fmtDate(sessao.data)}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: `1px solid ${COLORS.border}`, background: "#FBF9F2" }}>
        <div style={{ display: "flex" }}>
          {visiveis.map((e, i) => (
            <div key={e.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
              <Avatar nome={e._pessoaNome} id={e.pessoaId} />
            </div>
          ))}
          {extra > 0 && (
            <div style={{
              marginLeft: -10, width: 30, height: 30, borderRadius: "50%", background: COLORS.missaoDark,
              color: COLORS.info, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.72rem", fontWeight: 700, border: "2px solid #fff"
            }}>
              +{extra}
            </div>
          )}
        </div>
        <div style={{ fontSize: "0.76rem", color: COLORS.textSoft, display: "flex", alignItems: "center", gap: 4 }}>
          <Users size={13} /> {sessao.itens.length}
        </div>
      </div>
    </Card>
  );
}

export default function Escalas() {
  const { profile } = useAuth();
  const { departamentos, funcoes, pessoas, escalas, escalasActions } = useChurchData();
  const [modalOpen, setModalOpen] = useState(false);
  const [sessaoAberta, setSessaoAberta] = useState(null); // key da sessão selecionada
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

  const sessoes = useMemo(() => {
    const enriched = visiveis.map(e => ({ ...e, _pessoaNome: pessoas.find(p => p.id === e.pessoaId)?.nome || "?" }));
    return groupSessions(enriched).sort((a, b) => a.data.localeCompare(b.data) || a.periodo.localeCompare(b.periodo));
  }, [visiveis, pessoas]);

  const sessaoSelecionada = sessoes.find(s => s.key === sessaoAberta) || null;

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

      {sessoes.length === 0 && (
        <Card><p style={{ textAlign: "center", color: COLORS.textSoft, margin: 0, padding: 12 }}>Nenhuma escala encontrada.</p></Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {sessoes.map((s) => (
          <SessionCard
            key={s.key}
            sessao={s}
            dep={departamentos.find(d => d.id === s.departamentoId)}
            onClick={() => setSessaoAberta(s.key)}
          />
        ))}
      </div>

      {modalOpen && (
        <EscalaModal
          departamentos={departamentos} funcoes={funcoes} pessoas={pessoas} escalas={escalas}
          isAdmin={isAdmin} myDeptId={myDeptId}
          onClose={() => setModalOpen(false)}
          onSave={addEscala}
        />
      )}

      {sessaoSelecionada && (
        <SessaoDetalheModal
          sessao={sessaoSelecionada}
          dep={departamentos.find(d => d.id === sessaoSelecionada.departamentoId)}
          funcoes={funcoes}
          pessoas={pessoas}
          escalas={escalas}
          canManage={canManage}
          isAdmin={isAdmin}
          onClose={() => setSessaoAberta(null)}
          onRemove={removeEscala}
          onAdd={addEscala}
        />
      )}
    </div>
  );
}

function SessaoDetalheModal({ sessao, dep, funcoes, pessoas, escalas, canManage, isAdmin, onClose, onRemove, onAdd }) {
  const [addOpen, setAddOpen] = useState(false);
  const { day, month, diaSemana } = dayMonth(sessao.data);

  return (
    <Modal title="Detalhes da escala" onClose={onClose} wide>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 12, background: COLORS.info, flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#F3EFE3"
        }}>
          <div style={{ fontFamily: "'Lora', serif", fontSize: "1.4rem", lineHeight: 1 }}>{day}</div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{month}</div>
        </div>
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Lora', serif", color: COLORS.info, fontSize: "1.15rem" }}>{dep?.nome}</h3>
          <div style={{ fontSize: "0.82rem", color: COLORS.textSoft }}>{diaSemana} · {fmtDate(sessao.data)} <Pill tone="comunidade">{sessao.periodo}</Pill></div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: "0.82rem", color: COLORS.textSoft, fontWeight: 600 }}>Participantes ({sessao.itens.length})</span>
        {canManage && <Button variant="secondary" onClick={() => setAddOpen(true)} style={{ padding: "5px 10px", fontSize: "0.78rem" }}><Plus size={13} /> Adicionar pessoa</Button>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sessao.itens.map((e) => {
          const pessoa = pessoas.find(p => p.id === e.pessoaId);
          const fun = funcoes.find(f => f.id === e.funcaoId);
          return (
            <Card key={e.id} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar nome={pessoa?.nome} id={e.pessoaId} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{pessoa?.nome}</div>
                <div style={{ fontSize: "0.76rem", color: COLORS.textSoft }}>{fun?.nome}</div>
              </div>
              {canManage && (
                <button onClick={() => onRemove(e)} style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer" }}>
                  <Trash2 size={15} />
                </button>
              )}
            </Card>
          );
        })}
        {sessao.itens.length === 0 && <p style={{ color: COLORS.textSoft, fontSize: "0.85rem" }}>Sem participantes.</p>}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      </div>

      {addOpen && (
        <AdicionarParticipanteModal
          sessao={sessao} funcoes={funcoes} pessoas={pessoas} escalas={escalas}
          onClose={() => setAddOpen(false)}
          onSave={async (payload) => { await onAdd(payload); setAddOpen(false); }}
        />
      )}
    </Modal>
  );
}

function AdicionarParticipanteModal({ sessao, funcoes, pessoas, escalas, onClose, onSave }) {
  const funcoesDoDept = funcoes.filter(f => f.departamentoId === sessao.departamentoId);
  const pessoasDoDept = pessoas.filter(p => p.atribuicoes.some(a => a.departamentoId === sessao.departamentoId));
  const jaEscalados = new Set(sessao.itens.map(e => e.pessoaId));

  const [funcaoId, setFuncaoId] = useState("");
  const [pessoaId, setPessoaId] = useState("");

  const conflitos = useMemo(() => {
    if (!pessoaId) return [];
    const avisos = [];
    const outraEscala = escalas.find(e => e.pessoaId === pessoaId && e.data === sessao.data && e.periodo === sessao.periodo && e.departamentoId !== sessao.departamentoId);
    if (outraEscala) avisos.push("Esta pessoa já está escalada noutro departamento nesta mesma data/período.");
    const pessoa = pessoas.find(p => p.id === pessoaId);
    const diaSemana = weekdayNameFromDateStr(sessao.data);
    if (pessoa && pessoa.disponibilidade.length > 0 && diaSemana && !pessoa.disponibilidade.includes(diaSemana)) {
      avisos.push(`Esta pessoa indicou não ter disponibilidade às ${diaSemana}s.`);
    }
    return avisos;
  }, [pessoaId, sessao, escalas, pessoas]);

  const podeGuardar = funcaoId && pessoaId;

  return (
    <Modal title="Adicionar pessoa a esta escala" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Função">
          <Select value={funcaoId} onChange={(e) => setFuncaoId(e.target.value)}>
            <option value="">Selecionar...</option>
            {funcoesDoDept.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </Select>
        </Field>
        <Field label="Pessoa">
          <Select value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}>
            <option value="">Selecionar...</option>
            {pessoasDoDept.map((p) => (
              <option key={p.id} value={p.id} disabled={jaEscalados.has(p.id)}>
                {p.nome}{jaEscalados.has(p.id) ? " (já escalado nesta sessão)" : ""}
              </option>
            ))}
          </Select>
        </Field>

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
          <Button disabled={!podeGuardar} onClick={() => onSave({ departamentoId: sessao.departamentoId, funcaoId, pessoaId, data: sessao.data, periodo: sessao.periodo })}>
            <Check size={16} /> Adicionar
          </Button>
        </div>
      </div>
    </Modal>
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

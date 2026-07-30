import React, { useState, useEffect, useCallback } from "react";
import { UserCog, Plus, Trash2, Check } from "lucide-react";
import { Card, SectionTitle, Button, Pill, Modal, Field, TextInput, Select } from "../components/ui";
import { COLORS, userLabel } from "../lib/constants";
import { supabase } from "../lib/supabaseClient";
import { useChurchData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function Utilizadores() {
  const { profile } = useAuth();
  const { departamentos, addLog } = useChurchData();
  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const currentUserName = userLabel(profile, departamentos);

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("perfis").select("*").order("created_at", { ascending: true });
    if (!error) setPerfis(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function criarPerfil(novo) {
    const { error } = await supabase.from("perfis").insert({
      id: novo.uid,
      nome: novo.nome,
      papel: novo.papel,
      departamento_id: novo.papel === "admin" ? null : novo.departamentoId,
    });
    if (error) {
      alert("Erro ao criar perfil: " + error.message + "\n\nConfirma que o UID está correto e que ainda não tem perfil atribuído.");
      return;
    }
    addLog(currentUserName, `Deu acesso a "${novo.nome}" como ${novo.papel}.`);
    setModalOpen(false);
    carregar();
  }

  async function removerPerfil(p) {
    if (!confirm(`Remover o acesso de "${p.nome}" à plataforma? A conta de login não é apagada, só deixa de conseguir entrar.`)) return;
    const { error } = await supabase.from("perfis").delete().eq("id", p.id);
    if (error) { alert("Erro: " + error.message); return; }
    addLog(currentUserName, `Removeu o acesso de "${p.nome}".`);
    carregar();
  }

  return (
    <div>
      <SectionTitle
        icon={UserCog}
        title="Utilizadores"
        subtitle="Atribui papel e departamento às contas criadas no Supabase"
        action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Atribuir acesso</Button>}
      />

      <Card style={{ marginBottom: 16, background: COLORS.missaoDark, border: "none" }}>
        <p style={{ margin: 0, fontSize: "0.84rem", color: COLORS.text }}>
          Para dar acesso a alguém: primeiro cria a conta em <strong>Supabase → Authentication → Users → Add user</strong>
          (define email e password), depois copia o <strong>User UID</strong> gerado e cola-o aqui, junto com o nome, papel e departamento da pessoa.
        </p>
      </Card>

      <Card>
        <table>
          <thead><tr><th>Nome</th><th>Papel</th><th>Departamento</th><th></th></tr></thead>
          <tbody>
            {perfis.map((p) => {
              const dep = departamentos.find(d => d.id === p.departamento_id);
              const tone = p.papel === "admin" ? "info" : p.papel === "lider" ? "comunidade" : "valores";
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nome}</td>
                  <td><Pill tone={tone}>{p.papel}</Pill></td>
                  <td>{dep?.nome || "—"}</td>
                  <td>
                    {p.id !== profile.id && (
                      <button onClick={() => removerPerfil(p)} style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer" }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && perfis.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", color: COLORS.textSoft, padding: 20 }}>Nenhum utilizador atribuído ainda.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <NovoUtilizadorModal departamentos={departamentos} onClose={() => setModalOpen(false)} onSave={criarPerfil} />
      )}
    </div>
  );
}

function NovoUtilizadorModal({ departamentos, onClose, onSave }) {
  const [uid, setUid] = useState("");
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState("lider");
  const [departamentoId, setDepartamentoId] = useState(departamentos[0]?.id || "");

  const podeGuardar = uid.trim().length > 10 && nome.trim() && papel && (papel === "admin" || departamentoId);

  return (
    <Modal title="Atribuir acesso a um utilizador" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="User UID (copiado do Supabase → Authentication → Users)">
          <TextInput value={uid} onChange={(e) => setUid(e.target.value)} placeholder="Ex: 8f2c1a9e-4b3d-4a5e-9c1a-2b3c4d5e6f7a" />
        </Field>
        <Field label="Nome da pessoa">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
        </Field>
        <Field label="Papel">
          <Select value={papel} onChange={(e) => setPapel(e.target.value)}>
            <option value="admin">Administrador</option>
            <option value="lider">Líder de departamento</option>
            <option value="membro">Voluntário / Membro</option>
          </Select>
        </Field>
        {papel !== "admin" && (
          <Field label="Departamento">
            <Select value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
              {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </Select>
          </Field>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!podeGuardar} onClick={() => onSave({ uid: uid.trim(), nome, papel, departamentoId })}>
            <Check size={16} /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

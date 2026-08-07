import React, { useState, useEffect, useCallback } from "react";
import { UserCog, Plus, Trash2, Check, RefreshCw, Copy } from "lucide-react";
import { Card, SectionTitle, Button, Pill, Modal, Field, TextInput, Select } from "../components/ui";
import { COLORS, userLabel } from "../lib/constants";
import { supabase } from "../lib/supabaseClient";
import { criarUtilizador, gerarPasswordAleatoria } from "../lib/adminApi";
import { useChurchData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function Utilizadores() {
  const { profile } = useAuth();
  const { departamentos, pessoas, addLog } = useChurchData();
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
        subtitle="Cria contas de login e atribui papel/departamento — tudo pela app"
        action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Criar utilizador</Button>}
      />

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
              <tr><td colSpan={4} style={{ textAlign: "center", color: COLORS.textSoft, padding: 20 }}>Nenhum utilizador ainda.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <NovoUtilizadorModal
          departamentos={departamentos}
          pessoas={pessoas}
          onClose={() => setModalOpen(false)}
          onCreated={(nome) => { addLog(currentUserName, `Criou o acesso de "${nome}".`); carregar(); }}
        />
      )}
    </div>
  );
}

function NovoUtilizadorModal({ departamentos, pessoas, onClose, onCreated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(gerarPasswordAleatoria());
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState("membro");
  const [departamentoId, setDepartamentoId] = useState(departamentos[0]?.id || "");
  const [pessoaId, setPessoaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(null); // { email, password }

  const pessoasDoDept = pessoas.filter(p => p.atribuicoes.some(a => a.departamentoId === departamentoId));
  const podeGuardar = email.trim() && password.length >= 6 && nome.trim() && papel && (papel === "admin" || departamentoId);

  async function handleSubmit() {
    setErro("");
    setLoading(true);
    try {
      await criarUtilizador({ email: email.trim(), password, nome: nome.trim(), papel, departamentoId, pessoaId: pessoaId || null });
      setSucesso({ email: email.trim(), password });
      onCreated(nome.trim());
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copiarCredenciais() {
    const texto = `Acesso à plataforma CCEA Famalicão\nEmail: ${sucesso.email}\nPassword: ${sucesso.password}`;
    navigator.clipboard?.writeText(texto);
  }

  if (sucesso) {
    return (
      <Modal title="Utilizador criado" onClose={onClose}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, color: COLORS.text, fontSize: "0.88rem" }}>
            Conta criada com sucesso. Partilha estas credenciais com a pessoa (ela pode mudar a password depois de entrar):
          </p>
          <Card style={{ background: COLORS.missaoDark, border: "none" }}>
            <div style={{ fontSize: "0.85rem", marginBottom: 6 }}><strong>Email:</strong> {sucesso.email}</div>
            <div style={{ fontSize: "0.85rem" }}><strong>Password:</strong> {sucesso.password}</div>
          </Card>
          <Button variant="secondary" onClick={copiarCredenciais}><Copy size={14} /> Copiar credenciais</Button>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Criar utilizador" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome da pessoa">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
        </Field>
        <Field label="Email de login (real, para poder recuperar password)">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@exemplo.com" />
        </Field>
        <Field label="Password inicial (a pessoa pode mudar depois)">
          <div style={{ display: "flex", gap: 8 }}>
            <TextInput value={password} onChange={(e) => setPassword(e.target.value)} style={{ flex: 1 }} />
            <Button variant="secondary" onClick={() => setPassword(gerarPasswordAleatoria())} style={{ padding: "9px 11px" }}>
              <RefreshCw size={15} />
            </Button>
          </div>
        </Field>
        <Field label="Papel">
          <Select value={papel} onChange={(e) => setPapel(e.target.value)}>
            <option value="admin">Administrador</option>
            <option value="lider">Líder de departamento</option>
            <option value="membro">Voluntário / Membro</option>
          </Select>
        </Field>
        {papel !== "admin" && (
          <>
            <Field label="Departamento">
              <Select value={departamentoId} onChange={(e) => { setDepartamentoId(e.target.value); setPessoaId(""); }}>
                {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </Select>
            </Field>
            <Field label="Ligar a uma pessoa da escala (opcional, mas necessário para o membro ver só a própria escala)">
              <Select value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}>
                <option value="">Não ligar a ninguém em "Pessoas"</option>
                {pessoasDoDept.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </Select>
            </Field>
          </>
        )}

        {erro && (
          <div style={{ background: "#F3DAD2", color: "#8A3A28", borderRadius: 8, padding: "8px 12px", fontSize: "0.82rem" }}>{erro}</div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!podeGuardar || loading} onClick={handleSubmit}>
            <Check size={16} /> {loading ? "A criar..." : "Criar utilizador"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

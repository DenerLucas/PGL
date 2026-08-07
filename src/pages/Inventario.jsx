import React, { useState } from "react";
import { Package, Plus, Check, Trash2 } from "lucide-react";
import { Card, SectionTitle, Button, Pill, Modal, Field, TextInput, Select, TableScroll } from "../components/ui";
import { COLORS, userLabel } from "../lib/constants";
import { useChurchData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function Inventario() {
  const { profile } = useAuth();
  const { departamentos, inventario, inventarioActions } = useChurchData();
  const [modalOpen, setModalOpen] = useState(false);

  const isAdmin = profile.papel === "admin";
  const isLider = profile.papel === "lider";
  const myDeptId = profile.departamentoId;
  const canManage = isAdmin || isLider;
  const currentUserName = userLabel(profile, departamentos);

  async function save(item) {
    if (item.id) {
      await inventarioActions.update(item.id, item, currentUserName, `Editou o item de inventário "${item.nome}".`);
    } else {
      await inventarioActions.create(item, currentUserName, `Cadastrou o item de inventário "${item.nome}".`);
    }
    setModalOpen(false);
  }

  async function remove(item) {
    await inventarioActions.remove(item.id, currentUserName, `Removeu o item "${item.nome}" do inventário.`);
  }

  const visiveis = isAdmin ? inventario : inventario.filter(i => i.departamentoId === myDeptId);
  const departamentosDisponiveis = isAdmin ? departamentos : departamentos.filter(d => d.id === myDeptId);

  return (
    <div>
      <SectionTitle
        icon={Package}
        title="Inventário"
        subtitle="Itens por departamento — equipamentos não são partilhados entre departamentos"
        action={canManage && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Novo item</Button>}
      />
      <Card>
        <TableScroll><table>
          <thead>
            <tr><th>Item</th><th>Departamento</th><th>Localização</th><th>Estado</th>{canManage && <th></th>}</tr>
          </thead>
          <tbody>
            {visiveis.map((i) => {
              const dep = departamentos.find(d => d.id === i.departamentoId);
              const tone = i.estado >= 4 ? "ok" : i.estado === 3 ? "warn" : "danger";
              return (
                <tr key={i.id}>
                  <td style={{ fontWeight: 600 }}>{i.nome}</td>
                  <td>{dep?.nome}</td>
                  <td style={{ color: COLORS.textSoft }}>{i.localizacao || "—"}</td>
                  <td><Pill tone={tone}>{i.estado} / 5</Pill></td>
                  {canManage && (
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button variant="secondary" style={{ padding: "6px 10px" }} onClick={() => setModalOpen({ edit: i })}>Editar</Button>
                        <Button variant="danger" style={{ padding: "6px 8px" }} onClick={() => remove(i)}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {visiveis.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: COLORS.textSoft, padding: 20 }}>Sem itens registados.</td></tr>}
          </tbody>
        </table></TableScroll>
      </Card>

      {modalOpen && (
        <ItemModal
          item={typeof modalOpen === "object" ? modalOpen.edit : { id: null, nome: "", departamentoId: departamentosDisponiveis[0]?.id || "", localizacao: "", estado: 5 }}
          departamentos={departamentosDisponiveis}
          onClose={() => setModalOpen(false)}
          onSave={save}
        />
      )}
    </div>
  );
}

function ItemModal({ item, departamentos, onClose, onSave }) {
  const [nome, setNome] = useState(item.nome);
  const [departamentoId, setDepartamentoId] = useState(item.departamentoId);
  const [localizacao, setLocalizacao] = useState(item.localizacao);
  const [estado, setEstado] = useState(item.estado);

  return (
    <Modal title={item.id ? "Editar item" : "Novo item de inventário"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome do item"><TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Microfone sem fio" /></Field>
        <Field label="Departamento">
          <Select value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
            {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </Select>
        </Field>
        <Field label="Localização"><TextInput value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} placeholder="Ex: Armário do salão" /></Field>
        <Field label={`Estado de conservação: ${estado} / 5`}>
          <input type="range" min={1} max={5} value={estado} onChange={(e) => setEstado(Number(e.target.value))} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!nome.trim()} onClick={() => onSave({ ...item, nome, departamentoId, localizacao, estado })}><Check size={16} /> Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}

import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, Shield, CalendarDays, Package,
  Wallet, FileBarChart, ScrollText, UserCog, KeyRound, LogOut, X
} from "lucide-react";
import { COLORS, userLabel } from "../lib/constants";
import { useAuth } from "../context/AuthContext";
import { useChurchData } from "../context/DataContext";
import { Modal, Field, TextInput, Button } from "./ui";

const NAV_ITEMS = [
  { path: "/", label: "Painel", icon: LayoutDashboard, roles: ["admin", "lider", "membro"] },
  { path: "/pessoas", label: "Pessoas", icon: Users, roles: ["admin", "lider", "membro"] },
  { path: "/departamentos", label: "Departamentos", icon: Building2, roles: ["admin"] },
  { path: "/funcoes", label: "Funções", icon: Shield, roles: ["admin"] },
  { path: "/escalas", label: "Escalas", icon: CalendarDays, roles: ["admin", "lider", "membro"] },
  { path: "/inventario", label: "Inventário", icon: Package, roles: ["admin", "lider", "membro"] },
  { path: "/gastos", label: "Gastos", icon: Wallet, roles: ["admin", "lider"] },
  { path: "/relatorios", label: "Relatórios", icon: FileBarChart, roles: ["admin", "lider"] },
  { path: "/auditoria", label: "Log de auditoria", icon: ScrollText, roles: ["admin"] },
  { path: "/utilizadores", label: "Utilizadores", icon: UserCog, roles: ["admin"] },
];

export default function Sidebar({ open, onNavigate }) {
  const { profile, signOut } = useAuth();
  const { departamentos } = useChurchData();
  const [pwdModalOpen, setPwdModalOpen] = useState(false);

  const currentUserName = userLabel(profile, departamentos);
  const items = NAV_ITEMS.filter((n) => n.roles.includes(profile.papel));

  return (
    <div className={`sidebar${open ? " open" : ""}`} style={{
      width: 232, background: COLORS.info, padding: "22px 14px", display: "flex", flexDirection: "column",
      gap: 4, flexShrink: 0, minHeight: "100vh"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo-ccea.png" alt="CCEA Famalicão" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />
          <div>
            <div style={{ color: "#F3EFE3", fontFamily: "'Lora', serif", fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.1 }}>CCEA Famalicão</div>
            <div style={{ color: COLORS.valores, fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.04em" }}>DEPARTAMENTOS</div>
          </div>
        </div>
        <button
          onClick={onNavigate}
          className="sidebar-close-btn"
          style={{ background: "none", border: "none", color: "#F3EFE3", cursor: "pointer", padding: 4 }}
        >
          <X size={20} />
        </button>
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={onNavigate}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9,
              textDecoration: "none", fontSize: "0.87rem", fontWeight: 600,
              background: isActive ? COLORS.comunidade : "transparent",
              color: isActive ? "#FFFFFF" : "#CFE0DA",
            })}
          >
            <Icon size={17} /> {item.label}
          </NavLink>
        );
      })}

      <div style={{ flex: 1 }} />
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 14, marginTop: 10,
        display: "flex", flexDirection: "column", gap: 8
      }}>
        <div style={{ color: "#F3EFE3", fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.3 }}>{currentUserName}</div>
        <button
          onClick={() => setPwdModalOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: COLORS.valores, fontSize: "0.78rem", cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "inherit" }}
        >
          <KeyRound size={13} /> Mudar password
        </button>
        <button
          onClick={signOut}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#E7B9AC", fontSize: "0.78rem", cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "inherit" }}
        >
          <LogOut size={13} /> Sair
        </button>
      </div>

      {pwdModalOpen && <ChangePasswordModal onClose={() => setPwdModalOpen(false)} />}
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const { changePassword } = useAuth();
  const [novaPassword, setNovaPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setErro("");
    if (novaPassword.length < 6) { setErro("A password deve ter pelo menos 6 caracteres."); return; }
    if (novaPassword !== confirmar) { setErro("As passwords não coincidem."); return; }
    setLoading(true);
    try {
      await changePassword(novaPassword);
      setSucesso(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Mudar password" onClose={onClose}>
      {sucesso ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, color: COLORS.text, fontSize: "0.88rem" }}>Password atualizada com sucesso.</p>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nova password">
            <TextInput type="password" value={novaPassword} onChange={(e) => setNovaPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </Field>
          <Field label="Confirmar nova password">
            <TextInput type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          </Field>
          {erro && (
            <div style={{ background: "#F3DAD2", color: "#8A3A28", borderRadius: 8, padding: "8px 12px", fontSize: "0.82rem" }}>{erro}</div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button disabled={loading || !novaPassword || !confirmar} onClick={handleSave}>{loading ? "A guardar..." : "Guardar"}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, Shield, CalendarDays, Package,
  Wallet, FileBarChart, ScrollText, Cross
} from "lucide-react";
import { COLORS } from "../lib/constants";
import { useSession } from "../context/SessionContext";
import { useChurchData } from "../context/DataContext";

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
];

export default function Sidebar() {
  const { session, setSession } = useSession();
  const { departamentos } = useChurchData();

  const currentUserName = session.papel === "admin"
    ? "Dener (Administrador)"
    : `${session.papel === "lider" ? "Líder" : "Membro"} — ${departamentos.find(d => d.id === session.departamentoId)?.nome || ""}`;

  const items = NAV_ITEMS.filter((n) => n.roles.includes(session.papel));

  return (
    <div style={{
      width: 232, background: COLORS.info, padding: "22px 14px", display: "flex", flexDirection: "column",
      gap: 4, flexShrink: 0, minHeight: "100vh"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 22 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%", background: COLORS.valores,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <Cross size={18} color={COLORS.infoDark} />
        </div>
        <div>
          <div style={{ color: "#F3EFE3", fontFamily: "'Lora', serif", fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.1 }}>CCEA Famalicão</div>
          <div style={{ color: COLORS.valores, fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.04em" }}>DEPARTAMENTOS</div>
        </div>
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
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
        display: "flex", flexDirection: "column", gap: 6
      }}>
        <div style={{ color: "#F3EFE3", fontSize: "0.8rem", fontWeight: 600 }}>{currentUserName}</div>
        <button
          onClick={() => setSession(null)}
          style={{ background: "none", border: "none", color: COLORS.valores, fontSize: "0.78rem", cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "inherit" }}
        >
          Trocar utilizador
        </button>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { DataProvider } from "./context/DataContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { COLORS } from "./lib/constants";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pessoas from "./pages/Pessoas";
import Departamentos from "./pages/Departamentos";
import Funcoes from "./pages/Funcoes";
import Escalas from "./pages/Escalas";
import Inventario from "./pages/Inventario";
import Gastos from "./pages/Gastos";
import Relatorios from "./pages/Relatorios";
import Auditoria from "./pages/Auditoria";
import Utilizadores from "./pages/Utilizadores";

function CenteredMessage({ color, children }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: COLORS.missao, color: color || COLORS.info, fontFamily: "'Inter', sans-serif",
      padding: 24, textAlign: "center"
    }}>
      {children}
    </div>
  );
}

function RequireRole({ roles, children }) {
  const { profile } = useAuth();
  if (!roles.includes(profile.papel)) return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  const { authUser, profile, loading, error, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <CenteredMessage>A verificar sessão...</CenteredMessage>;
  if (!authUser) return <Login />;

  if (error === "SEM_PERFIL") {
    return (
      <CenteredMessage color={COLORS.danger}>
        <div>
          <p>A tua conta ainda não tem um perfil atribuído nesta plataforma.</p>
          <p style={{ color: COLORS.textSoft, fontSize: "0.85rem" }}>Pede ao Administrador para te atribuir um papel e departamento na página "Utilizadores".</p>
          <button onClick={signOut} style={{ marginTop: 12, background: "none", border: `1.5px solid ${COLORS.info}`, color: COLORS.info, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600 }}>
            Sair
          </button>
        </div>
      </CenteredMessage>
    );
  }

  if (error) return <CenteredMessage color={COLORS.danger}>Erro: {error}</CenteredMessage>;
  if (!profile) return <CenteredMessage>A carregar perfil...</CenteredMessage>;

  return (
    <DataProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: COLORS.missao, fontFamily: "'Inter', system-ui, sans-serif", color: COLORS.text, position: "relative", maxWidth: "100vw", overflowX: "hidden" }}>
        <style>{`
          * { box-sizing: border-box; }
          html, body { overflow-x: hidden; max-width: 100vw; }
          table { border-collapse: collapse; width: 100%; }
          th { text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${COLORS.textSoft}; padding: 8px 10px; border-bottom: 2px solid ${COLORS.border}; white-space: nowrap; }
          td { padding: 10px 10px; border-bottom: 1px solid ${COLORS.border}; font-size: 0.87rem; vertical-align: middle; white-space: nowrap; }
          tr:last-child td { border-bottom: none; }

          .menu-toggle-btn { display: none; }
          .sidebar-overlay { display: none; }
          .sidebar-close-btn { display: none; }

          @media (max-width: 860px) {
            .sidebar {
              position: fixed; top: 0; left: 0; z-index: 50;
              height: 100vh; height: 100dvh; min-height: 0;
              overflow-y: auto;
              transform: translateX(-100%); transition: transform 0.22s ease;
            }
            .sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(14,43,42,0.25); }
            .sidebar-overlay {
              display: block; position: fixed; inset: 0; background: rgba(14,43,42,0.45);
              z-index: 45; opacity: 0; pointer-events: none; transition: opacity 0.22s ease;
            }
            .sidebar-overlay.open { opacity: 1; pointer-events: auto; }
            .menu-toggle-btn {
              display: flex; position: sticky; top: 0; z-index: 20;
            }
            .sidebar-close-btn { display: flex; }
            .main-content { padding: 16px !important; }
          }

          @media (max-width: 480px) {
            .card-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        <div className={`sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

        <div className="main-content" style={{ flex: 1, padding: "28px 32px", overflowY: "auto", minWidth: 0 }}>
          <button
            className="menu-toggle-btn"
            onClick={() => setSidebarOpen(true)}
            style={{
              alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16,
              background: COLORS.info, color: "#F3EFE3", border: "none", borderRadius: 9,
              padding: "9px 14px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
            }}
          >
            <Menu size={17} /> Menu
          </button>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pessoas" element={<Pessoas />} />
            <Route path="/departamentos" element={<RequireRole roles={["admin"]}><Departamentos /></RequireRole>} />
            <Route path="/funcoes" element={<RequireRole roles={["admin"]}><Funcoes /></RequireRole>} />
            <Route path="/escalas" element={<Escalas />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/gastos" element={<RequireRole roles={["admin", "lider"]}><Gastos /></RequireRole>} />
            <Route path="/relatorios" element={<RequireRole roles={["admin", "lider"]}><Relatorios /></RequireRole>} />
            <Route path="/auditoria" element={<RequireRole roles={["admin"]}><Auditoria /></RequireRole>} />
            <Route path="/utilizadores" element={<RequireRole roles={["admin"]}><Utilizadores /></RequireRole>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </DataProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}

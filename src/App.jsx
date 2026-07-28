import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider, useChurchData } from "./context/DataContext";
import { SessionProvider, useSession } from "./context/SessionContext";
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

function RequireRole({ roles, children }) {
  const { session } = useSession();
  if (!roles.includes(session.papel)) return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  const { session } = useSession();
  const { loading, error } = useChurchData();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: COLORS.missao, color: COLORS.info, fontFamily: "'Inter', sans-serif"
      }}>
        A carregar dados da plataforma...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: COLORS.missao, color: COLORS.danger, fontFamily: "'Inter', sans-serif", padding: 24, textAlign: "center"
      }}>
        Erro ao ligar ao Supabase: {error}. Verifica as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.missao, fontFamily: "'Inter', system-ui, sans-serif", color: COLORS.text }}>
      <style>{`
        * { box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; }
        th { text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${COLORS.textSoft}; padding: 8px 10px; border-bottom: 2px solid ${COLORS.border}; }
        td { padding: 10px 10px; border-bottom: 1px solid ${COLORS.border}; font-size: 0.87rem; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <DataProvider>
          <Shell />
        </DataProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}

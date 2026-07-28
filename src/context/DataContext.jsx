import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  departamentosApi, funcoesApi, pessoasApi, escalasApi, inventarioApi, gastosApi, logsApi, TABLES
} from "../lib/api";

const DataContext = createContext(null);

const apiByTable = {
  departamentos: departamentosApi,
  funcoes: funcoesApi,
  pessoas: pessoasApi,
  escalas: escalasApi,
  inventario: inventarioApi,
  gastos: gastosApi,
};

export function DataProvider({ children }) {
  const [state, setState] = useState({
    departamentos: [], funcoes: [], pessoas: [], escalas: [], inventario: [], gastos: [], logs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const refetchTable = useCallback(async (table) => {
    try {
      if (table === "logs") {
        const rows = await logsApi.list();
        if (mounted.current) setState((s) => ({ ...s, logs: rows }));
      } else {
        const rows = await apiByTable[table].list();
        if (mounted.current) setState((s) => ({ ...s, [table]: rows }));
      }
    } catch (e) {
      console.error(`Erro ao carregar "${table}"`, e);
      setError(e.message || String(e));
    }
  }, []);

  const refetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all(TABLES.map((t) => refetchTable(t)));
    setLoading(false);
  }, [refetchTable]);

  useEffect(() => {
    mounted.current = true;
    refetchAll();

    // Subscrição em tempo real: se outra pessoa (ex: o avaliador) alterar
    // dados noutra aba/dispositivo, esta app atualiza-se sozinha.
    const channel = supabase.channel("ccea-realtime-changes");
    TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => refetchTable(table)
      );
    });
    channel.subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [refetchAll, refetchTable]);

  const addLog = useCallback(async (quem, acao) => {
    try {
      await logsApi.create(quem, acao);
      refetchTable("logs");
    } catch (e) {
      console.error("Erro ao gravar log", e);
    }
  }, [refetchTable]);

  // --- CRUD genérico por entidade, com log automático ---
  function makeActions(table, labelSingular) {
    return {
      async create(obj, quem, descricao) {
        const created = await apiByTable[table].create(obj);
        await refetchTable(table);
        if (quem) addLog(quem, descricao || `Cadastrou ${labelSingular}.`);
        return created;
      },
      async update(id, obj, quem, descricao) {
        const updated = await apiByTable[table].update(id, obj);
        await refetchTable(table);
        if (quem) addLog(quem, descricao || `Editou ${labelSingular}.`);
        return updated;
      },
      async remove(id, quem, descricao) {
        await apiByTable[table].remove(id);
        await refetchTable(table);
        if (quem) addLog(quem, descricao || `Removeu ${labelSingular}.`);
      },
    };
  }

  const value = {
    ...state,
    loading,
    error,
    refetchAll,
    addLog,
    departamentosActions: makeActions("departamentos", "um departamento"),
    funcoesActions: makeActions("funcoes", "uma função"),
    pessoasActions: makeActions("pessoas", "uma pessoa"),
    escalasActions: makeActions("escalas", "uma escala"),
    inventarioActions: makeActions("inventario", "um item de inventário"),
    gastosActions: makeActions("gastos", "um gasto"),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useChurchData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useChurchData deve ser usado dentro de <DataProvider>");
  return ctx;
}

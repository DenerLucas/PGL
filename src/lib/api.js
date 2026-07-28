import { supabase } from "./supabaseClient";

// Converte colunas snake_case da base de dados para camelCase usado na UI
function fromRow(row) {
  if (!row) return row;
  const { departamento_id, funcao_id, pessoa_id, ...rest } = row;
  return {
    ...rest,
    ...(departamento_id !== undefined ? { departamentoId: departamento_id } : {}),
    ...(funcao_id !== undefined ? { funcaoId: funcao_id } : {}),
    ...(pessoa_id !== undefined ? { pessoaId: pessoa_id } : {}),
  };
}

// Converte objetos camelCase da UI de volta para snake_case da base de dados
function toRow(obj) {
  const { departamentoId, funcaoId, pessoaId, id, created_at, ...rest } = obj;
  return {
    ...rest,
    ...(departamentoId !== undefined ? { departamento_id: departamentoId } : {}),
    ...(funcaoId !== undefined ? { funcao_id: funcaoId } : {}),
    ...(pessoaId !== undefined ? { pessoa_id: pessoaId } : {}),
  };
}

function makeEntityApi(table) {
  return {
    async list() {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(fromRow);
    },
    async create(obj) {
      const { data, error } = await supabase.from(table).insert(toRow(obj)).select().single();
      if (error) throw error;
      return fromRow(data);
    },
    async update(id, obj) {
      const { data, error } = await supabase.from(table).update(toRow(obj)).eq("id", id).select().single();
      if (error) throw error;
      return fromRow(data);
    },
    async remove(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
  };
}

export const departamentosApi = makeEntityApi("departamentos");
export const funcoesApi = makeEntityApi("funcoes");
export const pessoasApi = makeEntityApi("pessoas");
export const escalasApi = makeEntityApi("escalas");
export const inventarioApi = makeEntityApi("inventario");
export const gastosApi = makeEntityApi("gastos");

export const logsApi = {
  async list() {
    const { data, error } = await supabase.from("logs").select("*").order("quando", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async create(quem, acao) {
    const { error } = await supabase.from("logs").insert({ quem, acao });
    if (error) throw error;
  },
};

export const TABLES = ["departamentos", "funcoes", "pessoas", "escalas", "inventario", "gastos", "logs"];

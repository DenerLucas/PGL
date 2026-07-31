export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const PERIODOS = ["Manhã", "Tarde", "Noite"];
export const CATEGORIAS_GASTO = ["Manutenção", "Evento", "Material", "Outro"];

export const COLORS = {
  info: "#173F3E",
  infoDark: "#0E2B2A",
  comunidade: "#2F7A73",
  valores: "#93AD87",
  valoresDark: "#6F8E64",
  missao: "#F3EFE3",
  missaoDark: "#E7E0CC",
  card: "#FFFFFF",
  text: "#1D2926",
  textSoft: "#54615C",
  border: "#E1DCC9",
  danger: "#B4543C",
};

export function weekdayNameFromDateStr(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return DIAS_SEMANA[d.getDay()];
}

export function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-PT") + " " + d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export function fmtMoney(v) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(Number(v) || 0);
}

export const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function dayMonth(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return { day: d.getDate(), month: MESES_ABREV[d.getMonth()], diaSemana: DIAS_SEMANA[d.getDay()] };
}

export function initials(nome) {
  if (!nome) return "?";
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const AVATAR_TONES = ["#173F3E", "#2F7A73", "#93AD87", "#B4543C", "#7A4E12", "#54615C"];
export function avatarTone(id) {
  let hash = 0;
  for (let i = 0; i < (id || "").length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}
export function userLabel(profile, departamentos) {
  if (!profile) return "";
  const papelLabel = profile.papel === "admin" ? "Administrador" : profile.papel === "lider" ? "Líder" : "Membro";
  const dep = departamentos.find((d) => d.id === profile.departamentoId)?.nome;
  return dep ? `${profile.nome} (${papelLabel} — ${dep})` : `${profile.nome} (${papelLabel})`;
}

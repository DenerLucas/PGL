import React from "react";
import { X } from "lucide-react";
import { COLORS } from "../lib/constants";

export function Pill({ children, tone = "info" }) {
  const tones = {
    info: { bg: "#173F3E", fg: "#F3EFE3" },
    comunidade: { bg: "#2F7A73", fg: "#FFFFFF" },
    valores: { bg: "#93AD87", fg: "#1D2926" },
    missao: { bg: "#F3EFE3", fg: "#173F3E" },
    warn: { bg: "#F4E3C1", fg: "#7A4E12" },
    danger: { bg: "#F3DAD2", fg: "#8A3A28" },
    ok: { bg: "#DCEBD6", fg: "#3A6B33" },
  };
  const t = tones[tone] || tones.info;
  return (
    <span style={{
      background: t.bg, color: t.fg, fontSize: "0.72rem", fontWeight: 600,
      padding: "3px 10px", borderRadius: 999, letterSpacing: "0.02em",
      display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap"
    }}>
      {children}
    </span>
  );
}

export function Card({ children, style, ...rest }) {
  return (
    <div style={{
      background: COLORS.card, borderRadius: 14, border: `1px solid ${COLORS.border}`,
      padding: 20, boxShadow: "0 1px 2px rgba(23,63,62,0.05)", ...style
    }} {...rest}>
      {children}
    </div>
  );
}

export function Button({ children, onClick, variant = "primary", type = "button", disabled, style }) {
  const variants = {
    primary: { background: COLORS.info, color: "#F3EFE3", border: "none" },
    secondary: { background: "transparent", color: COLORS.info, border: `1.5px solid ${COLORS.info}` },
    valores: { background: COLORS.valores, color: "#1D2926", border: "none" },
    danger: { background: "transparent", color: COLORS.danger, border: `1.5px solid ${COLORS.danger}` },
    ghost: { background: "transparent", color: COLORS.textSoft, border: "none" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        padding: "9px 16px", borderRadius: 9, fontSize: "0.88rem", fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        display: "inline-flex", alignItems: "center", gap: 6, transition: "transform 0.1s, opacity 0.15s",
        fontFamily: "inherit", ...style
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.82rem", color: COLORS.textSoft, fontWeight: 600 }}>
      {label}
      {children}
    </label>
  );
}

const inputStyle = {
  padding: "9px 11px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`,
  fontSize: "0.9rem", fontFamily: "inherit", color: COLORS.text, background: "#FCFBF7",
  outline: "none"
};

export function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
export function Select(props) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
export function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: 60, ...(props.style || {}) }} />;
}

export function SectionTitle({ icon: Icon, title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: COLORS.info,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <Icon size={20} color="#F3EFE3" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Lora', serif", fontSize: "1.35rem", color: COLORS.info }}>{title}</h2>
          {subtitle && <p style={{ margin: "3px 0 0", color: COLORS.textSoft, fontSize: "0.86rem" }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(14,43,42,0.45)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.missao, borderRadius: 16, padding: 24, width: wide ? 640 : 460,
          maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(14,43,42,0.35)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontFamily: "'Lora', serif", color: COLORS.info, fontSize: "1.15rem" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textSoft }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatCard({ label, value, tone }) {
  return (
    <Card style={{ flex: "1 1 160px" }}>
      <div style={{ fontSize: "0.75rem", color: COLORS.textSoft, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontFamily: "'Lora', serif", fontSize: "1.9rem", color: tone || COLORS.info, marginTop: 6 }}>{value}</div>
    </Card>
  );
}

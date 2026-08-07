import React from "react";
import { ScrollText } from "lucide-react";
import { Card, SectionTitle, TableScroll } from "../components/ui";
import { fmtDateTime } from "../lib/constants";
import { useChurchData } from "../context/DataContext";

export default function Auditoria() {
  const { logs } = useChurchData();

  return (
    <div>
      <SectionTitle icon={ScrollText} title="Log de auditoria" subtitle="Quem cadastrou ou editou o quê, e quando" />
      <Card>
        <TableScroll><table>
          <thead><tr><th>Quando</th><th>Quem</th><th>Ação</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}><td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(l.quando)}</td><td style={{ fontWeight: 600 }}>{l.quem}</td><td>{l.acao}</td></tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", padding: 20 }}>Sem registos ainda.</td></tr>}
          </tbody>
        </table></TableScroll>
      </Card>
    </div>
  );
}

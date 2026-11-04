import { useMemo, useState } from "react";
import "./App.css";
import { sampleEntries, START_TIME } from "./data/sampleEntries";
import { buildFrontRowUpgradeQueue } from "./logic/buildQueue";
import type { ScoringMode, TicketQueueEntry } from "./logic/types";

const STEPS = [
  { label: "+5 min", ms: 5 * 60_000 },
  { label: "+15 min", ms: 15 * 60_000 },
  { label: "+1 hour", ms: 60 * 60_000 },
];

export default function App() {
  const [now, setNow] = useState(START_TIME);
  const [entries, setEntries] = useState<TicketQueueEntry[]>(sampleEntries);
  const [mode, setMode] = useState<ScoringMode>({ rushHour: false, vipHour: false, fairQueue: false });

  // คำนวณใหม่เฉพาะตอนที่ข้อมูล เวลา หรือโหมดเปลี่ยน
  const result = useMemo(() => buildFrontRowUpgradeQueue(entries, now, mode), [entries, now, mode]);

  // สร้าง array ใหม่ทุกครั้ง ไม่แก้ object เดิม
  function updateLoyalty(id: string, value: string) {
    const parsed = Number(value);
    const points = value.trim() === "" || !Number.isFinite(parsed) ? null : parsed;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, loyaltyPoints: points } : e)));
  }

  function toggle(key: keyof ScoringMode) {
    setMode((m) => ({ ...m, [key]: !m[key] }));
  }

  const { winner, candidates, fanGroups, excludedEntries } = result;

  return (
    <main className="page">
      <h1>Front Row Upgrade Queue</h1>

      <section className="toolbar">
        <div>
          <strong>Now:</strong> {now.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
          {STEPS.map((s) => (
            <button key={s.label} onClick={() => setNow((t) => new Date(t.getTime() + s.ms))}>{s.label}</button>
          ))}
          <button onClick={() => setNow(START_TIME)}>Reset time</button>
        </div>
        <div>
          <label><input type="checkbox" checked={mode.rushHour} onChange={() => toggle("rushHour")} /> Rush Hour</label>
          <label><input type="checkbox" checked={mode.vipHour} onChange={() => toggle("vipHour")} /> VIP Hour</label>
          <label><input type="checkbox" checked={mode.fairQueue} onChange={() => toggle("fairQueue")} /> Fair Queue</label>
        </div>
      </section>

      <section className="card winner">
        <h2>Current winner</h2>
        {winner ? (
          <>
            <p className="big">{winner.entry.fanName} ({winner.entry.id}) with score {winner.score}</p>
            <ul>{winner.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </>
        ) : <p>No eligible fan right now.</p>}
      </section>

      <section className="card">
        <h2>Top 3 candidates</h2>
        <ol>
          {candidates.slice(0, 3).map((c) => (
            <li key={c.entry.id}>{c.entry.fanName} ({c.entry.id}): {c.score}</li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2>Fan groups ({fanGroups.length})</h2>
        {fanGroups.map((g) => (
          <div key={g.id} className="group">
            <strong>{g.id}</strong>: {g.entries.map((e) => e.id).join(", ")}
            {" "}(representative: {g.representative ? g.representative.entry.id : "none eligible"})
            {g.connectionReasons.length > 0 && (
              <ul>{g.connectionReasons.map((r) => <li key={r}>{r}</li>)}</ul>
            )}
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Excluded entries ({excludedEntries.length})</h2>
        <ul>
          {excludedEntries.map((x) => (
            <li key={x.entry.id}>{x.entry.fanName} ({x.entry.id}): {x.reason}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Edit loyalty points</h2>
        <table>
          <thead><tr><th>ID</th><th>Fan</th><th>Loyalty</th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.fanName}</td>
                <td>
                  <input type="number" min={0} value={e.loyaltyPoints ?? ""}
                    onChange={(ev) => updateLoyalty(e.id, ev.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
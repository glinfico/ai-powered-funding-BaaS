"use client";
import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

type Kind = "lenders" | "investors" | "leads";
type Row = Record<string, string>;
type F = { id: string; name: string; kind: Kind; rows: Row[]; status: string };
const EP: Record<Kind, string> = { lenders: "/api/ccd/lenders", investors: "/api/ccd/investors", leads: "/api/leads/import" };
const INV = /hedge|\bfunds?\b|private equity|venture|\bvc\b|family office|asset management|investment management|endowment|pension|wealth management/i;
const LEN = /\bbank\b|lend|mortgage|credit union|loan|\bsba\b|factoring|bancorp|savings/i;
const norm = (r: Record<string, unknown>): Row => Object.fromEntries(Object.entries(r).map(([k, v]) => [String(k).trim(), v == null ? "" : String(v).trim()]));
const rowKind = (r: Row, d: Kind): Kind => { const t = Object.values(r).join(" "); const i = INV.test(t), l = LEN.test(t); return i && !l ? "investors" : l && !i ? "lenders" : i && /hedge|private equity|venture|family office/i.test(t) ? "investors" : d; };
const fileKind = (n: string, rows: Row[]): Kind => { n = n.toLowerCase(); if (/hedge|investor|fund|vc|equity|family/.test(n)) return "investors"; if (/lead/.test(n)) return "leads"; if (/lender|bank/.test(n)) return "lenders"; const s = rows.slice(0, 100).map(r => rowKind(r, "leads")); return s.filter(k => k === "investors").length > s.filter(k => k === "lenders").length ? "investors" : s.includes("lenders") ? "lenders" : "leads"; };

async function parse(f: File): Promise<Row[]> {
  const ext = f.name.split(".").pop()?.toLowerCase();
  let rows: Record<string, unknown>[];
  if (ext === "csv" || ext === "txt" || ext === "tsv") rows = Papa.parse<Record<string, unknown>>(await f.text(), { header: true, skipEmptyLines: true }).data;
  else if (ext === "json") { const j = JSON.parse(await f.text()); rows = Array.isArray(j) ? j : j.data || j.rows || []; }
  else { const wb = XLSX.read(await f.arrayBuffer()); rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: false }); }
  return rows.map(norm).filter(r => Object.values(r).some(Boolean));
}

async function enrich(key: string, kind: Kind, rows: Row[]): Promise<Row[]> {
  const prompt = `Enrich this commercial finance ${kind} list. Return ONLY a JSON array, same length/order, each record keeping all original fields plus: type, focus, size_range, geography, website, summary. Use "" when unsure; never invent emails or phones.\n${JSON.stringify(rows)}`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }) });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const out = JSON.parse((await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || "[]");
  return rows.map((x, i) => ({ ...x, ...norm(out[i] || {}) }));
}

const btn: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", cursor: "pointer", fontSize: 13 };

export default function DropBox() {
  const [files, setFiles] = useState<F[]>([]);
  const [key, setKey] = useState("");
  const [over, setOver] = useState(false);
  const upd = (id: string, p: Partial<F>) => setFiles(fs => fs.map(f => (f.id === id ? { ...f, ...p } : f)));

  async function add(list: FileList | null) {
    for (const f of Array.from(list || [])) {
      const id = crypto.randomUUID();
      try { const rows = await parse(f); setFiles(fs => [...fs, { id, name: f.name, rows, kind: fileKind(f.name, rows), status: `${rows.length} rows` }]); }
      catch (e) { setFiles(fs => [...fs, { id, name: f.name, rows: [], kind: "leads", status: "Parse error: " + (e as Error).message }]); }
    }
  }
  function split(f: F) {
    const g: Partial<Record<Kind, Row[]>> = {};
    f.rows.forEach(r => { const k = rowKind(r, f.kind); (g[k] ||= []).push(r); });
    const parts = (Object.entries(g) as [Kind, Row[]][]).map(([k, rows]) => ({ id: crypto.randomUUID(), name: `${f.name} → ${k}`, kind: k, rows, status: `split: ${rows.length} rows` }));
    setFiles(fs => fs.flatMap(x => (x.id === f.id ? parts : [x])));
  }
  async function doEnrich(f: F) {
    if (!key.startsWith("AIza")) return upd(f.id, { status: "Paste a Gemini key (AIza…) above" });
    const out = [...f.rows];
    try { for (let i = 0; i < out.length; i += 20) { upd(f.id, { status: `enriching ${i}/${out.length}…` }); out.splice(i, 20, ...(await enrich(key, f.kind, out.slice(i, i + 20)))); } upd(f.id, { rows: out, status: `enriched ${out.length} ✓` }); }
    catch (e) { upd(f.id, { rows: out, status: "enrich stopped: " + (e as Error).message }); }
  }
  async function doImport(f: F) {
    try {
      for (let i = 0; i < f.rows.length; i += 200) {
        upd(f.id, { status: `importing ${i}/${f.rows.length}…` });
        const chunk = f.rows.slice(i, i + 200);
        const r = await fetch(EP[f.kind], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: chunk, items: chunk, source: "ccd-v2-dropbox" }) });
        if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 150)}`);
      }
      upd(f.id, { status: `imported ${f.rows.length} ✓` });
    } catch (e) { upd(f.id, { status: "import failed: " + (e as Error).message + " (use Export CSV)" }); }
  }
  function exportCsv(f: F) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([Papa.unparse(f.rows)], { type: "text/csv" }));
    a.download = `${f.name.replace(/\.\w+$/, "")}-${f.kind}.csv`; a.click();
  }
  const total = (k: Kind) => files.filter(f => f.kind === k).reduce((s, f) => s + f.rows.length, 0);

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "#e2e8f0", padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>CCD-V2 <span style={{ color: "#38bdf8" }}>Drop Box</span></h1>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Lenders: {total("lenders")} · Investors: {total("investors")} · Leads: {total("leads")}</p>
        <input type="password" placeholder="Gemini key (AIza…) — only needed for Enrich, never saved" value={key} onChange={e => setKey(e.target.value.trim())}
          style={{ width: "100%", margin: "16px 0", padding: 10, borderRadius: 8, background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} />
        <label onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
          style={{ display: "block", border: `2px dashed ${over ? "#38bdf8" : "#334155"}`, borderRadius: 16, padding: 48, textAlign: "center", cursor: "pointer" }}>
          <input type="file" multiple accept=".csv,.tsv,.txt,.xlsx,.xls,.json" hidden onChange={e => add(e.target.files)} />
          <div style={{ fontSize: 40 }}>📥</div><b>Drag your lists from Downloads here, or click to choose</b>
          <div style={{ color: "#64748b", fontSize: 13 }}>CSV · XLSX · XLS · JSON</div>
        </label>
        {files.map(f => (
          <div key={f.id} style={{ marginTop: 12, padding: 14, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 200 }}><div style={{ fontWeight: 600 }}>{f.name}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{f.status}</div></div>
            <select value={f.kind} onChange={e => upd(f.id, { kind: e.target.value as Kind })} style={btn}>
              <option value="lenders">lenders</option><option value="investors">investors</option><option value="leads">leads</option></select>
            <button style={btn} onClick={() => split(f)}>⑂ Split</button>
            <button style={btn} onClick={() => doEnrich(f)}>✨ Enrich</button>
            <button style={btn} onClick={() => exportCsv(f)}>Export CSV</button>
            <button style={{ ...btn, background: "#0284c7" }} onClick={() => doImport(f)}>Import</button>
            <button style={{ ...btn, background: "transparent", border: "none" }} onClick={() => setFiles(fs => fs.filter(x => x.id !== f.id))}>✕</button>
          </div>
        ))}
      </div>
    </main>
  );
}

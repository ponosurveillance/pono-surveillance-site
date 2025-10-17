// scripts/build-crime.js
// Build /public/data/crime.json from a Google Sheet CSV (or JSON) URL.
// Adds per-city ranking + a _meta block with Top/Bottom lists.
// Ranking weights violent crime more heavily than property crime.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const OUT_PATH = path.join(__dirname, "..", "public", "data", "crime.json");
const SOURCE   = process.env.SHEET_CSV_URL || process.env.SOURCE_URL;

if (!SOURCE) {
  console.error("Missing SHEET_CSV_URL (or SOURCE_URL) env var");
  process.exit(1);
}

function parseCSV(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map(h => h.trim());
  return lines
    .filter(l => l.trim().length)
    .map(line => {
      // simple CSV split (okay for our sheet)
      const cols = line.split(",").map(c => c.trim());
      const row = {};
      headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
      return row;
    });
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch failed: ${r.status} ${r.statusText}`);
  return await r.text();
}

(async () => {
  const today = new Date().toISOString().slice(0,10);

  let rows = [];
  if (SOURCE.endsWith(".json")) {
    rows = await (await fetch(SOURCE)).json();
  } else {
    const csv = await fetchText(SOURCE);
    rows = parseCSV(csv);
  }

  // Normalize and coerce types
  const items = [];
  for (const r of rows) {
    const city  = (r.city  || "").trim();
    const state = (r.state || "").trim();
    if (!city || !state) continue;

    const violent       = Number(r.violentCrime ?? 0)   || 0;
    const property      = Number(r.propertyCrime ?? 0)  || 0;
    const trend         = (r.trend || "flat").toLowerCase();
    const lastUpdated   = (r.lastUpdated || today).trim();
    const safetyIndex   = r.safetyIndex ? Number(r.safetyIndex) : null;
    const responseMins  = r.policeResponseTime ? Number(r.policeResponseTime) : null;
    const population    = r.population ? Number(r.population) : null;
    const note          = (r.note || "").trim();

    items.push({
      key: `${city}, ${state}`,
      city, state,
      violentCrime: violent,
      propertyCrime: property,
      trend,
      lastUpdated,
      safetyIndex,
      policeResponseTime: responseMins,
      population,
      note
    });
  }

  if (!items.length) {
    console.error("No valid rows found in sheet.");
    process.exit(1);
  }

  // ---- Rankings ------------------------------------------------------------
  const maxV = Math.max(...items.map(i => i.violentCrime));
  const maxP = Math.max(...items.map(i => i.propertyCrime));
  const weightV = 0.6;  // violent weight
  const weightP = 0.4;  // property weight

  items.forEach(i => {
    const nv = maxV ? i.violentCrime / maxV : 0;
    const np = maxP ? i.propertyCrime / maxP : 0;
    i.riskScore = +(weightV * nv + weightP * np).toFixed(6);
  });

  // rank 1 = most at-risk; higher rank number = safer
  const sorted = [...items].sort((a,b) => b.riskScore - a.riskScore);
  sorted.forEach((i, idx) => { i.rank = idx + 1; });
  const total = items.length;

  // Build output
  const out = {};
  for (const i of sorted) {
    out[i.key] = {
      city: i.city,
      state: i.state,
      violentCrime: i.violentCrime,
      propertyCrime: i.propertyCrime,
      trend: i.trend,
      lastUpdated: i.lastUpdated,
      safetyIndex: i.safetyIndex,
      policeResponseTime: i.policeResponseTime,
      population: i.population,
      note: i.note,
      riskScore: i.riskScore,
      rank: i.rank,
      rankOutOf: total
    };
  }

  out["_meta"] = {
    generatedAt: today,
    totalCities: total,
    ranking: sorted.map(i => ({
      key: i.key,
      city: i.city,
      state: i.state,
      rank: i.rank,
      riskScore: i.riskScore,
      violentCrime: i.violentCrime,
      propertyCrime: i.propertyCrime
    })),
    topMostAtRisk: sorted.slice(0, Math.min(10, total)).map(i => i.key),
    topSafest: [...sorted].reverse().slice(0, Math.min(10, total)).map(i => i.key)
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`Wrote ${OUT_PATH} for ${total} cities with rankings.`);
})();

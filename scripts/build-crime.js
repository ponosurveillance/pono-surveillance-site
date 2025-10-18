// scripts/build-crime.js
// Builds /public/data/crime.json from a CSV URL (SHEET_CSV_URL)
// Works on Node 18+ (Actions uses Node 20)

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUT_DIR = join(__dirname, "..", "public", "data");
const OUT_PATH = join(OUT_DIR, "crime.json");
const SOURCE = process.env.SHEET_CSV_URL || process.env.SOURCE_URL;

if (!SOURCE) {
  console.error("❌ Missing SHEET_CSV_URL (or SOURCE_URL) env var");
  process.exit(1);
}

// Simple CSV parser (no deps) — expects header row
function parseCSV(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    // naive split — your sheet should not contain commas inside quotes
    const cols = line.split(",").map(c => c.trim());
    const row = {};
    headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
    return row;
  });
}

// Normalize strings -> slug (e.g. "Los Angeles, CA" -> "los-angeles-ca")
function slugify(city, state) {
  const s = `${city}-${state}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return s.replace(/(^-|-$)/g, "");
}

// Optional scoring example (tweak as you like)
function scoreRow(r) {
  const violent = Number(r.violentCrime || r.ViolentCrime || 0) || 0;
  const property = Number(r.propertyCrime || r.PropertyCrime || 0) || 0;
  // heavier weight on violent
  return Math.round(violent * 3 + property * 1);
}

(async () => {
  console.log("⬇️ Fetching CSV:", SOURCE);
  const res = await fetch(SOURCE, { cache: "no-store" });
  if (!res.ok) {
    console.error(`❌ Failed to fetch CSV (${res.status})`);
    process.exit(1);
  }

  const csv = await res.text();
  const rows = parseCSV(csv);

  // map rows: must contain at least city + state columns
  const data = rows
    .filter(r => (r.city || r.City) && (r.state || r.State))
    .map(r => {
      const city = (r.city || r.City || "").trim();
      const state = (r.state || r.State || "").trim();
      const slug = (r.slug || r.Slug || slugify(city, state));
      const violent = Number(r.violentCrime || r.ViolentCrime || 0) || 0;
      const property = Number(r.propertyCrime || r.PropertyCrime || 0) || 0;
      const police = Number(r.policeResources || r.PoliceResources || 0) || 0;

      return {
        city,
        state,
        slug,
        violentCrime: violent,
        propertyCrime: property,
        policeResources: police,
        score: scoreRow(r),
      };
    });

  // simple top/bottom lists
  const sorted = [...data].sort((a, b) => a.score - b.score);
  const meta = {
    lastUpdated: new Date().toISOString().slice(0, 10),
    count: data.length,
    topSafest: sorted.slice(0, 10).map(x => x.slug),
    topMostAtRisk: sorted.slice(-10).reverse().map(x => x.slug),
  };

  const payload = { _meta: meta, data };

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`✅ Wrote ${OUT_PATH} (${data.length} cities)`);
})();

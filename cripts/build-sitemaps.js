// scripts/build-sitemaps.js
// ESM-friendly. No external deps.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Change to your production site if/when you add a custom domain
const SITE = process.env.SITE_DOMAIN || "https://v0-apartment-surveillance-package.vercel.app";

// read locations
const locPath = path.join(__dirname, "locations.json");
const locations = JSON.parse(fs.readFileSync(locPath, "utf8"));

// ensure public dir exists
const publicDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// base pages for main sitemap
const now = new Date().toISOString().slice(0, 10);
const pages = [
  { url: "/", priority: 1.0 },
  { url: "/locations", priority: 0.9 },
  { url: "/blog", priority: 0.7 },
  { url: "/contact", priority: 0.7 },
  { url: "/services", priority: 0.7 }
];

function urlset(items) {
  const body = items.map(i => `
  <url>
    <loc>${SITE}${i.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${i.priority ?? 0.8}</priority>
  </url>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>`;
}

function write(file, xml) {
  fs.writeFileSync(path.join(publicDir, file), xml);
  console.log("wrote", file);
}

// main sitemap
write("sitemap.xml", urlset(pages));

// locations sitemap
const locationItems = locations.map(slug => ({
  url: `/locations/${slug}`,
  priority: 0.8
}));
write("sitemap-locations.xml", urlset(locationItems));

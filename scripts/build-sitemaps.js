/**
 * Simple sitemap generator that:
 *  - reads the base URL from env (NEXT_PUBLIC_SITE_URL) with a hardcoded fallback
 *  - includes a small set of common routes by default
 *  - writes /public/sitemap.xml
 *
 * Extend the `routes` array with real dynamic URLs from your CMS, products, blog, etc.
 */
const fs = require("fs");
const path = require("path");

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.ponosurveillance.com";

const now = new Date().toISOString();

// TODO: Add your real URLs here.
// You can fetch products/posts and push into this array before writing.
const routes = [
  "/",
  "/about",
  "/contact",
  "/services",
  "/products",
  "/blog",
].map((p) => ({
  url: `${SITE_URL}${p}`,
  lastmod: now,
  changefreq: "daily",
  priority: p === "/" ? "1.0" : "0.7",
}));

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
  routes
    .map(
      (r) => `
  <url>
    <loc>${r.url}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join("") +
  `\n</urlset>\n`;

const outPath = path.join(process.cwd(), "public", "sitemap.xml");
fs.writeFileSync(outPath, xml, "utf8");
console.log(`✓ Wrote sitemap: ${outPath}`);
console.log(`✓ Using base URL: ${SITE_URL}`);


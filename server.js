/* ============================================================
   Coolify Deploy Catalog
   - Lists Coolify applications (name / URL / description)
   - Merges manual extras (bind-mount apps, etc.)
   ============================================================ */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, "public");
const EXTRAS_PATH = path.join(__dirname, "extras.json");

const pool = new Pool({
  host: process.env.DB_HOST || "coolify-db",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USERNAME || "coolify",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "coolify",
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});

let cache = { at: 0, payload: null };
const CACHE_MS = 15_000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, code, body, type = "application/json; charset=utf-8") {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  res.writeHead(code, {
    "Content-Type": type,
    "Content-Length": buf.length,
    "Cache-Control": type.includes("json") ? "no-store" : "public, max-age=60",
  });
  res.end(buf);
}

function splitUrls(fqdn) {
  if (!fqdn) return [];
  return String(fqdn)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((u) => (u.startsWith("http") ? u : `https://${u}`));
}

function normalizeStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v.includes("running") && v.includes("healthy")) return "healthy";
  if (v.includes("running")) return "running";
  if (v.includes("exited") || v.includes("stopped")) return "stopped";
  if (v.includes("degraded") || v.includes("unhealthy")) return "degraded";
  return v || "unknown";
}

function loadExtras() {
  try {
    const raw = JSON.parse(fs.readFileSync(EXTRAS_PATH, "utf8"));
    return (Array.isArray(raw) ? raw : []).map((e) => ({
      id: `manual:${e.name}`,
      name: e.name,
      urls: e.urls || [],
      description: e.description || "",
      project: e.project || "manual",
      projectDescription: "",
      environment: e.environment || "production",
      status: normalizeStatus(e.status || "running"),
      git: e.git || null,
      branch: e.branch || null,
      buildPack: null,
      source: "manual",
      updatedAt: null,
    }));
  } catch {
    return [];
  }
}

async function fetchFromCoolify() {
  const sql = `
    SELECT
      a.uuid,
      a.name,
      a.fqdn,
      a.description,
      a.status,
      a.git_repository,
      a.git_branch,
      a.build_pack,
      a.updated_at,
      p.name AS project,
      p.description AS project_description,
      e.name AS environment
    FROM applications a
    JOIN environments e ON e.id = a.environment_id
    JOIN projects p ON p.id = e.project_id
    WHERE a.deleted_at IS NULL
    ORDER BY p.name ASC, a.name ASC
  `;
  const { rows } = await pool.query(sql);
  return rows.map((r) => ({
    id: r.uuid,
    name: r.name,
    urls: splitUrls(r.fqdn),
    description: r.description || r.project_description || "",
    project: r.project,
    projectDescription: r.project_description || "",
    environment: r.environment,
    status: normalizeStatus(r.status),
    git: r.git_repository ? `https://github.com/${r.git_repository}` : null,
    branch: r.git_branch || null,
    buildPack: r.build_pack || null,
    source: "coolify",
    updatedAt: r.updated_at,
  }));
}

function dedupeByUrl(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = (item.urls[0] || item.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function getCatalog(force = false) {
  const now = Date.now();
  if (!force && cache.payload && now - cache.at < CACHE_MS) return cache.payload;

  let apps = [];
  let error = null;
  try {
    apps = await fetchFromCoolify();
  } catch (e) {
    error = String(e.message || e);
    apps = cache.payload?.apps?.filter((a) => a.source === "coolify") || [];
  }

  const extras = loadExtras();
  const merged = dedupeByUrl([...apps, ...extras]).sort((a, b) => {
    const pa = (a.project || "").localeCompare(b.project || "");
    if (pa !== 0) return pa;
    return (a.name || "").localeCompare(b.name || "");
  });

  const projects = [...new Set(merged.map((a) => a.project).filter(Boolean))].sort();
  const payload = {
    generatedAt: new Date().toISOString(),
    count: merged.length,
    projects,
    apps: merged,
    error,
  };
  cache = { at: now, payload };
  return payload;
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.normalize(path.join(PUBLIC, urlPath));
  if (!file.startsWith(PUBLIC)) return send(res, 403, "Forbidden", "text/plain");
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain");
    send(res, 200, data, MIME[path.extname(file)] || "application/octet-stream");
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url || "/";
  if (req.method === "GET" && (url === "/api/apps" || url.startsWith("/api/apps?"))) {
    try {
      const force = url.includes("refresh=1");
      const data = await getCatalog(force);
      return send(res, 200, JSON.stringify(data));
    } catch (e) {
      return send(res, 500, JSON.stringify({ error: String(e.message || e) }));
    }
  }
  if (req.method === "GET" && url === "/api/health") {
    return send(res, 200, JSON.stringify({ ok: true }));
  }
  if (req.method === "GET") return serveStatic(req, res);
  send(res, 405, "Method not allowed", "text/plain");
});

server.listen(PORT, () => {
  console.log(`coolify-catalog listening on :${PORT}`);
});

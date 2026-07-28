/* ============================================================
   Coolify Deploy Catalog
   - Main list: Coolify apps (excludes Next-Tomorrow / NT demos)
   - NT list: curated Next-Tomorrow Demo List (JP default / KR toggle)
   ============================================================ */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, "public");
const EXTRAS_PATH = path.join(__dirname, "extras.json");
const NT_APPS_PATH = path.join(__dirname, "nt-apps.json");
const NT_HOST = (process.env.NT_HOST || "nt-demos.app.genver.online").toLowerCase();

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

let cache = { at: 0, all: null, main: null, nt: null };
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

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return String(url || "")
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .toLowerCase();
  }
}

function normalizeStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v.includes("running") && v.includes("healthy")) return "healthy";
  if (v.includes("running")) return "running";
  if (v.includes("exited") || v.includes("stopped")) return "stopped";
  if (v.includes("degraded") || v.includes("unhealthy")) return "degraded";
  return v || "unknown";
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function loadNtDefs() {
  const raw = loadJson(NT_APPS_PATH, []);
  return Array.isArray(raw) ? raw : [];
}

function loadExtras() {
  const raw = loadJson(EXTRAS_PATH, []);
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
}

function matchesNtDef(app, def) {
  const name = String(app.name || "").toLowerCase();
  const names = (def.matchNames || []).map((n) => String(n).toLowerCase());
  if (names.some((n) => name === n || name.includes(n))) return true;
  const hosts = new Set((def.matchHosts || []).map((h) => String(h).toLowerCase()));
  return (app.urls || []).some((u) => hosts.has(hostOf(u)));
}

function isNtApp(app, defs = loadNtDefs()) {
  return defs.some((def) => matchesNtDef(app, def));
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
  const seen = setFactory();
  const out = [];
  for (const item of items) {
    const key = (item.urls[0] || item.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function setFactory() {
  return new Set();
}

async function loadAll(force = false) {
  const now = Date.now();
  if (!force && cache.all && now - cache.at < CACHE_MS) return cache;

  let apps = [];
  let error = null;
  try {
    apps = await fetchFromCoolify();
  } catch (e) {
    error = String(e.message || e);
    apps = (cache.all || []).filter((a) => a.source === "coolify");
  }

  const extras = loadExtras();
  const ntDefs = loadNtDefs();
  // Seed manual NT apps (e.g. pmnt, greenai-proto) so status merge still works
  const ntSeeds = ntDefs.map((def) => ({
    id: `nt:${def.key}`,
    name: def.matchNames?.[0] || def.key,
    urls: def.urls || [],
    description: "",
    project: "nt",
    projectDescription: "",
    environment: "production",
    status: "running",
    git: null,
    branch: null,
    buildPack: null,
    source: "nt",
    updatedAt: null,
  }));

  const merged = dedupeByUrl([...apps, ...extras, ...ntSeeds]).sort((a, b) => {
    const pa = (a.project || "").localeCompare(b.project || "");
    if (pa !== 0) return pa;
    return (a.name || "").localeCompare(b.name || "");
  });

  const mainApps = merged.filter((a) => !isNtApp(a, ntDefs));
  const liveByKey = new Map();
  for (const app of merged) {
    for (const def of ntDefs) {
      if (matchesNtDef(app, def)) liveByKey.set(def.key, app);
    }
  }

  const ntApps = ntDefs.map((def) => {
    const live = liveByKey.get(def.key);
    return {
      key: def.key,
      title: def.title || { jp: def.key, kr: def.key },
      description: def.description || { jp: "", kr: "" },
      urls: (live?.urls?.length ? live.urls : def.urls) || [],
      status: live ? live.status : "unknown",
      git: live?.git || null,
      branch: live?.branch || null,
      source: live?.source || "nt",
    };
  });

  cache = {
    at: now,
    all: merged,
    main: {
      generatedAt: new Date().toISOString(),
      count: mainApps.length,
      projects: [...new Set(mainApps.map((a) => a.project).filter(Boolean))].sort(),
      apps: mainApps,
      error,
    },
    nt: {
      generatedAt: new Date().toISOString(),
      count: ntApps.length,
      title: "Next-Tomorrow Demo List",
      apps: ntApps,
      error,
    },
  };
  return cache;
}

function serveStatic(req, res, urlPath) {
  const file = path.normalize(path.join(PUBLIC, urlPath));
  if (!file.startsWith(PUBLIC)) return send(res, 403, "Forbidden", "text/plain");
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain");
    send(res, 200, data, MIME[path.extname(file)] || "application/octet-stream");
  });
}

function isNtHost(req) {
  const host = String(req.headers.host || "")
    .split(":")[0]
    .toLowerCase();
  return host === NT_HOST || host.startsWith("nt-demos.");
}

const server = http.createServer(async (req, res) => {
  const rawUrl = req.url || "/";
  const urlPath = decodeURIComponent(rawUrl.split("?")[0]);
  const force = rawUrl.includes("refresh=1");

  if (req.method === "GET" && (urlPath === "/api/apps")) {
    try {
      const data = (await loadAll(force)).main;
      return send(res, 200, JSON.stringify(data));
    } catch (e) {
      return send(res, 500, JSON.stringify({ error: String(e.message || e) }));
    }
  }

  if (req.method === "GET" && urlPath === "/api/nt-apps") {
    try {
      const data = (await loadAll(force)).nt;
      return send(res, 200, JSON.stringify(data));
    } catch (e) {
      return send(res, 500, JSON.stringify({ error: String(e.message || e) }));
    }
  }

  if (req.method === "GET" && urlPath === "/api/health") {
    return send(res, 200, JSON.stringify({ ok: true }));
  }

  if (req.method === "GET") {
    let filePath = urlPath;
    if (isNtHost(req)) {
      if (filePath === "/" || filePath === "/index.html") filePath = "/nt/index.html";
    } else if (filePath === "/") {
      filePath = "/index.html";
    }
    return serveStatic(req, res, filePath);
  }

  send(res, 405, "Method not allowed", "text/plain");
});

server.listen(PORT, () => {
  console.log(`coolify-catalog listening on :${PORT}`);
});

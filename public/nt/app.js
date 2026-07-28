const I18N = {
  jp: {
    brandSub: "デモ一覧",
    langLabel: "言語",
    appTitle: "Next-Tomorrow Demo List",
    appDesc: "Next-Tomorrow（NT）向けに公開しているデモの一覧です。",
    sideFooter: "NT専用のデモリストです。\n一般のデプロイ一覧とは分離して管理されます。",
    meta: (n) => `${n} 件`,
    noUrl: "URLなし",
    loadError: "一覧を読み込めませんでした",
    sectionMockup: "demo (mockup)",
    sectionProto: "demo (proto)",
    sectionOther: "Project Management",
    kindMockup: "demo (mockup)",
    kindProto: "demo (proto)",
  },
  kr: {
    brandSub: "데모 목록",
    langLabel: "언어",
    appTitle: "Next-Tomorrow Demo List",
    appDesc: "Next-Tomorrow(NT)용으로 공개된 데모 목록입니다.",
    sideFooter: "NT 전용 데모 리스트입니다.\n일반 배포 목록과 분리되어 관리됩니다.",
    meta: (n) => `${n}개`,
    noUrl: "URL 없음",
    loadError: "목록을 불러오지 못했습니다",
    sectionMockup: "demo (mockup)",
    sectionProto: "demo (proto)",
    sectionOther: "Project Management",
    kindMockup: "demo (mockup)",
    kindProto: "demo (proto)",
  },
};

let lang = localStorage.getItem("nt_demo_lang") || "jp";
if (lang !== "jp" && lang !== "kr") lang = "jp";
let apps = [];

const $ = (sel) => document.querySelector(sel);
const t = (key) => I18N[lang][key];

function setSegActive(value) {
  document.querySelectorAll("#langSeg button").forEach((b) => {
    b.classList.toggle("active", b.dataset.val === value);
  });
}

function statusClass(s) {
  return ["healthy", "running", "stopped"].includes(s) ? s : "unknown";
}

function applyI18n() {
  document.documentElement.lang = lang === "jp" ? "ja" : "ko";
  $("#brandSub").textContent = t("brandSub");
  $("#langLabel").textContent = t("langLabel");
  $("#appTitle").textContent = t("appTitle");
  $("#appDesc").textContent = t("appDesc");
  $("#sideFooter").textContent = t("sideFooter");
  setSegActive(lang);
  renderList();
}

function kindLabel(kind) {
  if (kind === "mockup") return t("kindMockup");
  if (kind === "proto") return t("kindProto");
  return "";
}

function renderCard(app) {
  const card = document.createElement("article");
  card.className = "card";

  const main = document.createElement("div");
  const top = document.createElement("div");
  top.className = "card-top";

  const name = document.createElement("h2");
  name.className = "name";
  name.textContent = app.title?.[lang] || app.title?.jp || app.key;
  top.appendChild(name);

  const kind = kindLabel(app.kind);
  if (kind) {
    const badge = document.createElement("span");
    badge.className = "kind-badge kind-" + app.kind;
    badge.textContent = kind;
    top.appendChild(badge);
  }
  main.appendChild(top);

  const desc = document.createElement("p");
  desc.className = "desc";
  desc.textContent = app.description?.[lang] || app.description?.jp || "";
  main.appendChild(desc);

  const urls = document.createElement("div");
  urls.className = "urls";
  const urlList = app.urls || [];
  if (!urlList.length) {
    const none = document.createElement("span");
    none.className = "desc";
    none.textContent = t("noUrl");
    urls.appendChild(none);
  } else {
    urlList.forEach((u) => {
      const a = document.createElement("a");
      a.href = u;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = u.replace(/^https?:\/\//, "");
      urls.appendChild(a);
    });
  }
  main.appendChild(urls);

  const side = document.createElement("div");
  side.className = "side-meta";
  const st = document.createElement("span");
  st.className = "status " + statusClass(app.status);
  st.textContent = app.status || "unknown";
  side.appendChild(st);

  card.appendChild(main);
  card.appendChild(side);
  return card;
}

function renderSection(container, title, items) {
  if (!items.length) return;
  const section = document.createElement("section");
  section.className = "section";

  const h = document.createElement("h3");
  h.className = "section-title";
  h.textContent = title;
  section.appendChild(h);

  const grid = document.createElement("div");
  grid.className = "list";
  items.forEach((app) => grid.appendChild(renderCard(app)));
  section.appendChild(grid);
  container.appendChild(section);
}

function renderList() {
  const list = $("#list");
  list.innerHTML = "";
  $("#meta").textContent = typeof t("meta") === "function" ? t("meta")(apps.length) : "";

  const mockups = apps.filter((a) => a.kind === "mockup");
  const protos = apps.filter((a) => a.kind === "proto");
  const others = apps.filter((a) => a.kind !== "mockup" && a.kind !== "proto");

  renderSection(list, t("sectionMockup"), mockups);
  renderSection(list, t("sectionProto"), protos);
  renderSection(list, t("sectionOther"), others);
}

async function load() {
  $("#error").classList.add("hidden");
  try {
    const r = await fetch("/api/nt-apps?refresh=1", { cache: "no-store" });
    if (!r.ok) throw new Error("API " + r.status);
    const data = await r.json();
    apps = data.apps || [];
    if (data.error) {
      $("#error").textContent = data.error;
      $("#error").classList.remove("hidden");
    }
    renderList();
  } catch (e) {
    $("#error").textContent = t("loadError") + ": " + e.message;
    $("#error").classList.remove("hidden");
  }
}

$("#langSeg").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  lang = btn.dataset.val;
  localStorage.setItem("nt_demo_lang", lang);
  applyI18n();
});

applyI18n();
load();

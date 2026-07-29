const $ = (sel) => document.querySelector(sel);

let catalog = { apps: [], projects: [] };
let picking = false;
let requiresKey = false;
/** app id -> { id, name, url } while building a set. */
const picked = new Map();

function statusClass(s) {
  return ["healthy", "running", "stopped", "degraded"].includes(s) ? s : "unknown";
}

function fmtTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ko-KR", { hour12: false });
  } catch {
    return iso;
  }
}

function renderMeta() {
  const n = filtered().length;
  const total = catalog.apps?.length || 0;
  const when = fmtTime(catalog.generatedAt);
  $("#meta").textContent = `${n} / ${total}개 표시` + (when ? ` · 갱신 ${when}` : "");
}

function filtered() {
  const q = ($("#q").value || "").trim().toLowerCase();
  const project = $("#projectFilter").value;
  return (catalog.apps || []).filter((app) => {
    if (project && app.project !== project) return false;
    if (!q) return true;
    const hay = [
      app.name,
      app.description,
      app.project,
      app.branch,
      ...(app.urls || []),
      app.git || "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function fillProjectFilter() {
  const sel = $("#projectFilter");
  const current = sel.value;
  sel.innerHTML = '<option value="">전체 프로젝트</option>';
  (catalog.projects || []).forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    sel.appendChild(opt);
  });
  if ([...sel.options].some((o) => o.value === current)) sel.value = current;
}

function renderList() {
  const apps = filtered();
  const list = $("#list");
  list.innerHTML = "";
  $("#empty").classList.toggle("hidden", apps.length > 0);

  apps.forEach((app) => {
    const card = document.createElement("article");
    card.className = "card" + (picking ? " pickable" : "") + (picked.has(app.id) ? " picked" : "");

    if (picking) {
      const box = document.createElement("input");
      box.type = "checkbox";
      box.className = "pick";
      box.checked = picked.has(app.id);
      box.setAttribute("aria-label", `${app.name} 선택`);
      box.addEventListener("change", () => togglePick(app, box.checked));
      card.appendChild(box);
      // Clicking anywhere on the card toggles it, except on the real links.
      card.addEventListener("click", (e) => {
        if (e.target.closest("a") || e.target === box) return;
        box.checked = !box.checked;
        togglePick(app, box.checked);
      });
    }

    const main = document.createElement("div");
    const top = document.createElement("div");
    top.className = "card-top";

    const name = document.createElement("h2");
    name.className = "name";
    name.textContent = app.name;
    top.appendChild(name);

    if (app.project) {
      const tag = document.createElement("span");
      tag.className = "project-tag";
      tag.textContent = app.project;
      top.appendChild(tag);
    }
    main.appendChild(top);

    if (app.description) {
      const desc = document.createElement("p");
      desc.className = "desc";
      desc.textContent = app.description;
      main.appendChild(desc);
    }

    const urls = document.createElement("div");
    urls.className = "urls";
    (app.urls || []).forEach((u) => {
      const a = document.createElement("a");
      a.href = u;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = u.replace(/^https?:\/\//, "");
      urls.appendChild(a);
    });
    if (!app.urls?.length) {
      const none = document.createElement("span");
      none.className = "desc";
      none.textContent = "URL 없음";
      urls.appendChild(none);
    }
    main.appendChild(urls);

    const side = document.createElement("div");
    side.className = "side";

    const st = document.createElement("span");
    st.className = "status " + statusClass(app.status);
    st.textContent = app.status || "unknown";
    side.appendChild(st);

    if (app.branch) {
      const br = document.createElement("span");
      br.className = "branch";
      br.textContent = app.branch;
      side.appendChild(br);
    }

    if (app.git) {
      const g = document.createElement("a");
      g.className = "git";
      g.href = app.git;
      g.target = "_blank";
      g.rel = "noopener noreferrer";
      g.textContent = app.git.replace("https://github.com/", "");
      side.appendChild(g);
    } else if (app.source === "manual") {
      const g = document.createElement("span");
      g.className = "branch";
      g.textContent = "manual";
      side.appendChild(g);
    }

    card.appendChild(main);
    card.appendChild(side);
    list.appendChild(card);
  });

  renderMeta();
}

async function load(force = false) {
  $("#error").classList.add("hidden");
  try {
    const r = await fetch("/api/apps" + (force ? "?refresh=1" : ""), { cache: "no-store" });
    if (!r.ok) throw new Error("API " + r.status);
    catalog = await r.json();
    if (catalog.error) {
      $("#error").textContent = "Coolify DB 일부 조회 실패: " + catalog.error + " (수동 항목은 표시될 수 있음)";
      $("#error").classList.remove("hidden");
    }
    fillProjectFilter();
    renderList();
  } catch (e) {
    $("#error").textContent = "목록을 불러오지 못했습니다: " + e.message;
    $("#error").classList.remove("hidden");
  }
}

/* ---------- Picking demos for a set -------------------------------------- */

function togglePick(app, on) {
  if (on) picked.set(app.id, { id: app.id, name: app.name, url: app.urls?.[0] || "" });
  else picked.delete(app.id);
  renderTray();
  renderList();
}

function renderTray() {
  const n = picked.size;
  $("#tray").classList.toggle("hidden", !picking);
  $("#trayCount").textContent = String(n);
  const names = [...picked.values()].map((p) => p.name);
  $("#trayNames").textContent = names.slice(0, 4).join(" · ") + (n > 4 ? ` 외 ${n - 4}개` : "");
  $("#traySave").disabled = n === 0;
}

function setPicking(on) {
  picking = on;
  $("#pickBtn").textContent = on ? "고르기 중단" : "데모 고르기";
  document.body.classList.toggle("picking", on);
  if (!on) picked.clear();
  renderTray();
  renderList();
}

async function saveSet() {
  const title = $("#setTitle").value.trim();
  const key = $("#setKey").value;
  const err = $("#saveErr");
  err.classList.add("hidden");
  if (!title || (requiresKey && !key)) {
    err.textContent = requiresKey
      ? "세트 이름과 편집 비밀번호를 입력해 주세요."
      : "세트 이름을 입력해 주세요.";
    err.classList.remove("hidden");
    return;
  }
  try {
    const r = await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Edit-Key": key },
      body: JSON.stringify({
        title,
        subtitle: $("#setSubtitle").value.trim(),
        slug: $("#setSlug").value.trim(),
        items: [...picked.values()],
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    sessionStorage.setItem("catalogEditKey", key);
    location.href = `/show/${data.slug}`;
  } catch (e) {
    err.textContent = String(e.message || e);
    err.classList.remove("hidden");
  }
}

$("#q").addEventListener("input", renderList);
$("#projectFilter").addEventListener("change", renderList);
$("#refreshBtn").addEventListener("click", () => load(true));
$("#pickBtn").addEventListener("click", () => setPicking(!picking));
$("#trayExit").addEventListener("click", () => setPicking(false));
$("#trayClear").addEventListener("click", () => {
  picked.clear();
  renderTray();
  renderList();
});
$("#traySave").addEventListener("click", () => {
  $("#setKey").value = sessionStorage.getItem("catalogEditKey") || "";
  $("#saveErr").classList.add("hidden");
  $("#saveDlg").showModal();
  $("#setTitle").focus();
});
$("#saveCancel").addEventListener("click", () => $("#saveDlg").close());
$("#saveGo").addEventListener("click", saveSet);
$("#saveForm").addEventListener("submit", (e) => {
  e.preventDefault();
  saveSet();
});

fetch("/api/health", { cache: "no-store" })
  .then((r) => r.json())
  .then((h) => {
    requiresKey = Boolean(h.requiresKey);
    $("#setKeyField").classList.toggle("hidden", !requiresKey);
  })
  .catch(() => {});

load().then(() => {
  if (new URLSearchParams(location.search).get("pick") === "1") setPicking(true);
});

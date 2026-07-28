const $ = (sel) => document.querySelector(sel);

let catalog = { apps: [], projects: [] };

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
    card.className = "card";

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

$("#q").addEventListener("input", renderList);
$("#projectFilter").addEventListener("change", renderList);
$("#refreshBtn").addEventListener("click", () => load(true));

load();

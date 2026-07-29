const $ = (sel) => document.querySelector(sel);

let sets = [];
let requiresKey = false;
let editing = null; // full set being edited, with resolved items

function fmtTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ko-KR", { hour12: false });
  } catch {
    return iso;
  }
}

function showError(msg) {
  const box = $("#error");
  box.textContent = msg;
  box.classList.toggle("hidden", !msg);
}

function renderList() {
  const list = $("#list");
  list.innerHTML = "";
  $("#empty").classList.toggle("hidden", sets.length > 0);
  $("#meta").textContent = sets.length ? `${sets.length}개 세트` : "";

  sets.forEach((s) => {
    const card = document.createElement("article");
    card.className = "card";

    const main = document.createElement("div");
    const top = document.createElement("div");
    top.className = "card-top";

    const name = document.createElement("h2");
    name.className = "name";
    name.textContent = s.title;
    top.appendChild(name);

    const tag = document.createElement("span");
    tag.className = "project-tag";
    tag.textContent = `${s.count}개 데모`;
    top.appendChild(tag);
    main.appendChild(top);

    if (s.subtitle) {
      const sub = document.createElement("p");
      sub.className = "desc";
      sub.textContent = s.subtitle;
      main.appendChild(sub);
    }

    const urls = document.createElement("div");
    urls.className = "urls";
    const link = document.createElement("a");
    link.href = `/show/${s.slug}`;
    link.textContent = `${location.host}/show/${s.slug}`;
    urls.appendChild(link);
    main.appendChild(urls);

    const side = document.createElement("div");
    side.className = "side";

    const open = document.createElement("a");
    open.className = "btn small";
    open.href = `/show/${s.slug}`;
    open.textContent = "발표 화면";
    side.appendChild(open);

    const row = document.createElement("div");
    row.className = "side-row";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn ghost small";
    edit.textContent = "편집";
    edit.addEventListener("click", () => openEdit(s.slug));
    row.appendChild(edit);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn ghost small danger";
    del.textContent = "삭제";
    del.addEventListener("click", () => removeSet(s));
    row.appendChild(del);
    side.appendChild(row);

    if (s.updatedAt) {
      const when = document.createElement("span");
      when.className = "branch";
      when.textContent = fmtTime(s.updatedAt);
      side.appendChild(when);
    }

    card.appendChild(main);
    card.appendChild(side);
    list.appendChild(card);
  });
}

function askKey() {
  if (!requiresKey) return "";
  const saved = sessionStorage.getItem("catalogEditKey");
  if (saved) return saved;
  const key = window.prompt("편집 비밀번호");
  if (key) sessionStorage.setItem("catalogEditKey", key);
  return key || "";
}

async function removeSet(s) {
  if (!confirm(`"${s.title}" 세트를 삭제할까요?`)) return;
  const key = askKey();
  if (requiresKey && !key) return;
  try {
    const r = await fetch(`/api/sets/${encodeURIComponent(s.slug)}`, {
      method: "DELETE",
      headers: { "X-Edit-Key": key },
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    await load();
  } catch (e) {
    sessionStorage.removeItem("catalogEditKey");
    showError("삭제하지 못했습니다: " + e.message);
  }
}

/* ---------- Editing ------------------------------------------------------- */

function renderEditItems() {
  const box = $("#edItems");
  box.innerHTML = "";
  editing.items.forEach((it, i) => {
    const row = document.createElement("div");
    row.className = "ed-row";

    const head = document.createElement("div");
    head.className = "ed-head";

    const ord = document.createElement("span");
    ord.className = "ed-ord";
    ord.textContent = `${i + 1}.`;
    head.appendChild(ord);

    const nm = document.createElement("input");
    nm.type = "text";
    nm.className = "ed-name";
    nm.placeholder = "발표 화면에 표시할 이름";
    nm.value = it.name || "";
    nm.addEventListener("input", () => {
      it.name = nm.value;
    });
    head.appendChild(nm);

    if (it.missing) {
      const warn = document.createElement("span");
      warn.className = "status stopped";
      warn.textContent = "배포 없음";
      head.appendChild(warn);
    }

    const ctl = document.createElement("span");
    ctl.className = "ed-ctl";
    const mk = (label, title, fn, disabled) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.title = title;
      b.disabled = disabled;
      b.addEventListener("click", fn);
      return b;
    };
    ctl.appendChild(mk("↑", "위로", () => move(i, -1), i === 0));
    ctl.appendChild(mk("↓", "아래로", () => move(i, 1), i === editing.items.length - 1));
    ctl.appendChild(mk("✕", "빼기", () => {
      editing.items.splice(i, 1);
      renderEditItems();
    }, false));
    head.appendChild(ctl);
    row.appendChild(head);

    const note = document.createElement("input");
    note.type = "text";
    note.className = "ed-note";
    note.placeholder = "발표 화면에 표시할 한 줄 설명";
    note.value = it.note || "";
    note.addEventListener("input", () => {
      it.note = note.value;
    });
    row.appendChild(note);

    const url = document.createElement("div");
    url.className = "ed-url";
    url.textContent = it.url;
    row.appendChild(url);

    box.appendChild(row);
  });
}

function move(i, delta) {
  const j = i + delta;
  if (j < 0 || j >= editing.items.length) return;
  [editing.items[i], editing.items[j]] = [editing.items[j], editing.items[i]];
  renderEditItems();
}

async function openEdit(slug) {
  try {
    const r = await fetch(`/api/sets/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    editing = await r.json();
  } catch (e) {
    showError("세트를 불러오지 못했습니다: " + e.message);
    return;
  }
  $("#editTitle").textContent = `${editing.title} 편집`;
  $("#edTitle").value = editing.title;
  $("#edSubtitle").value = editing.subtitle || "";
  $("#edSlug").value = editing.slug;
  $("#edKey").value = sessionStorage.getItem("catalogEditKey") || "";
  $("#edErr").classList.add("hidden");
  renderEditItems();
  $("#editDlg").showModal();
}

async function saveEdit() {
  const err = $("#edErr");
  const key = $("#edKey").value;
  const title = $("#edTitle").value.trim();
  if (!title || (requiresKey && !key)) {
    err.textContent = requiresKey
      ? "세트 이름과 편집 비밀번호를 입력해 주세요."
      : "세트 이름을 입력해 주세요.";
    err.classList.remove("hidden");
    return;
  }
  try {
    const r = await fetch(`/api/sets/${encodeURIComponent(editing.slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Edit-Key": key },
      body: JSON.stringify({
        title,
        subtitle: $("#edSubtitle").value.trim(),
        slug: $("#edSlug").value.trim(),
        items: editing.items.map((it) => ({
          id: it.id,
          name: it.name,
          url: it.url,
          note: it.note || "",
        })),
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    sessionStorage.setItem("catalogEditKey", key);
    $("#editDlg").close();
    await load();
  } catch (e) {
    err.textContent = String(e.message || e);
    err.classList.remove("hidden");
  }
}

async function load() {
  showError("");
  try {
    const r = await fetch("/api/sets", { cache: "no-store" });
    if (!r.ok) throw new Error("API " + r.status);
    const data = await r.json();
    sets = data.sets || [];
    requiresKey = Boolean(data.requiresKey);
    $("#edKeyField").classList.toggle("hidden", !requiresKey);
    renderList();
  } catch (e) {
    showError("세트 목록을 불러오지 못했습니다: " + e.message);
  }
}

$("#edCancel").addEventListener("click", () => $("#editDlg").close());
$("#edSave").addEventListener("click", saveEdit);
$("#editForm").addEventListener("submit", (e) => {
  e.preventDefault();
  saveEdit();
});

load();

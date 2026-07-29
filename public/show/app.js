const $ = (sel) => document.querySelector(sel);

const slug = decodeURIComponent(location.pathname.replace(/^\/show\//, "").replace(/\/$/, ""));

function render(set) {
  document.title = set.title;
  $("#title").textContent = set.title;
  $("#subtitle").textContent = set.subtitle || "";
  $("#subtitle").classList.toggle("hidden", !set.subtitle);

  const grid = $("#grid");
  grid.innerHTML = "";

  set.items.forEach((item, i) => {
    const card = document.createElement("a");
    card.className = "demo" + (item.missing ? " missing" : "");
    card.href = item.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const idx = document.createElement("span");
    idx.className = "idx";
    idx.textContent = String(i + 1).padStart(2, "0");
    card.appendChild(idx);

    const name = document.createElement("h2");
    name.className = "demo-name";
    name.textContent = item.name;
    card.appendChild(name);

    const note = item.note || item.description;
    if (note) {
      const p = document.createElement("p");
      p.className = "demo-note";
      p.textContent = note;
      card.appendChild(p);
    }

    const url = document.createElement("div");
    url.className = "demo-url";
    url.textContent = item.url.replace(/^https?:\/\//, "");
    card.appendChild(url);

    if (item.missing) {
      const flag = document.createElement("span");
      flag.className = "flag";
      flag.textContent = "배포 확인 필요";
      card.appendChild(flag);
    }

    grid.appendChild(card);
  });

  $("#foot").textContent = `${set.items.length}개 데모 · 숫자 키로 바로 열기`;
}

// Number keys open a demo without hunting for it with the mouse mid-presentation.
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const n = Number(e.key);
  if (!Number.isInteger(n) || n < 1) return;
  const card = document.querySelectorAll(".demo")[n - 1];
  if (card) window.open(card.href, "_blank", "noopener");
});

async function load() {
  try {
    const r = await fetch(`/api/sets/${encodeURIComponent(slug)}`, { cache: "no-store" });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    render(data);
  } catch (e) {
    $("#title").textContent = "세트를 찾을 수 없습니다";
    const box = $("#error");
    box.textContent = String(e.message || e);
    box.classList.remove("hidden");
  }
}

load();

function getColor(label) {
  const l = label.toLowerCase();
  if (["male", "female"].includes(l)) return "dodgerblue";
  if (["white", "black", "latino", "asian", "indian", "middle eastern", "mixed", "indigenous", "pacific islander"].includes(l)) return "darkgreen";
  if (["hoodie", "suit", "tactical gear", "casual", "uniform"].includes(l)) return "slategray";
  if (["gun", "knife", "sword"].includes(l)) return "darkred";
  if (["coin", "phone", "computer", "rocket"].includes(l)) return "goldenrod";
  return "gray";
}

function createBar(data) {
  const bar = document.createElement("div");
  bar.style.position = "absolute";
  bar.style.top = "6px";       // ← change to "bottom" or "right" if needed
  bar.style.left = "6px";
  bar.style.zIndex = "99999";
  bar.style.pointerEvents = "none";
  bar.style.display = "flex";
  bar.style.flexWrap = "nowrap";
  bar.style.gap = "4px";
  bar.style.fontSize = "11px";
  bar.style.fontWeight = "bold";

  const intro = document.createElement("div");
  intro.textContent = "AI analysis:";
  intro.style.background = "black";
  intro.style.color = "white";
  intro.style.padding = "2px 6px";
  intro.style.borderRadius = "4px";
  bar.appendChild(intro);

  const fields = ["sex", "race", "clothing", "object"];
  fields.forEach(type => {
    const entry = data[type];
    if (!entry || entry.label === "unknown") return;
    const tag = document.createElement("div");
    tag.textContent = entry.label.toUpperCase();
    tag.style.background = getColor(entry.label);
    tag.style.color = "white";
    tag.style.padding = "2px 6px";
    tag.style.borderRadius = "4px";
    bar.appendChild(tag);
  });

  return bar;
}

function classifyImage(img) {
  if (!img.src.includes("pbs.twimg.com/media")) return;

  fetch("http://127.0.0.1:8000/classify?url=" + encodeURIComponent(img.src))
    .then(r => r.json())
    .then(data => {
      if (!data || data.error) return;

      const bar = createBar(data);

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
      wrapper.appendChild(bar);
    })
    .catch(err => console.warn("HUD error:", err));
}

const observer = new MutationObserver(() => {
  document.querySelectorAll("article img").forEach(img => {
    if (!img.dataset.hudAttached) {
      img.dataset.hudAttached = "true";
      classifyImage(img);
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

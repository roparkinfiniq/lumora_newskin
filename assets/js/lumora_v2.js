(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Mobile sidebar toggle + overlay
  function bindSidebarToggle() {
    $$('[data-action="toggle-sidebar"]').forEach((el) => {
      el.addEventListener("click", () => {
        document.body.classList.toggle("is-sidebar-open");
      });
    });
  }

  // Recently Updated: fetch /rss and render list
  async function loadRecent() {
    const list = $("#recent-list");
    if (!list) return;

    try {
      const res = await fetch("/rss", { cache: "no-store" });
      const txt = await res.text();
      const xml = new DOMParser().parseFromString(txt, "text/xml");
      const items = Array.from(xml.querySelectorAll("item")).slice(0, 8);

      list.innerHTML = "";
      if (!items.length) {
        list.innerHTML = '<li class="recentList__loading">No recent items.</li>';
        return;
      }

      for (const it of items) {
        const title = (it.querySelector("title")?.textContent || "").trim();
        const link = (it.querySelector("link")?.textContent || "").trim();
        const li = document.createElement("li");
        li.innerHTML = `<a href="${link}">${escapeHtml(title || "Untitled")}</a>`;
        list.appendChild(li);
      }
    } catch (e) {
      list.innerHTML = '<li class="recentList__loading">RSS 로드에 실패했습니다.</li>';
    }
  }

  // TOC: build from #post-content h2/h3
  function buildTOC() {
    const content = $("#post-content");
    const toc = $("#toc");
    const tocBody = $("#toc-body");
    const recent = $("#widget-recent");
    if (!content || !toc || !tocBody) return;

    const headings = $$("h2, h3", content).filter((h) => h.textContent.trim().length);
    if (!headings.length) return;

    // If TOC exists, hide recent widget and show TOC
    toc.hidden = false;
    if (recent) recent.style.display = "none";

    // ensure ids
    headings.forEach((h, idx) => {
      if (!h.id) h.id = `h-${idx}-${slugify(h.textContent)}`;
    });

    // render list
    const frag = document.createDocumentFragment();
    headings.forEach((h) => {
      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = h.textContent.trim();
      a.dataset.level = h.tagName.toLowerCase();

      // indent like chirpy
      if (a.dataset.level === "h3") a.style.paddingLeft = "18px";

      frag.appendChild(a);
    });
    tocBody.innerHTML = "";
    tocBody.appendChild(frag);

    // active highlight
    const links = $$("a", tocBody);

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;

        links.forEach((l) =>
          l.classList.toggle("is-active", l.getAttribute("href") === `#${visible.target.id}`)
        );
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] }
    );

    headings.forEach((h) => io.observe(h));
  }

  function slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .slice(0, 40);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>\"']/g, (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m])
    );
  }

  // init
  bindSidebarToggle();
  loadRecent();
  buildTOC();
})();

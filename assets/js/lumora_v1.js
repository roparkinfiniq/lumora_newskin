(() => {
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));

  // Mobile sidebar toggle
  function bindSidebarToggle(){
    $$('[data-action="toggle-sidebar"]').forEach(el => {
      el.addEventListener('click', () => {
        document.body.classList.toggle('is-sidebar-open');
      });
    });
  }

  // Recently Updated: fetch /rss
  async function loadRecent(){
    const list = $('#recent-list');
    if (!list) return;

    try {
      const res = await fetch('/rss', { cache: 'no-store' });
      const txt = await res.text();
      const xml = new DOMParser().parseFromString(txt, 'text/xml');
      const items = Array.from(xml.querySelectorAll('item')).slice(0, 8);

      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<li class="recentList__loading">최근 글이 없습니다.</li>';
        return;
      }

      for (const it of items){
        const title = (it.querySelector('title')?.textContent || '').trim();
        const link = (it.querySelector('link')?.textContent || '').trim();
        const li = document.createElement('li');
        li.innerHTML = `<a href="${link}">${escapeHtml(title || 'Untitled')}</a>`;
        list.appendChild(li);
      }
    } catch (e) {
      // RSS 막히는 케이스 대비
      list.innerHTML = '<li class="recentList__loading">최근 글을 불러오지 못했어. (RSS 접근 제한/에러)</li>';
    }
  }

  // TOC: build from #post-content h2/h3
  function buildTOC(){
    const content = $('#post-content');
    const toc = $('#toc');
    const tocBody = $('#toc-body');
    const recent = $('#widget-recent');
    if (!content || !toc || !tocBody) return;

    const headings = $$('h2, h3', content).filter(h => h.textContent.trim().length);
    if (!headings.length) return;

    // 글 상세면: TOC 보여주고, Recently Updated 숨김
    toc.hidden = false;
    if (recent) recent.style.display = 'none';

    // ensure ids
    headings.forEach((h, idx) => {
      if (!h.id) h.id = `h-${idx}-${slugify(h.textContent)}`;
    });

    // render list
    const frag = document.createDocumentFragment();
    headings.forEach(h => {
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.textContent.trim();
      a.dataset.level = h.tagName.toLowerCase();

      // indent like chirpy
      if (a.dataset.level === 'h3') a.style.paddingLeft = '18px';

      frag.appendChild(a);
    });
    tocBody.innerHTML = '';
    tocBody.appendChild(frag);

    // active highlight
    const links = $$('a', tocBody);
    const map = new Map(headings.map(h => [h.id, h]));

    const io = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => (a.boundingClientRect.top - b.boundingClientRect.top))[0];
      if (!visible) return;

      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${visible.target.id}`));
    }, { rootMargin: '-20% 0px -70% 0px', threshold: [0, 1] });

    headings.forEach(h => io.observe(h));
  }

  function slugify(str){
    return str.toLowerCase()
      .trim()
      .replace(/[^\w가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40);
  }
  function escapeHtml(s){
    return s.replace(/[&<>"']/g, (m) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  // init
  bindSidebarToggle();
  loadRecent();
  buildTOC();
})();

document.addEventListener('DOMContentLoaded', async () => {
  const dashboardEl = document.getElementById('dashboard');
  const dashInner = document.getElementById('dashInner');
  const gridViewEl = document.getElementById('grid-view');
  const gridTitle = document.getElementById('gridTitle');
  const gridContainer = document.getElementById('gridContainer');
  const gridSearch = document.getElementById('gridSearch');
  const gridBack = document.getElementById('gridBack');
  const detailViewEl = document.getElementById('detail-view');
  const detailContent = document.getElementById('detailContent');
  const detailNav = document.getElementById('detailNav');
  const detailBack = document.getElementById('detailBack');

  let allLearnings = [];
  let allEpisodes = [];

  const categoryOrder = [
    'Strategy & Positioning',
    'Growth & Scaling',
    'Building & Innovation',
    'Customer & Brand',
    'Career & Skills',
    'Risk & Resilience'
  ];

  // Emojis only for rail HEADERS, not cards
  const categoryEmojis = {
    'Strategy & Positioning': '\u2693\ufe0f',
    'Growth & Scaling': '\ud83d\udcc8',
    'Building & Innovation': '\ud83d\udee0\ufe0f',
    'Customer & Brand': '\u2764\ufe0f',
    'Career & Skills': '\u2b50',
    'Risk & Resilience': '\u26a1'
  };

  // --- Fetch ---
  try {
    const [lRes, eRes] = await Promise.all([
      fetch('/api/learnings'),
      fetch('/api/insights')
    ]);
    allLearnings = await lRes.json();
    allEpisodes = await eRes.json();
  } catch (err) {
    dashInner.innerHTML = '<div class="insights-empty">Failed to load data.</div>';
    return;
  }

  // --- Helpers ---
  function formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function truncate(text, n) {
    return text.length <= n ? text : text.substring(0, n).trim() + '\u2026';
  }

  // --- Views ---
  function showView(view) {
    dashboardEl.style.display = view === 'dashboard' ? '' : 'none';
    gridViewEl.style.display = view === 'grid' ? '' : 'none';
    detailViewEl.style.display = view === 'detail' ? '' : 'none';
    window.scrollTo(0, 0);
  }

  // ════════════════════════════════════════
  // EPISODE CARD
  // ════════════════════════════════════════
  function episodeCard(ep, isGrid) {
    const d = new Date(ep.date + 'T12:00:00');
    const stories = ep.stories || [];
    return `
      <a href="/insight.html?slug=${ep.slug}" class="ep-card ${isGrid ? 'ep-grid-card' : 'ep-rail-card'}">
        <div class="ep-card-date">
          <span class="ep-card-day">${d.getDate()}</span>
          <span class="ep-card-month">${d.toLocaleDateString('en-US', { month: 'short' })}</span>
        </div>
        <div class="ep-card-body">
          <h3 class="ep-card-title">${ep.title}</h3>
          <p class="ep-card-meta">${formatDateShort(ep.date)} &middot; ${stories.length} stories</p>
        </div>
      </a>`;
  }

  // ════════════════════════════════════════
  // LEARNING CARD (no emojis, click → detail)
  // ════════════════════════════════════════
  function learningCard(l, isGrid, railItems) {
    return `
      <div class="ln-card ${isGrid ? 'ln-grid-card' : 'ln-rail-card'}" data-id="${l.id}" data-cat="${l.category}">
        <span class="ln-card-company">${l.company}</span>
        <p class="ln-card-lesson">${l.lesson}</p>
        <p class="ln-card-remember">${l.rememberThis}</p>
      </div>`;
  }

  // ════════════════════════════════════════
  // RAIL BUILDER (with chevrons)
  // ════════════════════════════════════════
  function buildRail(title, seeAllHash, cardsHtml) {
    const id = 'rail-' + seeAllHash.replace(/[^a-zA-Z0-9]/g, '-');
    return `
      <section class="bi-rail">
        <div class="bi-rail-header">
          <h2 class="bi-rail-title">${title}</h2>
          <a href="#${seeAllHash}" class="bi-rail-see-all" data-hash="${seeAllHash}">See All</a>
        </div>
        <div class="bi-rail-track">
          <button class="rail-chevron rail-chevron-left" data-rail="${id}" aria-label="Scroll left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="bi-rail-row" id="${id}">${cardsHtml}</div>
          <button class="rail-chevron rail-chevron-right" data-rail="${id}" aria-label="Scroll right">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
          </button>
        </div>
      </section>`;
  }

  // ════════════════════════════════════════
  // DASHBOARD
  // ════════════════════════════════════════
  function renderDashboard() {
    let html = '';

    // Episodes rail
    html += buildRail('Latest Episodes', 'episodes',
      allEpisodes.slice(0, 8).map(ep => episodeCard(ep, false)).join('')
    );

    // Category rails
    for (const cat of categoryOrder) {
      const items = allLearnings.filter(l => l.category === cat);
      if (!items.length) continue;
      const emoji = categoryEmojis[cat] || '';
      html += buildRail(`${emoji} ${cat}`, `cat:${cat}`,
        items.map(l => learningCard(l, false, items)).join('')
      );
    }

    dashInner.innerHTML = html;

    // Chevron scroll
    dashInner.querySelectorAll('.rail-chevron').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = document.getElementById(btn.dataset.rail);
        const dir = btn.classList.contains('rail-chevron-left') ? -1 : 1;
        row.scrollBy({ left: dir * (row.clientWidth * 0.8), behavior: 'smooth' });
      });
    });

    // Update chevron visibility on scroll
    dashInner.querySelectorAll('.bi-rail-row').forEach(row => {
      const updateChevrons = () => {
        const track = row.closest('.bi-rail-track');
        const leftBtn = track.querySelector('.rail-chevron-left');
        const rightBtn = track.querySelector('.rail-chevron-right');
        leftBtn.style.opacity = row.scrollLeft > 10 ? '1' : '0';
        leftBtn.style.pointerEvents = row.scrollLeft > 10 ? 'auto' : 'none';
        rightBtn.style.opacity = (row.scrollLeft + row.clientWidth < row.scrollWidth - 10) ? '1' : '0';
        rightBtn.style.pointerEvents = (row.scrollLeft + row.clientWidth < row.scrollWidth - 10) ? 'auto' : 'none';
      };
      row.addEventListener('scroll', updateChevrons);
      setTimeout(updateChevrons, 100);
    });

    // See all links
    dashInner.querySelectorAll('.bi-rail-see-all').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = link.dataset.hash;
      });
    });

    // Learning card clicks → detail
    attachCardClicks(dashInner);
  }

  // ════════════════════════════════════════
  // GRID VIEW
  // ════════════════════════════════════════
  let currentGridType = null;
  let currentGridCategory = null;

  function showGridView(type, category) {
    currentGridType = type;
    currentGridCategory = category;
    showView('grid');
    gridSearch.value = '';

    if (type === 'episodes') {
      gridTitle.textContent = 'All Episodes';
      renderGridItems(allEpisodes, 'episodes');
    } else {
      gridTitle.textContent = category;
      renderGridItems(allLearnings.filter(l => l.category === category), 'learnings');
    }
  }

  function renderGridItems(items, type) {
    if (type === 'episodes') {
      gridContainer.innerHTML = items.map(ep => episodeCard(ep, true)).join('');
    } else {
      gridContainer.innerHTML = items.map(l => learningCard(l, true)).join('');
      attachCardClicks(gridContainer);
    }
  }

  gridSearch.addEventListener('input', () => {
    const q = gridSearch.value.toLowerCase().trim();
    if (currentGridType === 'episodes') {
      const f = allEpisodes.filter(ep =>
        ep.title.toLowerCase().includes(q) ||
        (ep.stories || []).some(s => s.toLowerCase().includes(q))
      );
      renderGridItems(f, 'episodes');
    } else {
      const base = allLearnings.filter(l => l.category === currentGridCategory);
      const f = base.filter(l =>
        l.lesson.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.rememberThis.toLowerCase().includes(q)
      );
      renderGridItems(f, 'learnings');
    }
  });

  gridBack.addEventListener('click', () => {
    window.location.hash = '';
  });

  // ════════════════════════════════════════
  // DETAIL VIEW (single learning)
  // ════════════════════════════════════════
  let detailRailItems = [];
  let detailIndex = 0;

  function showDetail(learningId) {
    const learning = allLearnings.find(l => l.id === learningId);
    if (!learning) return;

    // Build the rail this card belongs to
    detailRailItems = allLearnings.filter(l => l.category === learning.category);
    detailIndex = detailRailItems.findIndex(l => l.id === learningId);

    renderDetail(learning);
    showView('detail');
    window.location.hash = `detail:${learningId}`;
  }

  function renderDetail(l) {
    detailContent.innerHTML = `
      <div class="detail-category">${l.category}</div>
      <h1 class="detail-title">${l.lesson}</h1>
      <p class="detail-remember">${l.rememberThis}</p>
      <div class="detail-divider"></div>
      <div class="detail-section">
        <h3 class="detail-label">The Full Lesson</h3>
        <p class="detail-text">${l.detail}</p>
      </div>
      <div class="detail-section">
        <h3 class="detail-label">How You Could Use This</h3>
        <p class="detail-text">${l.useThis}</p>
      </div>
      <div class="detail-divider"></div>
      <div class="detail-meta">
        <span class="detail-meta-company">${l.company}</span>
        <span class="detail-meta-sep">&middot;</span>
        <a href="/insight.html?slug=${l.episodeSlug}" class="detail-meta-link">From "${l.episodeTitle}" &rarr;</a>
      </div>
    `;

    // Prev / Next nav
    const prev = detailIndex > 0 ? detailRailItems[detailIndex - 1] : null;
    const next = detailIndex < detailRailItems.length - 1 ? detailRailItems[detailIndex + 1] : null;

    detailNav.innerHTML = `
      <div class="detail-nav-inner">
        ${prev ? `<button class="detail-nav-btn detail-nav-prev" data-id="${prev.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <div class="detail-nav-label">
            <span class="detail-nav-dir">Previous</span>
            <span class="detail-nav-preview">${truncate(prev.lesson, 50)}</span>
          </div>
        </button>` : '<div></div>'}
        ${next ? `<button class="detail-nav-btn detail-nav-next" data-id="${next.id}">
          <div class="detail-nav-label" style="text-align:right">
            <span class="detail-nav-dir">Next</span>
            <span class="detail-nav-preview">${truncate(next.lesson, 50)}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
        </button>` : '<div></div>'}
      </div>
    `;

    detailNav.querySelectorAll('.detail-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const l = allLearnings.find(x => x.id === id);
        if (!l) return;
        detailIndex = detailRailItems.findIndex(x => x.id === id);
        renderDetail(l);
        window.scrollTo(0, 0);
        history.replaceState(null, '', `#detail:${id}`);
      });
    });
  }

  detailBack.addEventListener('click', () => {
    if (detailRailItems.length > 0) {
      const cat = detailRailItems[0].category;
      window.location.hash = `cat:${cat}`;
    } else {
      window.location.hash = '';
    }
  });

  // ════════════════════════════════════════
  // CARD CLICK → DETAIL
  // ════════════════════════════════════════
  function attachCardClicks(container) {
    container.querySelectorAll('.ln-card').forEach(card => {
      card.addEventListener('click', () => {
        showDetail(card.dataset.id);
      });
    });
  }

  // ════════════════════════════════════════
  // HASH ROUTING
  // ════════════════════════════════════════
  function handleHash() {
    const hash = decodeURIComponent(window.location.hash.replace('#', ''));
    if (!hash) {
      showView('dashboard');
      return;
    }
    if (hash === 'episodes') {
      showGridView('episodes');
    } else if (hash.startsWith('cat:')) {
      showGridView('learnings', hash.substring(4));
    } else if (hash.startsWith('detail:')) {
      showDetail(hash.substring(7));
    } else {
      showView('dashboard');
    }
  }

  window.addEventListener('hashchange', handleHash);

  // ════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════
  renderDashboard();
  if (window.location.hash) handleHash();
});

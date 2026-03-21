document.addEventListener('DOMContentLoaded', async () => {
  const dashboardEl = document.getElementById('dashboard');
  const dashInner = document.querySelector('.bi-dashboard-inner');
  const gridViewEl = document.getElementById('grid-view');
  const gridTitle = document.getElementById('gridTitle');
  const gridContainer = document.getElementById('gridContainer');
  const gridSearch = document.getElementById('gridSearch');
  const gridBack = document.getElementById('gridBack');

  let allLearnings = [];
  let allEpisodes = [];

  const categoryIcons = {
    'Strategy & Positioning': '\u2693',
    'Growth & Scaling': '\u2197',
    'Building & Innovation': '\u2692',
    'Customer & Brand': '\u2764',
    'Career & Skills': '\u2b50',
    'Risk & Resilience': '\u26a1'
  };

  const categoryOrder = [
    'Strategy & Positioning',
    'Growth & Scaling',
    'Building & Innovation',
    'Customer & Brand',
    'Career & Skills',
    'Risk & Resilience'
  ];

  // --- Fetch data ---
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
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatDateFull(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function truncate(text, maxLen) {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen).trim() + '...';
  }

  // --- Episode card (rail + grid) ---
  function episodeCard(ep, isGrid) {
    const d = new Date(ep.date + 'T12:00:00');
    const storyCount = ep.stories ? ep.stories.length : 3;
    const cls = isGrid ? 'ep-card ep-grid-card' : 'ep-card ep-rail-card';
    return `
      <a href="/insight.html?slug=${ep.slug}" class="${cls}">
        <div class="ep-card-date">
          <span class="ep-card-day">${d.getDate()}</span>
          <span class="ep-card-month">${d.toLocaleDateString('en-US', { month: 'short' })}</span>
        </div>
        <div class="ep-card-body">
          <h3 class="ep-card-title">${ep.title}</h3>
          <p class="ep-card-meta">${formatDateFull(ep.date)} &middot; ${storyCount} stories</p>
          ${ep.stories ? `<div class="ep-card-chips">${ep.stories.map(s => `<span class="ep-card-chip">${truncate(s, 30)}</span>`).join('')}</div>` : ''}
        </div>
      </a>
    `;
  }

  // --- Learning card (rail + grid) ---
  function learningCard(l, isGrid) {
    const cls = isGrid ? 'ln-card ln-grid-card' : 'ln-card ln-rail-card';
    return `
      <div class="${cls}" data-id="${l.id}">
        <div class="ln-card-top">
          <span class="ln-card-icon">${categoryIcons[l.category] || ''}</span>
          <span class="ln-card-company">${l.company}</span>
        </div>
        <p class="ln-card-lesson">${isGrid ? l.lesson : truncate(l.lesson, 100)}</p>
        <p class="ln-card-remember">${isGrid ? l.rememberThis : truncate(l.rememberThis, 80)}</p>
        <div class="ln-card-detail">
          <div class="learning-detail-section">
            <h4 class="learning-detail-label">The full lesson</h4>
            <p>${l.detail}</p>
          </div>
          <div class="learning-detail-section">
            <h4 class="learning-detail-label">How you could use this</h4>
            <p>${l.useThis}</p>
          </div>
          <a href="/insight.html?slug=${l.episodeSlug}" class="learning-source">
            Read full story: ${l.storyTitle} &rarr;
          </a>
        </div>
      </div>
    `;
  }

  // --- Build a rail ---
  function buildRail(title, icon, seeAllHash, cardsHtml) {
    return `
      <section class="bi-rail">
        <div class="bi-rail-header">
          <h2 class="bi-rail-title">${icon ? `<span class="rail-icon">${icon}</span> ` : ''}${title}</h2>
          <a href="#${seeAllHash}" class="bi-rail-see-all" data-hash="${seeAllHash}">See All &rarr;</a>
        </div>
        <div class="bi-rail-row">${cardsHtml}</div>
      </section>
    `;
  }

  // --- Render Dashboard ---
  function renderDashboard() {
    let html = '';

    // Episodes rail
    const recentEps = allEpisodes.slice(0, 8);
    html += buildRail('Latest Episodes', '', 'episodes',
      recentEps.map(ep => episodeCard(ep, false)).join('')
    );

    // Learning rails by category
    for (const cat of categoryOrder) {
      const items = allLearnings.filter(l => l.category === cat);
      if (!items.length) continue;
      html += buildRail(cat, categoryIcons[cat], `cat:${cat}`,
        items.map(l => learningCard(l, false)).join('')
      );
    }

    dashInner.innerHTML = html;

    // Attach see-all clicks
    dashInner.querySelectorAll('.bi-rail-see-all').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const hash = link.dataset.hash;
        window.location.hash = hash;
      });
    });

    // Attach learning card expand
    attachLearningExpand(dashInner);
  }

  // --- Grid View ---
  let currentGridType = null;
  let currentGridCategory = null;
  let currentGridItems = [];

  function showGridView(type, category) {
    currentGridType = type;
    currentGridCategory = category;
    dashboardEl.style.display = 'none';
    gridViewEl.style.display = '';
    gridSearch.value = '';

    if (type === 'episodes') {
      gridTitle.textContent = 'All Episodes';
      currentGridItems = allEpisodes;
      renderGridEpisodes(allEpisodes);
    } else {
      gridTitle.textContent = category;
      currentGridItems = allLearnings.filter(l => l.category === category);
      renderGridLearnings(currentGridItems);
    }

    window.scrollTo(0, 0);
  }

  function renderGridEpisodes(items) {
    gridContainer.innerHTML = items.map(ep => episodeCard(ep, true)).join('');
  }

  function renderGridLearnings(items) {
    gridContainer.innerHTML = items.map(l => learningCard(l, true)).join('');
    attachLearningExpand(gridContainer);
  }

  function showDashboard() {
    gridViewEl.style.display = 'none';
    dashboardEl.style.display = '';
    window.location.hash = '';
    window.scrollTo(0, 0);
  }

  // Search
  gridSearch.addEventListener('input', () => {
    const q = gridSearch.value.toLowerCase().trim();
    if (currentGridType === 'episodes') {
      const filtered = allEpisodes.filter(ep =>
        ep.title.toLowerCase().includes(q) ||
        (ep.stories || []).some(s => s.toLowerCase().includes(q)) ||
        ep.date.includes(q)
      );
      renderGridEpisodes(filtered);
    } else {
      const base = allLearnings.filter(l => l.category === currentGridCategory);
      const filtered = base.filter(l =>
        l.lesson.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.rememberThis.toLowerCase().includes(q) ||
        l.storyTitle.toLowerCase().includes(q)
      );
      renderGridLearnings(filtered);
    }
  });

  // Back button
  gridBack.addEventListener('click', showDashboard);

  // --- Learning card expand/collapse ---
  function attachLearningExpand(container) {
    container.querySelectorAll('.ln-card').forEach(card => {
      // Remove existing listeners by cloning
      const top = card.querySelector('.ln-card-top, .ln-card-lesson, .ln-card-remember');
      card.addEventListener('click', (e) => {
        // Don't toggle if clicking a link inside detail
        if (e.target.closest('.ln-card-detail a')) return;
        if (e.target.closest('.ln-card-detail')) return;
        card.classList.toggle('ln-card-open');
      });
    });
  }

  // --- Hash Routing ---
  function handleHash() {
    const hash = decodeURIComponent(window.location.hash.replace('#', ''));
    if (!hash) {
      showDashboard();
      return;
    }
    if (hash === 'episodes') {
      showGridView('episodes');
    } else if (hash.startsWith('cat:')) {
      const cat = hash.substring(4);
      showGridView('learnings', cat);
    } else {
      showDashboard();
    }
  }

  window.addEventListener('hashchange', handleHash);

  // --- Init ---
  renderDashboard();

  // Check initial hash
  const initHash = window.location.hash.replace('#', '');
  if (initHash) {
    handleHash();
  }
});

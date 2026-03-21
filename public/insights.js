document.addEventListener('DOMContentLoaded', async () => {
  // --- Tab switching ---
  const tabs = document.querySelectorAll('.bi-nav-tab');
  const tabLearnings = document.getElementById('tab-learnings');
  const tabEpisodes = document.getElementById('tab-episodes');

  function switchTab(tabName) {
    tabs.forEach(t => t.classList.toggle('bi-nav-tab-active', t.dataset.tab === tabName));
    tabLearnings.style.display = tabName === 'learnings' ? '' : 'none';
    tabEpisodes.style.display = tabName === 'episodes' ? '' : 'none';
    window.location.hash = tabName;
  }

  tabs.forEach(t => t.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(t.dataset.tab);
  }));

  // Default tab from hash or learnings
  const hash = window.location.hash.replace('#', '');
  switchTab(hash === 'episodes' ? 'episodes' : 'learnings');

  // Handle back/forward
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    switchTab(h === 'episodes' ? 'episodes' : 'learnings');
  });

  // --- Fetch data ---
  const [learningsRes, episodesRes] = await Promise.all([
    fetch('/api/learnings'),
    fetch('/api/insights')
  ]);

  const allLearnings = await learningsRes.json();
  const allEpisodes = await episodesRes.json();

  // --- Learnings ---
  const chipsEl = document.getElementById('filterChips');
  const learningsListEl = document.getElementById('learningsList');
  const countEl = document.getElementById('learningsCount');
  let activeCategory = 'All';

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
  const categories = categoryOrder.filter(c => allLearnings.some(l => l.category === c));

  function renderChips() {
    const allChip = `<button class="filter-chip ${activeCategory === 'All' ? 'filter-chip-active' : ''}" data-cat="All">All</button>`;
    const catChips = categories.map(c =>
      `<button class="filter-chip ${activeCategory === c ? 'filter-chip-active' : ''}" data-cat="${c}">
        <span class="chip-icon">${categoryIcons[c] || ''}</span> ${c}
      </button>`
    ).join('');
    chipsEl.innerHTML = allChip + catChips;

    chipsEl.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderChips();
        renderLearnings();
      });
    });
  }

  function renderLearnings() {
    const filtered = activeCategory === 'All'
      ? allLearnings
      : allLearnings.filter(l => l.category === activeCategory);

    countEl.textContent = `${filtered.length} lesson${filtered.length !== 1 ? 's' : ''}`;

    if (!filtered.length) {
      learningsListEl.innerHTML = '<div class="insights-empty">No learnings in this category.</div>';
      return;
    }

    const grouped = {};
    for (const l of filtered) {
      if (!grouped[l.category]) grouped[l.category] = [];
      grouped[l.category].push(l);
    }

    let html = '';
    for (const cat of categoryOrder) {
      if (!grouped[cat]) continue;
      html += `<div class="learning-group">
        <h2 class="learning-group-title"><span class="group-icon">${categoryIcons[cat] || ''}</span> ${cat}</h2>
        <div class="learning-group-items">`;

      for (const l of grouped[cat]) {
        const date = new Date(l.episodeSlug + 'T12:00:00');
        const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        html += `
          <div class="learning-card" data-id="${l.id}">
            <div class="learning-card-main">
              <div class="learning-card-content">
                <p class="learning-lesson">${l.lesson}</p>
                <p class="learning-remember">${l.rememberThis}</p>
                <div class="learning-meta">
                  <span class="learning-company">${l.company}</span>
                  <span class="learning-dot">&middot;</span>
                  <span class="learning-date">${formatted}</span>
                </div>
              </div>
              <button class="learning-expand" aria-label="Expand">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>
            <div class="learning-card-detail">
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

      html += '</div></div>';
    }

    learningsListEl.innerHTML = html;

    learningsListEl.querySelectorAll('.learning-card').forEach(card => {
      const mainEl = card.querySelector('.learning-card-main');
      mainEl.addEventListener('click', () => {
        card.classList.toggle('learning-card-open');
      });
    });
  }

  renderChips();
  renderLearnings();

  // --- Episodes ---
  const episodesListEl = document.getElementById('insightsList');

  if (!allEpisodes.length) {
    episodesListEl.innerHTML = '<div class="insights-empty">No episodes yet.</div>';
  } else {
    episodesListEl.innerHTML = allEpisodes.map(ep => {
      const date = new Date(ep.date + 'T12:00:00');
      const formatted = date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });
      const storyCount = ep.stories ? ep.stories.length : 3;

      return `
        <a href="/insight.html?slug=${ep.slug}" class="insight-card">
          <div class="insight-card-date">
            <span class="insight-card-day">${date.getDate()}</span>
            <span class="insight-card-month">${date.toLocaleDateString('en-US', { month: 'short' })}</span>
          </div>
          <div class="insight-card-body">
            <h3 class="insight-card-title">${ep.title}</h3>
            <p class="insight-card-meta">${formatted} &middot; ${storyCount} stories</p>
            ${ep.stories ? `<div class="insight-card-stories">${ep.stories.map(s => `<span class="insight-card-story">${s}</span>`).join('')}</div>` : ''}
          </div>
          <span class="insight-card-arrow">&rarr;</span>
        </a>
      `;
    }).join('');
  }
});

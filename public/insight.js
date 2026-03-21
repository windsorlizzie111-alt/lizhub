document.addEventListener('DOMContentLoaded', async () => {
  const slug = new URLSearchParams(window.location.search).get('slug');
  const metaEl = document.getElementById('insightMeta');
  const contentEl = document.getElementById('insightContent');
  const navEl = document.getElementById('insightNav');

  if (!slug) {
    contentEl.innerHTML = '<div class="insights-empty">No episode specified.</div>';
    return;
  }

  try {
    // Fetch the episode and manifest in parallel
    const [epRes, listRes] = await Promise.all([
      fetch(`/api/insights/${slug}`),
      fetch('/api/insights')
    ]);

    if (!epRes.ok) {
      contentEl.innerHTML = '<div class="insights-empty">Episode not found.</div>';
      return;
    }

    const ep = await epRes.json();
    const episodes = await listRes.json();

    // Set page title
    document.title = `${ep.title} - Business Insights - LizHub`;

    // Render metadata
    const date = new Date(ep.date + 'T12:00:00');
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    metaEl.innerHTML = `
      <div class="insight-date-badge">${formatted}</div>
      <h1 class="insight-title">${ep.title}</h1>
      <p class="insight-hosts">The Best One Yet &middot; Nick Martell & Jack Crivici-Kramer</p>
    `;

    // Render content
    contentEl.innerHTML = ep.contentHtml;

    // Build prev/next navigation
    const currentIdx = episodes.findIndex(e => e.slug === slug);
    let navHtml = '';

    if (currentIdx < episodes.length - 1) {
      const prev = episodes[currentIdx + 1];
      navHtml += `<a href="/insight.html?slug=${prev.slug}" class="insight-nav-link insight-nav-prev">
        <span class="insight-nav-label">&larr; Older</span>
        <span class="insight-nav-title">${prev.title}</span>
      </a>`;
    } else {
      navHtml += '<div></div>';
    }

    if (currentIdx > 0) {
      const next = episodes[currentIdx - 1];
      navHtml += `<a href="/insight.html?slug=${next.slug}" class="insight-nav-link insight-nav-next">
        <span class="insight-nav-label">Newer &rarr;</span>
        <span class="insight-nav-title">${next.title}</span>
      </a>`;
    }

    navEl.innerHTML = navHtml;
  } catch (err) {
    contentEl.innerHTML = '<div class="insights-empty">Failed to load episode.</div>';
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('insightsList');

  try {
    const res = await fetch('/api/insights');
    const episodes = await res.json();

    if (!episodes.length) {
      list.innerHTML = '<div class="insights-empty">No episodes yet. Check back soon.</div>';
      return;
    }

    list.innerHTML = episodes.map(ep => {
      const date = new Date(ep.date + 'T12:00:00');
      const formatted = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
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
  } catch (err) {
    list.innerHTML = '<div class="insights-empty">Failed to load episodes.</div>';
  }
});

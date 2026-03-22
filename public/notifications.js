// ════════════════════════════════════════
// NOTIFICATIONS — shared across all pages
// ════════════════════════════════════════
(function () {
  const bell = document.getElementById('notifBell');
  const badge = document.getElementById('notifBadge');
  const panel = document.getElementById('notifPanel');
  const body = document.getElementById('notifPanelBody');
  const markAll = document.getElementById('notifMarkAll');
  if (!bell) return;

  let notifications = [];
  let panelOpen = false;

  function formatTimestamp(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return diffMin + 'm ago';
    if (diffHr < 24) return diffHr + 'h ago';
    if (diffDay < 7) return diffDay + 'd ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function renderPanel() {
    if (!notifications.length) {
      body.innerHTML = '<div class="notif-empty">No notifications yet</div>';
      return;
    }

    body.innerHTML = notifications.map(n => {
      const icon = n.type === 'insight_posted'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

      const unreadClass = n.read ? '' : ' notif-item-unread';
      const link = n.link ? ` data-link="${n.link}"` : '';

      return `<div class="notif-item${unreadClass}" data-id="${n.id}"${link}>
        <div class="notif-item-icon">${icon}</div>
        <div class="notif-item-content">
          <p class="notif-item-message">${n.message}</p>
          <span class="notif-item-time">${formatTimestamp(n.timestamp)}</span>
        </div>
        ${!n.read ? '<div class="notif-item-dot"></div>' : ''}
      </div>`;
    }).join('');

    // Click to mark read + navigate
    body.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = item.dataset.id;
        const link = item.dataset.link;
        const notif = notifications.find(n => n.id === id);
        if (notif && !notif.read) {
          notif.read = true;
          await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
          updateBadge();
          renderPanel();
        }
        if (link) window.location.href = link;
      });
    });
  }

  function updateBadge() {
    const unread = notifications.filter(n => !n.read).length;
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : unread;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications?limit=30');
      notifications = await res.json();
      updateBadge();
      if (panelOpen) renderPanel();
    } catch (e) { /* silent */ }
  }

  // Toggle panel
  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    panelOpen = !panelOpen;
    panel.style.display = panelOpen ? '' : 'none';
    if (panelOpen) renderPanel();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (panelOpen && !panel.contains(e.target) && e.target !== bell) {
      panelOpen = false;
      panel.style.display = 'none';
    }
  });

  // Mark all read
  markAll.addEventListener('click', async (e) => {
    e.stopPropagation();
    notifications.forEach(n => n.read = true);
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
    updateBadge();
    renderPanel();
  });

  // Init
  loadNotifications();

  // Poll every 60s for new notifications
  setInterval(loadNotifications, 60000);
})();

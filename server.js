const express = require('express');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 3888;

const INSIGHTS_DIR = path.join(__dirname, 'data', 'insights');
const MANIFEST_PATH = path.join(INSIGHTS_DIR, 'manifest.json');
const NOTIFICATIONS_PATH = path.join(__dirname, 'data', 'notifications.json');

// API: list all insights
app.get('/api/insights', (req, res) => {
  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    manifest.sort((a, b) => b.date.localeCompare(a.date));
    res.json(manifest);
  } catch (err) {
    res.status(500).json({ error: 'Could not load insights' });
  }
});

// API: get a single insight by slug
app.get('/api/insights/:slug', (req, res) => {
  const slug = req.params.slug;
  const filePath = path.join(INSIGHTS_DIR, `tboy-${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Insight not found' });
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const contentHtml = marked(raw);

    // Extract metadata from the manifest
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    const entry = manifest.find(e => e.slug === slug) || {};

    res.json({
      slug,
      date: entry.date || slug,
      title: entry.title || 'Episode Breakdown',
      stories: entry.stories || [],
      contentHtml
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not load insight' });
  }
});

// API: list all learnings
app.get('/api/learnings', (req, res) => {
  try {
    const learnings = JSON.parse(fs.readFileSync(path.join(INSIGHTS_DIR, 'learnings.json'), 'utf-8'));
    const category = req.query.category;
    const filtered = category ? learnings.filter(l => l.category === category) : learnings;
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Could not load learnings' });
  }
});

// API: list notifications (newest first)
app.get('/api/notifications', (req, res) => {
  try {
    const notifications = JSON.parse(fs.readFileSync(NOTIFICATIONS_PATH, 'utf-8'));
    notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const limit = parseInt(req.query.limit) || 50;
    res.json(notifications.slice(0, limit));
  } catch (err) {
    res.status(500).json({ error: 'Could not load notifications' });
  }
});

// API: mark notification as read
app.patch('/api/notifications/:id/read', (req, res) => {
  try {
    const notifications = JSON.parse(fs.readFileSync(NOTIFICATIONS_PATH, 'utf-8'));
    const notif = notifications.find(n => n.id === req.params.id);
    if (!notif) return res.status(404).json({ error: 'Not found' });
    notif.read = true;
    fs.writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(notifications, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not update notification' });
  }
});

// API: mark all notifications as read
app.patch('/api/notifications/read-all', (req, res) => {
  try {
    const notifications = JSON.parse(fs.readFileSync(NOTIFICATIONS_PATH, 'utf-8'));
    notifications.forEach(n => n.read = true);
    fs.writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(notifications, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not update notifications' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`LizHub running on http://localhost:${PORT}`);
});

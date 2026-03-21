// Focus search on "/" key
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
});

// Escape to blur search
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') e.target.blur();
});

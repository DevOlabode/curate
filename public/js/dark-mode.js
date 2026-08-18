// Dark Mode Toggle
(function() {
  var html = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var saved = localStorage.getItem('curate-theme') || localStorage.getItem('dev-bookmark-theme') || 'light';
  html.setAttribute('data-theme', saved);
  updateIcon(saved);
  
  if (btn) {
    btn.addEventListener('click', function() {
      var current = html.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('curate-theme', next);
      updateIcon(next);
    });
  }
  
  function updateIcon(theme) {
    if (!btn) return;
    var icon = btn.querySelector('i');
    if (!icon) return;
    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
      btn.title = 'Switch to light mode';
    } else {
      icon.className = 'fas fa-moon';
      btn.title = 'Switch to dark mode';
    }
  }
})();

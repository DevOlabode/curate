(function () {
  var html = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var saved = localStorage.getItem('curate-theme') || 'light';
  html.setAttribute('data-theme', saved);

  if (!btn) return;

  btn.addEventListener('click', function () {
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('curate-theme', next);
    btn.title = next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  });
})();

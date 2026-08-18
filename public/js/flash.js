document.addEventListener('DOMContentLoaded', () => {
  const duration = 5500;

  document.querySelectorAll('.flash').forEach((flash) => {
    let remaining = duration;
    let startedAt = Date.now();
    let timer = setTimeout(dismiss, remaining);

    function dismiss() {
      if (flash.classList.contains('is-leaving')) return;
      flash.classList.add('is-leaving');
      setTimeout(() => flash.remove(), 320);
    }

    flash.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      remaining -= Date.now() - startedAt;
      flash.style.setProperty('--flash-pause', 'paused');
    });

    flash.addEventListener('mouseleave', () => {
      startedAt = Date.now();
      timer = setTimeout(dismiss, Math.max(remaining, 800));
      flash.style.setProperty('--flash-pause', 'running');
    });

    flash.querySelector('.flash-close')?.addEventListener('click', () => {
      clearTimeout(timer);
      dismiss();
    });
  });
});

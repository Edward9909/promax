// ---- VIDEO CROSSFADE LOOP ----
(function() {
  const vidA = document.getElementById('vidA');
  const vidB = document.getElementById('vidB');
  if (!vidA || !vidB) return;

  const FADE_BEFORE = 1.8; // segundos antes del final para iniciar crossfade
  let active = vidA;
  let standby = vidB;
  let crossfading = false;

  function startVideo(v) {
    v.currentTime = 0;
    v.play().catch(() => {});
  }

  function crossfade() {
    if (crossfading) return;
    crossfading = true;

    // Prepara el video standby desde el inicio
    standby.currentTime = 0;
    standby.play().catch(() => {});

    // Aplica clases de transición
    active.classList.add('fading-out');
    standby.classList.add('fading-in');
    standby.classList.remove('vid-b');
    standby.classList.add('vid-a');
    active.classList.remove('vid-a');
    active.classList.add('vid-b');

    // Después del fade, el standby se convierte en activo
    setTimeout(() => {
      active.classList.remove('fading-out');
      standby.classList.remove('fading-in');

      // Intercambia roles
      const temp = active;
      active   = standby;
      standby  = temp;

      // El standby (anterior activo) se pausa y oculta
      standby.pause();
      standby.classList.remove('vid-a');
      standby.classList.add('vid-b');

      crossfading = false;
    }, 1900);
  }

  // Inicia el primer video. En mobile, muted + playsinline + autoplay permite reproducir sin gesto.
  vidA.muted = true;
  vidA.playsInline = true;
  vidA.play().catch(() => {});
  vidA.addEventListener('canplay', () => { vidA.play().catch(() => {}); }, { once: true });
  vidA.load();

  // Monitorea el tiempo para iniciar el crossfade antes del final
  vidA.addEventListener('timeupdate', function monitor() {
    if (!vidA.duration) return;
    if (vidA.currentTime >= vidA.duration - FADE_BEFORE) {
      vidA.removeEventListener('timeupdate', monitor);
      crossfade();
    }
  });

  // Cada vez que el video activo se acerque al final, crossfade de nuevo
  function watchActive() {
    if (!active.duration) return;
    const check = setInterval(() => {
      if (active.currentTime >= active.duration - FADE_BEFORE) {
        clearInterval(check);
        crossfade();
        setTimeout(watchActive, 500);
      }
    }, 250);
  }
  setTimeout(watchActive, 2000);
})();

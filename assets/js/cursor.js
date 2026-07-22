// CURSOR
const cursor = document.getElementById('cursor');
window.promaxCursor = cursor;
const cursorDot = document.getElementById('cursor-dot');
document.addEventListener('mousemove', e => {
  gsap.to(cursor,    { x: e.clientX-12, y: e.clientY-12, duration:.15, ease:'power2.out' });
  gsap.to(cursorDot, { x: e.clientX,    y: e.clientY,    duration:.05 });
});
document.querySelectorAll('a,button,.project-card,.servicio-item,.mat-block,.tag,.form-input,.gm-img,.gm-nav-btn').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

document.querySelectorAll('.project-card[role="button"]').forEach(card => {
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursor-dot');
  if (cursor && cursorDot) {
    document.addEventListener('mousemove', e => {
      gsap.to(cursor, { x: e.clientX-12, y: e.clientY-12, duration:.15, ease:'power2.out' });
      gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration:.05 });
    });
    document.querySelectorAll('a,button,.related-card,.service-list-item').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  document.querySelectorAll('.reveal,.reveal-left').forEach(el => {
    ScrollTrigger.create({ trigger:el, start:'top 88%',
      onEnter: () => gsap.to(el, { opacity:1, x:0, y:0, duration:.9, ease:'power3.out' })
    });
  });

  document.querySelectorAll('.proc-dot').forEach((dot,i) => {
    ScrollTrigger.create({ trigger:dot, start:'top 85%',
      onEnter: () => gsap.from(dot, { scale:0, duration:.5, delay:i*.15, ease:'back.out(2)' })
    });
  });
}

const hamburger = document.getElementById('navHamburger');
const mobileMenu = document.getElementById('navMobileMenu');
function closeMobileMenu() {
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    if (isOpen) closeMobileMenu();
    else {
      hamburger.classList.add('open');
      mobileMenu.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
  });
}

gsap.registerPlugin(ScrollTrigger);

// HERO LINES
['bl1','bl2','bl3','bl4','bl5','bl6','bl7','bl8','bl9','bl10','bl11'].forEach((id,i) => {
  const el = document.getElementById(id); if(!el) return;
  const len = el.getTotalLength ? el.getTotalLength() : 400;
  gsap.set(el, { strokeDasharray:len, strokeDashoffset:len });
  gsap.to(el, { strokeDashoffset:0, duration:1.5+i*.2, delay:.3+i*.1, ease:'power2.inOut' });
});

// HERO TITLE
document.querySelectorAll('.hero-title-inner').forEach((el,i) => {
  gsap.from(el, { yPercent:105, duration:1.1, delay:.5+i*.15, ease:'power4.out' });
});

// REVEALS
document.querySelectorAll('.reveal,.reveal-left').forEach(el => {
  ScrollTrigger.create({ trigger:el, start:'top 88%',
    onEnter: () => gsap.to(el, { opacity:1, x:0, y:0, duration:.9, ease:'power3.out' })
  });
});

// PARALLAX
gsap.to('.hero-panel',    { y:-60, scrollTrigger:{ trigger:'#hero', start:'top top', end:'bottom top', scrub:true }});
gsap.to('.hero-panel-2',  { y:-40, scrollTrigger:{ trigger:'#hero', start:'top top', end:'bottom top', scrub:true }});
gsap.to('.hero-bg-lines', { y: 80, scrollTrigger:{ trigger:'#hero', start:'top top', end:'bottom top', scrub:true }});

// SCROLL PROGRESS
const secIds = ['hero','estudio','servicios','proceso','portafolio','materiales','contacto'];
const spDots = document.querySelectorAll('.sp-dot');
secIds.forEach((id,i) => {
  ScrollTrigger.create({ trigger:'#'+id, start:'top center', end:'bottom center',
    onEnter:     () => { spDots.forEach(d=>d.classList.remove('active')); spDots[i]?.classList.add('active'); },
    onEnterBack: () => { spDots.forEach(d=>d.classList.remove('active')); spDots[i]?.classList.add('active'); }
  });
});

// NAV shadow
ScrollTrigger.create({ start:'top top-=80',
  onEnter:     () => document.getElementById('mainNav').style.boxShadow='0 2px 24px rgba(17,17,17,0.08)',
  onLeaveBack: () => document.getElementById('mainNav').style.boxShadow='none'
});

// PROC DOTS
document.querySelectorAll('.proc-dot').forEach((dot,i) => {
  ScrollTrigger.create({ trigger:dot, start:'top 85%',
    onEnter: () => gsap.from(dot, { scale:0, duration:.5, delay:i*.15, ease:'back.out(2)' })
  });
});

// HOVER PROC ITEMS
document.querySelectorAll('.proc-item').forEach(item => {
  item.addEventListener('mouseenter', () => gsap.to(item, { paddingLeft:'16px', duration:.25 }));
  item.addEventListener('mouseleave', () => gsap.to(item, { paddingLeft:'0px',  duration:.3  }));
});

// CARD STAGGER
// Portfolio cards — sin animación de entrada, visibles desde el inicio para máxima estabilidad

// ---- COUNTER ANIMATION ----
function animateCounter(el, target, prefix, suffix, duration) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = prefix + Math.floor(start) + suffix;
    if (start >= target) clearInterval(timer);
  }, 16);
}

ScrollTrigger.create({
  trigger: '#hero',
  start: 'top 80%',
  once: true,
  onEnter: () => {
    setTimeout(() => {
      animateCounter(document.getElementById('statCount1'), 40, '+', '', 1200);
      animateCounter(document.getElementById('statCount2'),  5,  '', '', 900);
    }, 600);
  }
});

// ---- TYPEWRITER — hero tag ----
const heroTagEl = document.querySelector('.hero-tag-label');
if (heroTagEl) {
  const originalText = heroTagEl.textContent;
  heroTagEl.textContent = '';
  let i = 0;
  setTimeout(() => {
    const tw = setInterval(() => {
      heroTagEl.textContent = originalText.slice(0, ++i);
      if (i >= originalText.length) clearInterval(tw);
    }, 40);
  }, 800);
}

// ---- HAMBURGER MENU ----
const hamburger = document.getElementById('navHamburger');
const mobileMenu = document.getElementById('navMobileMenu');

function closeMobileMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.contains('open');
  if (isOpen) {
    closeMobileMenu();
  } else {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
});

ScrollTrigger.refresh();

// ===================== GALLERY DATA =====================
let gData = {};
fetch('/assets/data/projects.json')
  .then(response => {
    if (!response.ok) throw new Error('No se pudo cargar projects.json');
    return response.json();
  })
  .then(projects => { gData = projects; })
  .catch(error => console.error('Error cargando portafolio:', error));

const projectOrder = ['wpp26','alemania','durero','silla','wpp','fm','cn','casa','atl','elizondo'];
let currentProj = null;
let viewerImgs = [];
let viewerAlts = [];
let viewerIdx  = 0;
let galleryLastFocus = null;
let viewerLastFocus = null;

function safePortfolioAlt(d, index) {
  const base = (d.alts && d.alts[index]) ? d.alts[index] : d.title + ' — imagen ' + (index + 1);
  const alreadySafe = base.toLowerCase().includes('derechos') || base.toLowerCase().includes('documentación');
  if (alreadySafe) return base;
  return 'Documentación del trabajo museográfico realizado por PROMAX: ' + base + '. Obras, fotografías y contenidos visibles con derechos de sus respectivos titulares.';
}

function openGallery(key) {
  currentProj = key;
  galleryLastFocus = document.activeElement;
  const d = gData[key];
  if (!d) {
    console.warn('Proyecto no disponible todavia:', key);
    return;
  }
  document.getElementById('gmCode').textContent    = d.code;
  document.getElementById('gmTitle').textContent   = d.title;
  document.getElementById('gmMeta').textContent    = d.meta;
  const rights = document.getElementById('gmRights');
  const c = d.credits || {};
  rights.innerHTML = `
    <strong>CRÉDITOS Y DERECHOS</strong>
    <span>${c.role || 'Documentación del trabajo museográfico, de producción e instalación realizado por PROMAX.'}</span>
    <span>Cliente / sede: ${c.client || 'Institución o sede correspondiente'}</span>
    <span>${c.photo || 'Fotografía documental: PROMAX'}</span>
    <span>${c.artwork || 'Obras, fotografías, textos curatoriales, marcas e identidad de exposición: derechos de sus respectivos autores, titulares e instituciones.'}</span>
    <span>${c.note || 'PROMAX no reclama derechos sobre las obras o contenidos exhibidos; las imágenes se muestran únicamente como registro de su intervención técnica.'}</span>
  `;
  document.getElementById('gmCounter').textContent = d.imgs.length + ' IMÁGENES · PROYECTO ' + (projectOrder.indexOf(key)+1) + ' / ' + projectOrder.length;

  const grid = document.getElementById('gmGrid');
  grid.innerHTML = '';
  viewerImgs = d.imgs;
  viewerAlts = d.imgs.map((_, i) => safePortfolioAlt(d, i));

  d.imgs.forEach((src, i) => {
    const cls = d.layout[i] || 's4';
    const altText = safePortfolioAlt(d, i);
    const div = document.createElement('div');
    div.className = 'gm-img ' + cls;
    div.onclick = () => openViewer(i);
    const img = document.createElement('img');
    img.src = src;
    img.alt = altText;
    img.loading = 'lazy';
    img.decoding = 'async';
    div.appendChild(img);
    grid.appendChild(div);
    window.promaxCursor?.classList.remove('hover');
    div.addEventListener('mouseenter', () => window.promaxCursor?.classList.add('hover'));
    div.addEventListener('mouseleave', () => window.promaxCursor?.classList.remove('hover'));
  });

  const modal = document.getElementById('galleryModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.gm-close')?.focus();
  gsap.from('.gm-img', { opacity:0, y:24, duration:.5, stagger:.07, ease:'power2.out', delay:.15 });
}

function closeGallery() {
  const m = document.getElementById('galleryModal');
  gsap.to(m, { opacity:0, duration:.25, onComplete:() => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    m.style.opacity='';
    document.body.style.overflow='';
    if (galleryLastFocus && typeof galleryLastFocus.focus === 'function') galleryLastFocus.focus();
  }});
}

function navProject(dir) {
  const idx = projectOrder.indexOf(currentProj);
  const next = (idx + dir + projectOrder.length) % projectOrder.length;
  document.getElementById('galleryModal').querySelector('.gm-body').scrollTop = 0;
  openGallery(projectOrder[next]);
}

function openViewer(index) {
  viewerIdx = index;
  viewerLastFocus = document.activeElement;
  const v = document.getElementById('imgViewer');
  const img = document.getElementById('viewerImg');
  img.src = viewerImgs[index];
  img.alt = viewerAlts[index] || '';
  document.getElementById('viewerInfo').textContent = (index+1) + ' / ' + viewerImgs.length;
  v.classList.add('open');
  v.setAttribute('aria-hidden', 'false');
  v.querySelector('.iv-close')?.focus();
  gsap.from('#viewerImg', { opacity:0, scale:.95, duration:.3, ease:'power2.out' });
}

function closeViewer() {
  const v = document.getElementById('imgViewer');
  v.classList.remove('open');
  v.setAttribute('aria-hidden', 'true');
  if (viewerLastFocus && typeof viewerLastFocus.focus === 'function') viewerLastFocus.focus();
}

function viewerNav(dir) {
  viewerIdx = (viewerIdx + dir + viewerImgs.length) % viewerImgs.length;
  gsap.to('#viewerImg', { opacity:0, x:dir*-30, duration:.15, onComplete:() => {
    document.getElementById('viewerImg').src = viewerImgs[viewerIdx];
    document.getElementById('viewerImg').alt = viewerAlts[viewerIdx] || '';
    document.getElementById('viewerInfo').textContent = (viewerIdx+1) + ' / ' + viewerImgs.length;
    gsap.fromTo('#viewerImg', { opacity:0, x:dir*30 }, { opacity:1, x:0, duration:.25 });
  }});
}

document.addEventListener('keydown', e => {
  const v = document.getElementById('imgViewer');
  const m = document.getElementById('galleryModal');
  if (v.classList.contains('open')) {
    if (e.key==='Escape')      closeViewer();
    if (e.key==='ArrowRight')  viewerNav(1);
    if (e.key==='ArrowLeft')   viewerNav(-1);
  } else if (m.classList.contains('open')) {
    if (e.key==='Escape')      closeGallery();
    if (e.key==='ArrowRight')  navProject(1);
    if (e.key==='ArrowLeft')   navProject(-1);
  }
});

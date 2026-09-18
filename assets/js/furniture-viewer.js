import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Un solo contexto WebGL para todo el catálogo: las piezas se intercambian en el mismo escenario.

// Fondo negro, la tinta del sitio. El amarillo entra solo como acento, no como campo.
const BG = 0x111111;
const PISO = 0x1c1c1c;
const stage = document.getElementById('mbStage');
const listEl = document.getElementById('mbList');
const specEl = document.getElementById('mbSpec');
const titleEl = document.getElementById('mbTitle');
const codeEl = document.getElementById('mbCode');
const summaryEl = document.getElementById('mbSummary');
const dimsEl = document.getElementById('mbDims');
const statusEl = document.getElementById('mbStatus');

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const HINT = coarse ? 'Gira con dos dedos.' : 'Arrastra para girar, rueda para acercar.';

function fail(msg) {
  if (stage) stage.classList.add('is-unavailable');
  if (statusEl) statusEl.textContent = msg;
}

// WEBGL CHECK — sin contexto no hay visor, pero las fichas técnicas siguen sirviendo.
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

// RENDERER
let renderer, scene, camera, controls, current = null;
const cache = new Map();
const mm = n => `${n.toLocaleString('es-MX')} mm`;

function initScene() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;   // un gris medio se quema por encima de esto
  renderer.domElement.setAttribute('aria-label', 'Modelo tridimensional de la pieza; arrastra para girar');
  stage.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;

  camera = new THREE.PerspectiveCamera(38, 1, 0.05, 80);

  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(3.2, 4.4, 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 16;
  const s = 3;
  Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s });
  key.shadow.bias = -0.0012;
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  // Piso apenas mas claro que el fondo: con ShadowMaterial sobre negro la sombra de contacto
  // seria negro sobre negro y la pieza quedaria flotando sin apoyo.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: PISO, roughness: 1, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 1.6;
  controls.maxDistance = 9;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;   // no cruzar bajo el piso
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.55;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  // En táctil el visor ocupa todo el ancho: si se quedara con touch-action:none, un dedo
  // sobre él dejaría al usuario sin poder desplazar la página. Un dedo desplaza, dos giran.
  controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
  renderer.domElement.style.touchAction = 'pan-y';

  resize();
  addEventListener('resize', resize);
  renderer.setAnimationLoop(() => {
    controls.update();
    orientarMampara();
    renderer.render(scene, camera);
  });
}

function resize() {
  const { clientWidth: w, clientHeight: h } = stage;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// FRAMING — el visor gira solo, asi que la distancia tiene que servir para CUALQUIER azimut,
// no solo para el inicial: se toma el radio de la planta (invariante al giro) para el ancho y
// la altura real para el alto. Encuadrar solo el angulo de partida recortaba las piezas largas
// al ponerse de costado.
const VIEW_DIR = new THREE.Vector3(0.62, 0.42, 0.66).normalize();
const MARGEN = 1.05;
let encuadre = null;

function frame(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = size.length() / 2;

  const planta = Math.hypot(size.x, size.z) / 2;   // radio en planta: lo mismo desde cualquier lado
  const alto = size.y / 2;
  const tanV = Math.tan((camera.fov * Math.PI / 180) / 2);
  const tanH = tanV * camera.aspect;

  // Al peor caso lateral hay que sumarle que ese mismo punto puede estar adelantado hacia la camara.
  const dist = (planta + Math.max(planta / tanH, alto / tanV)) * MARGEN;
  encuadre = { dist, planta, tanV, tanH };

  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(VIEW_DIR, dist);
  camera.near = Math.max(0.05, dist / 100);
  camera.far = dist * 12;
  camera.updateProjectionMatrix();
  controls.minDistance = radius * 1.05;
  controls.maxDistance = dist * 2.6;
  controls.update();
}

// El amarillo de marca, el mismo que subraya los titulos del sitio.
const ACENTO = 0xf4db09;

// MAMPARA — panel amarillo de fondo, como una mampara de sala. No se deja fija: el visor gira,
// y una mampara fija se veria de canto y luego por detras. Se mantiene siempre opuesta a la
// camara, asi la pieza se lee contra el color desde cualquier angulo.
let mampara = null;
const _haciaCamara = new THREE.Vector3();
const HOLGURA = 0.45;

function ponerMampara(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const radio = Math.hypot(size.x, size.z) / 2;      // radio en planta: sirve a cualquier giro

  if (!mampara) {
    // Sin iluminar y fuera del tone mapping: asi rinde el amarillo de marca exacto y no una
    // version apagada. Es un campo grafico, no una pared que deba responder a la luz.
    mampara = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: ACENTO, toneMapped: false, side: THREE.DoubleSide })
    );
    scene.add(mampara);
  }
  // Banda, no campo: sangra a lo ancho pero solo ocupa una franja de alto, para que el amarillo
  // funcione como acento contra el negro y no como fondo.
  const fondo = radio + HOLGURA;
  const aCamara = (encuadre ? encuadre.dist : radio * 3) + fondo;
  const ancho = 2 * aCamara * (encuadre ? encuadre.tanH : 0.42) * 1.35;
  const alto = size.y * 0.34;
  mampara.scale.set(ancho, alto, 1);
  mampara.userData = { radio, alto, centro: box.min.y + alto / 2 };   // apoyada en el piso
}

function orientarMampara() {
  if (!mampara || !mampara.userData.radio) return;
  const { radio, centro } = mampara.userData;
  _haciaCamara.subVectors(camera.position, controls.target);
  _haciaCamara.y = 0;
  if (_haciaCamara.lengthSq() < 1e-6) return;
  _haciaCamara.normalize();
  mampara.position.set(
    controls.target.x - _haciaCamara.x * (radio + HOLGURA),
    centro,
    controls.target.z - _haciaCamara.z * (radio + HOLGURA)
  );
  mampara.lookAt(mampara.position.x + _haciaCamara.x,
                 mampara.position.y,
                 mampara.position.z + _haciaCamara.z);
}

const loader = new GLTFLoader();
function load(url) {
  if (cache.has(url)) return cache.get(url);
  const p = new Promise((res, rej) => loader.load(url, g => {
    g.scene.traverse(o => {
      if (!o.isMesh) return;
      const transparent = o.material && (o.material.transmission > 0 || o.material.transparent);
      o.castShadow = !transparent;      // el acrílico no proyecta sombra dura
      o.receiveShadow = !transparent;
    });
    res(g.scene);
  }, undefined, rej));
  cache.set(url, p);
  return p;
}

// FICHA
function renderSpec(piece) {
  titleEl.textContent = piece.name;
  codeEl.textContent = piece.code;
  summaryEl.textContent = piece.summary;
  const d = piece.dimensions;
  dimsEl.textContent = `${mm(d.largo_mm)} × ${mm(d.fondo_mm)} × ${mm(d.alto_mm)}`;
  specEl.innerHTML = piece.specs
    .map(s => `<div class="mb-spec-row"><dt>${s.label}</dt><dd>${s.value}</dd></div>`)
    .join('');
}

async function select(piece, button) {
  listEl.querySelectorAll('button').forEach(b => {
    const on = b === button;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  renderSpec(piece);
  location.hash = piece.slug;

  if (!renderer) return;
  statusEl.textContent = `Cargando ${piece.name}…`;
  try {
    const model = await load(piece.model);
    if (current) scene.remove(current);
    current = model;
    scene.add(model);
    frame(model);
    ponerMampara(model);
    controls.autoRotate = !reduceMotion;
    statusEl.textContent = `${piece.name}. ${HINT}`;
  } catch {
    statusEl.textContent = `No se pudo cargar el modelo de ${piece.name}. La ficha técnica sigue disponible.`;
  }
}

// ARRANQUE
(async function start() {
  let pieces;
  try {
    const res = await fetch('/assets/data/furniture.json');
    ({ pieces } = await res.json());
  } catch {
    fail('No se pudo cargar el catálogo de mobiliario.');
    return;
  }

  listEl.innerHTML = '';
  const buttons = pieces.map(piece => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mb-tile';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML =
      `<span class="mb-tile-code">${piece.code}</span>` +
      `<span class="mb-tile-name">${piece.name}</span>` +
      `<span class="mb-tile-meta">${piece.type}</span>`;
    b.addEventListener('click', () => select(piece, b));
    listEl.appendChild(b);
    return b;
  });

  if (hasWebGL()) initScene();
  else fail('Tu navegador no admite 3D. Abajo están las fichas técnicas completas de cada pieza.');

  const wanted = pieces.findIndex(p => p.slug === location.hash.slice(1));
  const i = wanted >= 0 ? wanted : 0;
  select(pieces[i], buttons[i]);
})();

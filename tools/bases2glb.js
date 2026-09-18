/* Genera los GLB de las dos bases que ya estaban publicadas en presentaciones/bases/.
 *
 *   node tools/bases2glb.js
 *
 * Esa presentacion lleva la geometria incrustada en su HTML como JSON de un importador CAD,
 * y la reparte entre modelos con una funcion minificada. Aqui se lee de ahi directamente:
 * el HTML es la fuente, no hay archivo CAD suelto que convertir.
 *
 * Deja los GLB como los espera assets/js/furniture-viewer.js: metros, Y arriba, centrados
 * en X/Z y con el piso en Y=0. La paleta neutra es la misma de tools/fbx2glb.py.
 */
const fs = require('fs');
const path = require('path');

const FUENTE = 'presentaciones/bases/index.html';
const DESTINO = 'assets/models';

const s2l = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const hex2lin = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255].map(s2l);

// Mismos valores que LIBRARY en tools/fbx2glb.py: solo opaco y translucido.
const MATERIALS = [
  { name: 'Neutro opaco',
    pbrMetallicRoughness: { baseColorFactor: [...hex2lin(0xb9bbb9), 1], metallicFactor: 0, roughnessFactor: 0.62 } },
  { name: 'Neutro translucido', alphaMode: 'BLEND',
    pbrMetallicRoughness: { baseColorFactor: [...hex2lin(0xe8ebea), 0.30], metallicFactor: 0, roughnessFactor: 0.05 },
    extensions: { KHR_materials_transmission: { transmissionFactor: 0.9 },
                  KHR_materials_ior: { ior: 1.5 } } },
];

/* Reglas leidas de la funcion que arma los modelos en la presentacion.
 * `_c` trae dos variantes una junto a la otra y se separan por el centroide en X;
 * de `xc` solo se usan las primeras diez mallas. */
const PIECES = {
  'estructura-abierta': { src: '_c', shiftX: 4518.91029135177, shiftZ: -1275,
                          keep: (i, cx) => cx > 2900, glass: i => i === 6 || i === 27 },
  'cuerpo-completo':    { src: 'xc', shiftX: 1250, shiftZ: 0,
                          keep: i => i <= 9, glass: i => i >= 5 && i <= 9 },
};

// --- Extraer los bloques de geometria del HTML -------------------------------
function extraer(html, nombre) {
  const at = html.indexOf(nombre + '={success:!0');
  if (at < 0) throw new Error(`No se encontro la geometria "${nombre}" en ${FUENTE}`);
  const from = html.indexOf('{', at);
  let depth = 0, i = from;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) { i++; break; }
  }
  return eval('(' + html.slice(from, i) + ')');   // JS minificado, no JSON: claves sin comillas
}

// --- Escribir un GLB ---------------------------------------------------------
function construir(nombre, cfg, doc) {
  const chunks = [], bufferViews = [], accessors = [], primitives = [];
  let offset = 0;
  const push = (buf, target) => {
    while (offset % 4) { chunks.push(Buffer.alloc(1)); offset++; }
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, ...(target && { target }) });
    chunks.push(buf); offset += buf.length;
    return bufferViews.length - 1;
  };

  const staged = [];
  doc.meshes.forEach((m, idx) => {
    const pos = m.attributes.position.array;
    const cx = pos.filter((_, k) => k % 3 === 0).reduce((a, b) => a + b, 0) / (pos.length / 3);
    if (!cfg.keep(idx, cx)) return;

    const P = new Float32Array(pos.length);            // CAD en mm, Z arriba -> metros, Y arriba
    for (let i = 0; i < pos.length; i += 3) {
      P[i]     =  (pos[i]     - cfg.shiftX) / 1000;
      P[i + 1] =  (pos[i + 2] - cfg.shiftZ) / 1000;
      P[i + 2] = -(pos[i + 1] - 250)        / 1000;
    }
    const src = m.attributes.normal?.array;
    let N = null;
    if (src) {
      N = new Float32Array(src.length);
      for (let i = 0; i < src.length; i += 3) { N[i] = src[i]; N[i + 1] = src[i + 2]; N[i + 2] = -src[i + 1]; }
    }
    staged.push({ P, N, index: m.index.array, glass: cfg.glass(idx) });
  });

  const g = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (const st of staged)
    for (let i = 0; i < st.P.length; i += 3)
      for (let k = 0; k < 3; k++) {
        if (st.P[i + k] < g.min[k]) g.min[k] = st.P[i + k];
        if (st.P[i + k] > g.max[k]) g.max[k] = st.P[i + k];
      }
  const shift = [(g.min[0] + g.max[0]) / 2, g.min[1], (g.min[2] + g.max[2]) / 2];

  staged.forEach(({ P, N, index, glass }) => {
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) P[i + k] -= shift[k];

    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < P.length; i += 3)
      for (let k = 0; k < 3; k++) {
        if (P[i + k] < min[k]) min[k] = P[i + k];
        if (P[i + k] > max[k]) max[k] = P[i + k];
      }

    const count = P.length / 3;
    const attributes = {};
    accessors.push({ bufferView: push(Buffer.from(P.buffer, P.byteOffset, P.byteLength), 34962),
                     componentType: 5126, count, type: 'VEC3', min, max });
    attributes.POSITION = accessors.length - 1;
    if (N) {
      accessors.push({ bufferView: push(Buffer.from(N.buffer, N.byteOffset, N.byteLength), 34962),
                       componentType: 5126, count, type: 'VEC3' });
      attributes.NORMAL = accessors.length - 1;
    }
    const wide = count > 65535;
    const I = wide ? new Uint32Array(index) : new Uint16Array(index);
    accessors.push({ bufferView: push(Buffer.from(I.buffer, I.byteOffset, I.byteLength), 34963),
                     componentType: wide ? 5125 : 5123, count: I.length, type: 'SCALAR' });
    primitives.push({ attributes, indices: accessors.length - 1, material: glass ? 1 : 0 });
  });

  const bin = Buffer.concat(chunks);
  const gltf = {
    asset: { version: '2.0', generator: 'PROMAX bases2glb' },
    extensionsUsed: ['KHR_materials_transmission', 'KHR_materials_ior'],
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: nombre }],
    meshes: [{ name: nombre, primitives }], materials: MATERIALS,
    bufferViews, accessors, buffers: [{ byteLength: bin.length }],
  };

  const pad = (b, byte) => Buffer.concat([b, Buffer.alloc((4 - b.length % 4) % 4, byte)]);
  const json = pad(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);
  const data = pad(bin, 0);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + data.length, 8);
  const ch = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
  const glb = Buffer.concat([header, ch(json.length, 0x4e4f534a), json, ch(data.length, 0x004e4942), data]);

  const out = path.join(DESTINO, nombre + '.glb');
  fs.writeFileSync(out, glb);
  const traslucidas = primitives.filter(p => p.material === 1).length;
  console.log(`${out}: ${primitives.length} primitivas (${traslucidas} translucidas), ${(glb.length / 1024).toFixed(0)} KB`);
}

const html = fs.readFileSync(FUENTE, 'utf8');
for (const [nombre, cfg] of Object.entries(PIECES)) construir(nombre, cfg, extraer(html, cfg.src));

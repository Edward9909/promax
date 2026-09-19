# PROMAX Web asset architecture

This site is intentionally static: GitHub Pages can serve every file without a build step.

## Home

- `index.html` contains the semantic document, SEO metadata, and section markup.
- `assets/css/base.css` contains reset, variables, base typography, and global display-font rules.
- `assets/css/components.css` contains shared UI primitives used by the home: cursor, nav, mobile menu, footer logo, grid overlay.
- `assets/css/sections.css` contains home sections, responsive rules, gallery, form, and page-specific layouts.
- `assets/js/main.js` contains home animation setup, scroll progress, counters, typewriter, and mobile menu behavior.
- `assets/js/cursor.js`, `gallery.js`, `form.js`, `recaptcha.js`, and `video-crossfade.js` each own one behavior.
- `assets/data/projects.json` is the portfolio data source used by the gallery.

## Service pages

The public service URLs use clean directory routes: `servicios/<slug>/index.html` is served as `/servicios/<slug>/`.
The legacy `servicios/*.html` files are lightweight compatibility redirects for old indexed or shared links.

Shared service assets:

- `assets/css/service-pages.css` contains the common design system and layout for all service landing pages.
- `assets/css/service-production.css` contains the one override needed by `produccion-mobiliario-museografico/`.
- `assets/js/service-pages.js` contains shared cursor, reveal animation, process dots, and mobile menu behavior.

When adding a service page, copy an existing `servicios/<slug>/index.html`, update metadata, JSON-LD, hero/body copy, related links, and keep the shared CSS/JS includes. If a legacy `.html` URL exists, keep it as a redirect bridge to the clean route.

## Portafolio de mobiliario (3D)

`portafolio/mobiliario/` muestra las piezas de mobiliario en un visor 3D. A diferencia de
`presentaciones/bases/`, que lleva three.js y la geometria embebidos en un solo HTML de 2.4 MB,
aqui todo esta separado y cacheable:

- `assets/data/furniture.json` es la fuente de datos: una entrada por pieza con su ficha tecnica.
- `assets/models/*.glb` es la geometria, un archivo por pieza (glTF 2.0 binario, metros, Y arriba,
  centrado en X/Z y con el piso en Y=0).
- `assets/js/furniture-viewer.js` es el visor: un solo contexto WebGL que intercambia modelos.
- `assets/css/furniture-portfolio.css` es el catalogo y la ficha.
- three.js se carga por CDN con un `importmap` en el `<head>` de la pagina, igual que GSAP.

Para agregar una pieza, partiendo de su FBX:

0. Si la pieza NO viene de un FBX sino de la presentacion de bases, se regenera con
   `node tools/bases2glb.js`, que lee la geometria incrustada en `presentaciones/bases/index.html`.
1. Declara la pieza en `RULES`, dentro de `tools/fbx2glb.py`. Ahi se dice como se asignan
   sus materiales (`by_material` si el FBX ya los trae bien, `by_object` si viene todo con
   un solo material) y, si el FBX contiene varios muebles, cuales cuerpos entran (`include`).
2. Convierte:
   `blender -b -noaudio --python tools/fbx2glb.py -- <pieza> "<entrada.fbx>" assets/models/<pieza>.glb`
3. Agrega su entrada a `furniture.json` y sumala al `ItemList` del JSON-LD de la pagina,
   subiendo `numberOfItems`.

No hay que tocar el visor. Conviene verificar el GLB antes de publicarlo: que la altura de
cada parte sea la esperada (los FBX suelen venir Y arriba y salen invertidos si la rotacion
va al reves) y que el piso quede en 0.

Es un muestrario, no una familia: cada pieza se presenta sola y no se asume que comparta
medidas, materiales ni acabado con las demas.

Las fichas publicadas NO nombran materiales ni acabados, a proposito: se definen en cada
proyecto. Al escribir una entrada en `furniture.json`, los `specs` se limitan a geometria,
configuracion y medidas. La aclaracion vive en dos lugares de la pagina, la nota bajo la
ficha y la nota de cierre; si se agrega una pieza, no hace falta repetirla.

Los modelos tampoco comprometen acabado: se ven neutros y solo distinguen `opaco` de
`translucido`, que es lo unico que el visor necesita para que un capelo no se lea como tapa
maciza. La paleta esta declarada en `tools/fbx2glb.py` (`LIBRARY`) y repetida en
`tools/bases2glb.js` (`MATERIALS`); si se cambia, hay que cambiarla en los dos y regenerar.

El visor va sobre negro (`#111111`, la tinta del sitio), asi que el gris de los modelos es
claro: sobre fondo claro se lavaba, sobre negro tiene que destacar. Las dos cosas van juntas,
cambiar una obliga a revisar la otra. La exposicion del render es 0.95 y no mas: por encima de
eso un gris medio se quema.

El piso no es un `ShadowMaterial` sino un plano apenas mas claro que el fondo (`#1c1c1c`):
sobre negro, una sombra oscura seria negro sobre negro y la pieza quedaria flotando sin apoyo.

El distintivo PROMAX es una banda amarilla de fondo, en el amarillo de marca (`#F4DB09`),
detras de la pieza. El visor la genera a partir del bounding box de cada modelo, asi que una
pieza nueva la trae sin configurar nada. Tres decisiones que no son obvias:

- No esta fija en la escena: se mantiene siempre opuesta a la camara. El visor gira solo, y una
  mampara fija se veria de canto y despues por detras.
- Sangra a lo ancho pero solo ocupa una franja de alto (34% de la pieza). Como campo completo
  el amarillo dejaba de ser acento; como banda acompaña sin competir con el mueble.
- Su material es `MeshBasicMaterial` con `toneMapped: false`: sin iluminar y fuera del tone
  mapping rinde el amarillo de marca exacto. Iluminada salia apagada, tirando a mostaza.

El texto de la pista de uso va sobre ese negro, no sobre el papel, por eso su color esta fijado
aparte en el CSS y no usa `--ink2` (que sobre negro daba 2.5:1).

El campo `type` de cada entrada es una etiqueta suelta ("Base de exhibicion", "Vitrina de mesa"),
no una taxonomia cerrada: se puede escribir lo que corresponda a la pieza.

## CV empresarial

`presentaciones/cv/` es el CV empresarial: un documento, no una pagina de recorrido. Vive
en `presentaciones/` como la presentacion de bases, se comparte por enlace directo y por eso
va con `noindex, follow` y fuera del `sitemap.xml`: repite contenido del home y de las paginas
de servicio, y no tiene por que competir con ellas en buscadores.

Su hoja es `assets/css/cv.css`, autocontenida: repite los tokens de marca en vez de cargar
`base.css`, asi que si cambia el amarillo o la tinta hay que cambiarlos en los dos lugares.
No usa `service-pages.css` ni GSAP, y no tiene clases `reveal`: un documento que arranca con
`opacity: 0` se imprime en blanco si el script no corre.

### Sistema editorial

El documento es una sola estructura repetida, descrita en el encabezado de `cv.css`:
reticula de 12 columnas, una unica tarjeta (`.card`) para servicios, disciplinas y
materiales, y una cabeza de seccion fija (regla de 2 px, titulo en las columnas 1-5, entrada
en las 7-12). Al agregar contenido, la regla es usar el modulo que ya existe y cambiarle el
tramo, no inventar una variante: lo que distingue a una seccion de otra es cuantas tarjetas
caben en la fila, no su tipografia.

Dos convenciones del texto: el amarillo marca la ultima palabra de un titulo de dos o mas
palabras y un titulo de una sola palabra se queda en tinta; y el color del documento lo
traen las fotos, no la grafica, por eso la paleta se queda en papel, tinta y amarillo.

### Fotos

Las imagenes salen de la galeria de proyectos (`assets/data/projects.json`, campo `imgs`) y
se sirven desde Cloudinary con su propia transformacion de ancho. Cada foto va en `.plate`
con pie que dice **que hizo PROMAX en esa imagen**: el criterio de seleccion es que se lea la
produccion — muro de titulo, vitrina, enmarcado, montaje, obra en proceso — por encima de la
obra exhibida. Si una imagen no permite afirmar con certeza que la pieza es produccion de
PROMAX, no entra: hay fotos de la galeria descartadas por eso.

En una banda de 7 + 5 columnas, la foto angosta lleva la clase `match` (proporcion 15/16)
para que las dos columnas cierren en la misma linea.

### Version impresa

Es un entregable, no un accidente. Cuatro cosas que no son obvias:

- Las reglas responsivas van como `@media screen and (max-width: ...)`. Al imprimir, el ancho
  de la caja de pagina (190 mm) equivale a ~718 px, asi que sin ese `screen` la hoja hereda la
  maqueta de telefono y las tablas de proyectos salen apiladas, celda por linea.
- Cada seccion abre pagina con `break-before: page`, salvo las de cierre (`section.flow`):
  instituciones y contacto se encadenan a la anterior porque por separado dejaban tres hojas
  a medio ocupar. Hoy el CV son 10 paginas carta con 18 fotos incrustadas y ninguna hoja baja
  del 67 % de ocupacion; al agregar contenido conviene generar el PDF y volver a medirlo.
- `break-after: avoid` no es fiable en Chromium: para que una cabeza de seccion no se quede
  sola al pie de una hoja, se envuelve junto a su primer bloque en `.keep`, que si respeta
  `break-inside`. Las secciones en flujo dependen de eso.
- Las fotos de ancho completo (`.plate.wide`) pasan a 21:9 en papel. En 16:9 median 107 mm y
  empujaban a la hoja siguiente lo que venia despues.

Para regenerar el PDF con el servidor local corriendo en el puerto 4173:

    chrome --headless=new --no-pdf-header-footer --virtual-time-budget=25000       --print-to-pdf="PROMAX - CV Empresarial.pdf"       http://localhost:4173/presentaciones/cv/

Las imagenes con `loading="lazy"` si entran en el PDF: al imprimir, Chrome las carga todas.

### Contenido

El CV no afirma nada que el sitio no sostenga. Los proyectos y sus alcances salen de
`assets/data/projects.json`; si ahi se agrega un proyecto, el CV no se actualiza solo. Dos
decisiones de contenido que conviene no deshacer sin preguntar:

- Los alcances de proyecto no dicen "museografia" ni "museografico": describen produccion,
  montaje, grafica, enmarcado o conservacion. El servicio de diseno museografico si aparece
  en la seccion de capacidades, que es lo que el estudio ofrece, no lo que ejecuto en estos
  proyectos.
- El documento nunca dice "taller propio". Habla de "taller" o "taller de produccion", sin
  afirmar la propiedad del taller. Tampoco promete tiempos de prototipado.
- Donde el sitio no declara sede o titulo (World Press Photo 2025, el proyecto de museo y
  biblioteca de El Colegio Nacional, Miguel Leon-Portilla), el CV describe el alcance en vez
  de inferir la institucion.

## Brand assets

- `assets/brand/promax.svg` is the local logo used by the home and service footers.
- Cloudinary remains the CDN for project imagery and video.

## Validation checklist

Before pushing larger changes:

1. Run `node --check` on JS files.
2. Parse `assets/data/projects.json`.
3. Parse all JSON-LD blocks in `index.html` and `servicios/*/index.html`.
4. Serve the site locally over HTTP and request `/`, service pages, CSS, JS, JSON, and SVG assets.
5. Run `git diff --check`.

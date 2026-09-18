"""Convierte un FBX de mobiliario al GLB que consume /portafolio/mobiliario/.

    blender -b -noaudio --python tools/fbx2glb.py -- <pieza> <entrada.fbx> <salida.glb>

Deja el modelo en metros, Y arriba, centrado en X/Z y con el piso en Y=0, que es lo que
espera assets/js/furniture-viewer.js. Cada pieza declara en RULES como se asignan sus
materiales, porque los FBX no vienen todos igual de limpios.
"""
import bpy, sys, math, mathutils

# --- Biblioteca de materiales -------------------------------------------------
# Las fichas publicadas no comprometen materiales ni acabados, asi que los modelos tampoco:
# se ven neutros y solo distinguen opaco de translucido, que es lo unico que el visor necesita
# para que un capelo no se lea como una tapa maciza.
# El gris es claro porque el visor va sobre fondo negro.
# (hex, metalico, rugosidad, alpha, transmision, ior)
LIBRARY = {
    'opaco':       (0xb9bbb9, 0.0, 0.62, 1.00, 0.0, 1.50),
    'translucido': (0xe8ebea, 0.0, 0.05, 0.30, 0.9, 1.50),
}
LABEL = {'opaco': 'Neutro opaco', 'translucido': 'Neutro translucido'}

# --- Reglas por pieza ---------------------------------------------------------
# include:     un mismo FBX puede traer varios muebles; se exporta solo este subconjunto.
# by_object:   el FBX trae un solo material para todo, hay que repartir por nombre de cuerpo.
# by_material: el FBX ya trae materiales utiles, se mapean directo.
RULES = {
    # vitrina-4: el FBX trae un solo material para todo; el capelo y los portacedulas
    # se identifican por nombre de cuerpo.
    'vitrina-4': {'by_object': {'Body1.001': 'translucido', 'Body1.004': 'translucido',
                                'Body2.002': 'translucido'},
                  'default': 'opaco'},
    # vitrina-5: el FBX si trae materiales utiles, basta con reconocer el cristal.
    # Incluye la vitrina y su atril, separados 460 mm, que se publican como un conjunto.
    'vitrina-5': {'by_material': {'Glass (Clear)': 'translucido'},
                  'default': 'opaco'},
}

MAX_TRIS = 400   # los herrajes vienen como cilindros de miles de tris para piezas de 25 mm


def srgb_to_linear(hexcol):
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(f(((hexcol >> s) & 255) / 255) for s in (16, 8, 0))


def make_material(key):
    hexcol, metal, rough, alpha, transmission, ior = LIBRARY[key]
    m = bpy.data.materials.new(LABEL[key]); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"].inputs
    b["Base Color"].default_value = (*srgb_to_linear(hexcol), 1.0)
    b["Metallic"].default_value = metal
    b["Roughness"].default_value = rough
    b["IOR"].default_value = ior
    if transmission:
        b["Transmission Weight"].default_value = transmission
    if alpha < 1.0:
        b["Alpha"].default_value = alpha
        m.blend_method = 'BLEND'
    return m


def main():
    argv = sys.argv[sys.argv.index("--") + 1:]
    piece, src, out = argv[0], argv[1], argv[2]
    rule = RULES[piece]

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=src)

    keep = rule.get('include')
    if keep:
        for o in [o for o in bpy.data.objects if o.type == 'MESH' and o.name not in keep]:
            bpy.data.objects.remove(o, do_unlink=True)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    if keep and len(meshes) != len(keep):
        raise SystemExit("ERROR: se esperaban %d cuerpos, quedaron %d" % (len(keep), len(meshes)))

    made = {}
    def material(key):
        if key not in made: made[key] = make_material(key)
        return made[key]

    for o in meshes:
        source = o.data.materials[0].name if o.data.materials else ''
        key = (rule.get('by_object', {}).get(o.name)
               or rule.get('by_material', {}).get(source)
               or rule['default'])
        o.data.materials.clear()
        o.data.materials.append(material(key))
        print("ROW|   %-14s %-24s -> %s" % (o.name, source or '(sin material)', LABEL[key]))

    for o in meshes:
        n = sum(len(p.vertices) - 2 for p in o.data.polygons)
        if n <= MAX_TRIS: continue
        bpy.context.view_layer.objects.active = o
        d = o.modifiers.new("dec", 'DECIMATE'); d.ratio = min(1.0, 160 / n)
        bpy.ops.object.modifier_apply(modifier=d.name)

    # Los FBX vienen Y arriba: pasarlos a Z arriba para que el exportador glTF los devuelva bien.
    for o in bpy.data.objects:
        if o.parent is None:
            o.matrix_world = mathutils.Matrix.Rotation(math.radians(-90), 4, 'X') @ o.matrix_world
    bpy.context.view_layer.update()

    pts = [o.matrix_world @ mathutils.Vector(c) for o in meshes for c in o.bound_box]
    mn = [min(p[i] for p in pts) for i in range(3)]
    mx = [max(p[i] for p in pts) for i in range(3)]
    off = mathutils.Vector((-(mn[0] + mx[0]) / 2, -(mn[1] + mx[1]) / 2, -mn[2]))
    for o in bpy.data.objects:
        if o.parent is None: o.matrix_world.translation += off
    bpy.context.view_layer.update()

    print("ROW| %s: %d tris | %.3f x %.3f x %.3f m (largo x fondo x alto)"
          % (piece, sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes),
             mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]))
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, export_yup=True)


main()

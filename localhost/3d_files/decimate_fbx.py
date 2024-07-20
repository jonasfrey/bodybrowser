import bpy
import sys
import time

argv = sys.argv
argv = argv[argv.index("--") + 1:]  # get all args after "--"

if len(argv) < 2:
    print("Give arguments -- fbx_file decimate_ratio")
    sys.exit(1)

fbx_file = argv[0]
decimate_ratio = float(argv[1])

start_time = time.time()

def log(msg):
    s = round(time.time() - start_time, 2)
    print("{}s {}".format(s, msg))

# Clear Blender scene
bpy.ops.wm.read_factory_settings(use_empty=True)

log("Blender scene cleared")

# Import the FBX file
bpy.ops.import_scene.fbx(filepath=fbx_file)
log("Loaded {}".format(fbx_file))

modifier_name = 'DecimateMod'
object_list = bpy.data.objects
meshes = [obj for obj in object_list if obj.type == "MESH"]

log("{} meshes found".format(len(meshes)))

for i, obj in enumerate(meshes):
    bpy.context.view_layer.objects.active = obj
    log("{}/{} meshes, name: {}".format(i + 1, len(meshes), obj.name))
    log("{} has {} verts, {} edges, {} polys".format(obj.name, len(obj.data.vertices), len(obj.data.edges), len(obj.data.polygons)))

    # Make the mesh data unique
    obj.data = obj.data.copy()

    modifier = obj.modifiers.new(modifier_name, 'DECIMATE')
    modifier.ratio = decimate_ratio
    modifier.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=modifier_name)
    
    log("{} has {} verts, {} edges, {} polys after decimation".format(obj.name, len(obj.data.vertices), len(obj.data.edges), len(obj.data.polygons)))

# Export the decimated FBX file
output_file = fbx_file.replace(".fbx", "_decimated.fbx")
bpy.ops.export_scene.fbx(filepath=output_file)
log("Exported decimated model to {}".format(output_file))

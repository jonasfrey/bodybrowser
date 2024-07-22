
let n_tau = Math.PI*2.;
function removeModel(model) {
    if (model) {
        // Traverse through the model to find all geometries and materials to dispose of them
        model.traverse(child => {
            if (child.isMesh) {
                child.geometry.dispose();

                if (Array.isArray(child.material)) {
                    child.material.forEach(material => {
                        disposeMaterial(material);
                    });
                } else {
                    disposeMaterial(child.material);
                }
            }
        });
        // Remove the model from the scene
        o_state.o_scene.remove(model);
    }
}

function disposeMaterial(material) {
    // Dispose of the material's textures if they exist
    for (const key in material) {
        if (material[key] && material[key].isTexture) {
            material[key].dispose();
        }
    }
    material.dispose();
}
let f_loadModel = function(path, onLoad) {
        const loader = new FBXLoader();
        loader.load(path, object => {
            object.traverse(child => {
                if (child.isMesh) {
                    const material = new THREE.MeshStandardMaterial({
                        color: new THREE.Color(0.8, 0.8, 0.8), // Light gray color
                        metalness: 0.5, // Adjust for realistic metal look
                        roughness: 0.5 // Adjust for realistic surface roughness
                    });
                    child.material = material;
    
                    // Optional: Apply a subtle variation to distinguish parts
                    const hsl = material.color.getHSL({ h: 0, s: 0, l: 0 });
                    const hueVariation = 0.02 * (Math.random() - 0.5); // Small hue variation
                    hsl.h += hueVariation;
                    material.color.setHSL(hsl.h, hsl.s, hsl.l);
                }
            });
            onLoad(object);
        }, undefined, error => {
            console.error(error);
        });
    }
    

// Determine the current domain
const s_hostname = window.location.hostname;

// Create the WebSocket URL, assuming ws for http and wss for https
const s_protocol_ws = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const s_url_ws = `${s_protocol_ws}//${s_hostname}:${window.location.port}`;


// To close the WebSocket
// o_ws.close();

let a_s_path_model = [
    './3d_files/MuscularSystem100_decimated.fbx',
    './3d_files/VisceralSystem100_decimated.fbx',
    './3d_files/Joints100_decimated.fbx',
    './3d_files/CardioVascular41_decimated.fbx',
    './3d_files/LymphoidOrgans100_decimated.fbx',
    './3d_files/References100_decimated.fbx',
    './3d_files/NervousSystem100_decimated.fbx',
    './3d_files/SkeletalSystem100_decimated.fbx',
];
let a_s_name_model = a_s_path_model.map(s=>{
    return s.split('/').pop().split('.').shift().split('_').shift()
})
let a_s_path_skybox_texture = [
    './textures/autumn_field_puresky_4k.png',
    './textures/autumn_ground_4k.png',
    './textures/beach_cloudy_bridge_4k.png',
    './textures/belfast_sunset_4k.png',
    './textures/dikhololo_night_2k.png',
    './textures/lakeside_4k.png',
    './textures/neon_photostudio_4k.png',
    './textures/rocky_ridge_4k.png',
    './textures/rosendal_plains_1_4k.png',
    './textures/winter_river_4k.png',
];
let f_s_name_skybox_texture = function(s_url){
    return s_url.split('/').pop().split('.').shift()
}

let a_s_name_skybox_texture = a_s_path_skybox_texture.map(s=>f_s_name_skybox_texture(s));

let o_state = {
    a_s_path_skybox_texture,
    a_s_name_skybox_texture,
    s_name_skybox_texture: a_s_name_skybox_texture[0],
    a_s_path_model,
    a_s_name_model, 
    s_name_model: a_s_name_model[0],
    n_number: 0.2,
    s_msg: '', 
    a_o_msg: [], 
    o_trn_nor_mouse_last: [.5,.5],
    o_trn_nor_mouse: [.5,.5], 
    o_trn_nor_mouse_follow: [0.,0.],
    o_scene: null, 
    o_camera: null,
    o_renderer: null,
    o_light_ambient: null,
    o_light_directional: null,
    o_controls: null,
    o_raycaster: null,
    o_mouse: null,
    o_model: null, 
    a_o_controller_selectstart: [],
    a_o_controller_selectend: [],
    a_o_controller_squeezestart: [],
    a_o_controller_squeezeend: []
};
window.o_state = o_state;


import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';


// import { Stats } from "./stats.module.js";

// Scene
o_state.o_scene = new THREE.Scene();

// Camera
o_state.o_camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
o_state.o_camera.position.set(1, 1, 1);

// Renderer
o_state.o_renderer = new THREE.WebGLRenderer({ antialias: true });
o_state.o_renderer.setSize(window.innerWidth, window.innerHeight);
o_state.o_renderer.xr.enabled = true;
document.body.appendChild(o_state.o_renderer.domElement);

// VR Button
document.body.appendChild(VRButton.createButton(o_state.o_renderer));

// Adjust the ambient light
o_state.o_light_ambient = new THREE.AmbientLight(0x404040, 0.5); // Softer ambient light
o_state.o_scene.add(o_state.o_light_ambient);

// Adjust the directional light
o_state.o_light_directional = new THREE.DirectionalLight(0xffffff, 0.8);
o_state.o_light_directional.position.set(5, 5, 5);
o_state.o_scene.add(o_state.o_light_directional);

// Headlamp (Spotlight attached to the camera)
const o_spotlight = new THREE.SpotLight(0xffffff, 0.5); // Reduce intensity
o_spotlight.position.set(0, 0, 0);
o_spotlight.target.position.set(0, 0, -1);
o_state.o_camera.add(o_spotlight);
o_state.o_camera.add(o_spotlight.target);
o_state.o_scene.add(o_state.o_camera);

// Controls
o_state.o_controls = new OrbitControls(o_state.o_camera, o_state.o_renderer.domElement);
o_state.o_controls.enableDamping = true;
o_state.o_controls.dampingFactor = 0.05;
o_state.o_controls.screenSpacePanning = false;
o_state.o_controls.maxPolarAngle = Math.PI / 2;

// Raycaster setup
o_state.o_raycaster = new THREE.Raycaster();
o_state.o_mouse = new THREE.Vector2();
o_state.o_tempMatrix = new THREE.Matrix4();


// Floor
// const o_geometry_floor = new THREE.PlaneGeometry(100, 100);
// const o_material_floor = new THREE.MeshStandardMaterial({ color: 0x808080 });
// const o_floor = new THREE.Mesh(o_geometry_floor, o_material_floor);
// o_floor.rotation.x = -Math.PI / 2;
// o_floor.position.y = -0.5;
// o_state.o_scene.add(o_floor);

// Add Grid Helper
// const gridHelper = new THREE.GridHelper(100, 100);
// o_state.o_scene.add(gridHelper);


function f_change_skybox_texture() {
    let n_idx = o_state.a_s_name_skybox_texture.indexOf(o_state.s_name_skybox_texture);
    let s_path = o_state.a_s_path_skybox_texture[n_idx];
    const loader = new THREE.TextureLoader();
    loader.load(s_path, function(texture) {
        const o_geometry_sky = new THREE.SphereGeometry(500, 60, 40);
        const o_material_sky = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
        
        // Remove old skybox if it exists
        if (o_state.o_sky) {
            o_state.o_scene.remove(o_state.o_sky);
        }
        
        // Add new skybox
        o_state.o_sky = new THREE.Mesh(o_geometry_sky, o_material_sky);
        o_state.o_scene.add(o_state.o_sky);
    });
}

f_change_skybox_texture('./textures/dikhololo_night_2k.png')


let f_update_model = function(){

    let n_idx = o_state.a_s_name_model.indexOf(o_state.s_name_model);

    // Remove the current model if it exists
    removeModel(o_state.o_model);

    // Load the new model
    f_loadModel(o_state.a_s_path_model[n_idx], o_model_new => {
        // Set the new model's scale
        o_model_new.scale.set(0.01, 0.01, 0.01);
        // Add the new model to the scene
        o_state.o_scene.add(o_model_new);
        // Update the state to reference the new model
        o_state.o_model = o_model_new;
    });
    
}

let o_intersected = null;


const geometry = new THREE.BufferGeometry();
geometry.setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 5 ) ] );

o_state.o_controller_model_factory = new XRControllerModelFactory();

let f_update_spatial_properties_in_userData = function(o,s_suffix){
    ['position', 'rotation', 'scale', 'quaternion'].forEach(s=>{
        o.userData[`o_${s}_${s_suffix}`] = o[s].clone()
    })
};

[0,1].forEach(n=>{
    
    o_state[`o_controller${n}`] = o_state.o_renderer.xr.getController( n );
    o_state[`o_controller${n}`].add( new THREE.Line( geometry ) );
    o_state.o_scene.add( o_state[`o_controller${n}`] );

    let a_s_event = [
        "selectstart",
        "selectend",
        "squeezestart",
        "squeezeend",
        // "thumbstickmove",    
        // "thumbstickpress",
    ].forEach(s_name_event=>{
        o_state[`o_controller${n}`].addEventListener(
            s_name_event, 
            (o_e)=>{
                console.log(s_name_event)

                let o_controller = o_e.target;
                let s_suffix = ['start', 'end'].find(s=>{return s_name_event.includes(s)})
                let s_suffix_other = ['start', 'end'].find(s=>s!=s_suffix);
                console.log(s_suffix)
                let s_name_event_other = s_name_event.replace(s_suffix, s_suffix_other);
                o_state[`a_o_controller_${s_name_event_other}`] = o_state[`a_o_controller_${s_name_event_other}`].filter(o=>o!=o_controller); 
                if(o_state[`a_o_controller_${s_name_event}`].indexOf(o_controller) == -1){
                    o_state[`a_o_controller_${s_name_event}`].push(o_controller);
                }
                console.log(o_state[`a_o_controller_${s_name_event}`])

                f_update_spatial_properties_in_userData(o_controller, s_name_event);

                if (o_state.o_model) {
                    f_update_spatial_properties_in_userData(o_state.o_model, s_name_event);
                }
                if (s_name_event === "squeezestart" && o_state.o_model) {
                    // Attach the model to the controller
                    o_controller.attach(o_state.o_model);
                } else if (s_name_event === "squeezeend" && o_state.o_model) {
                    // Detach the model from the controller and restore its world position and rotation
                    o_state.o_scene.attach(o_state.o_model);
                }

                

            }
        )
    })



    o_state[`o_controller_grip${n}`] = o_state.o_renderer.xr.getControllerGrip( n );
    o_state[`o_controller_grip${n}`].add( o_state.o_controller_model_factory.createControllerModel( o_state[`o_controller_grip${n}`] ) );
    o_state.o_scene.add( o_state[`o_controller_grip${n}`] );


    f_update_spatial_properties_in_userData(o_state[`o_controller${n}`], 'initial');
})


// function init_controllers() {
//     o_state.o_controller1 = o_state.o_renderer.xr.getController(0);
//     o_state.o_controller2 = o_state.o_renderer.xr.getController(1);
//     o_state.o_scene.add(o_state.o_controller1);
//     o_state.o_scene.add(o_state.o_controller2);

//     const o_geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
//     const o_line = new THREE.Line(o_geometry);
//     o_line.name = 'line';
//     o_line.scale.z = 0.05;
//     o_state.o_controller1.add(o_line.clone());
//     o_state.o_controller2.add(o_line.clone());

//     o_state.o_controller1.addEventListener('selectstart', on_select_start);
//     o_state.o_controller1.addEventListener('selectend', on_select_end);
//     o_state.o_controller2.addEventListener('selectstart', on_select_start);
//     o_state.o_controller2.addEventListener('selectend', on_select_end);

//     o_state.o_controller1.addEventListener('squeezestart', on_squeeze_start);
//     o_state.o_controller2.addEventListener('squeezestart', on_squeeze_start);
// }


let f_highlight_intersected_face = function(intersected) {
    if (o_intersected !== intersected) {
        if (o_intersected && o_intersected.object.userData.isInteractive) {
            o_intersected.object.material.color.set(o_intersected.object.userData.originalColor);
            o_intersected.object.material.needsUpdate = true;
        }
        if (intersected && intersected.object.userData.isInteractive) {
            intersected.object.userData.originalColor = intersected.object.material.color.getHex();
            intersected.object.material.color.setHex(0xff0000); // Highlight color
            intersected.object.material.needsUpdate = true;
        }
        o_intersected = intersected;
    }
}


// Initialize Stats.js
o_state.o_stats = new Stats();
document.body.appendChild(o_state.o_stats.dom);

let f_on_change_gui = function(){
    console.log(o_state)
}
const o_gui = new GUI( { width: 300 } );
o_gui.add( o_state, 'n_number', 0.0, 1.0 ).onChange( f_on_change_gui );
o_gui.add( o_state, 's_name_model', o_state.a_s_name_model).onChange( ()=>{
    f_update_model();
});
o_gui.add( o_state, 's_name_skybox_texture', o_state.a_s_name_skybox_texture).onChange( ()=>{
    f_change_skybox_texture();
});

// Add an image to the GUI
const img = document.createElement('img');
img.src = './textures/autumn_field_puresky_4k.png'; // Update the image path
img.style.width = '100px';
img.style.height = '100px';
img.style.display = 'block'; // Ensure the image is displayed
img.style.margin = '10px auto'; // Center the image
o_gui.domElement.appendChild(img);

const o_group = new InteractiveGroup(
    o_state.o_renderer, o_state.o_camera
);

// debugger
// // o_group.listenToPointerEvents( o_state.o_renderer, o_state.o_camera );
// o_group.listenToXRControllerEvents( o_state[`o_controller1`] );
// o_group.listenToXRControllerEvents( o_state[`o_controller2`] );
o_state.o_scene.add( o_group );


o_state.o_image_group = new THREE.Group();

o_state.a_s_path_skybox_texture.forEach(
    (s_url, n_idx)=>{
        let n_idx_nor = n_idx/ o_state.a_s_path_skybox_texture.length;
        console.log(n_idx_nor);
        // Image plane setup
        // Image plane setup
        const o_texture_loader = new THREE.TextureLoader();
        
        const o_image_texture = o_texture_loader.load(s_url); // Update with your image path
        const o_image_geometry = new THREE.PlaneGeometry(1, 1);
        const o_image_material = new THREE.MeshBasicMaterial({ map: o_image_texture });

        const o_image_plane = new THREE.Mesh(o_image_geometry, o_image_material);
        o_image_plane.userData.isInteractive = true;
        o_image_plane.userData.originalColor = o_image_plane.material.color.getHex();

        // Outline plane setup
        const o_outline_material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, opacity: 0.5, transparent: true }); // Highlight color with transparency
        const o_outline_plane = new THREE.Mesh(o_image_geometry, o_outline_material);
        o_outline_plane.visible = false; // Initially hidden

        o_image_plane.attach(o_outline_plane);
        o_outline_plane.scale.multiplyScalar( 1.05 );
        o_image_plane.userData.o_outline_plane = o_outline_plane
        // Group setup
        o_state.o_image_group.add(o_image_plane);
        o_state.o_image_group.add(o_outline_plane);
        let n_amp = 3.;
        let n_freq = (n_idx_nor+.5)*n_tau*.5;
        o_image_plane.position.set(
            Math.sin(n_freq)*n_amp,
            0,
            Math.cos(n_freq)*n_amp
        );


    }
)


o_state.o_image_group.position.set(0, 3, -3); // Adjust position as needed
o_state.o_scene.add(o_state.o_image_group);
o_group.add(o_state.o_image_group);



const o_mesh = new HTMLMesh( o_gui.domElement );
o_mesh.position.x = - 0.75;
o_mesh.position.y = 1.5;
o_mesh.position.z = - 0.5;
o_mesh.rotation.y = Math.PI / 4;
o_mesh.scale.setScalar( 2 );
o_group.add( o_mesh );


// o_gui.domElement.style.visibility = 'hidden';



// Animation loop
o_state.o_renderer.setAnimationLoop(function () {
    o_state.o_stats.begin(); // Start measuring

    if (o_state.o_model) {
        // o_model.rotation.y += 0.001; // Adjust the rotation speed as needed

        let o_controller_squeezing = o_state.a_o_controller_squeezestart?.[0]

        const intersects = o_state.o_raycaster.intersectObject(o_state.o_model, true);
        if (intersects.length > 0) {
            f_highlight_intersected_face(intersects[0]);
        } else {
            f_highlight_intersected_face(null);
        }
    }
    o_state.o_controller0.userData.a_o_intersection = getIntersections(o_state.o_controller0)
    o_state.o_controller1.userData.a_o_intersection = getIntersections(o_state.o_controller1)


    o_state.o_image_group.children.forEach((o)=>{
        o_state.o_image_group.lookAt(o_state.o_camera.position);
        if(o.userData.o_outline_plane){
            const direction = new THREE.Vector3();
            direction.subVectors(o.position, o_state.o_camera.position).normalize();
            o.userData.o_outline_plane.position.copy(o.position).addScaledVector(direction, 0.01);
            o.userData.o_outline_plane.visible = false
        }
    });

    [
        o_state.o_controller0, 
        o_state.o_controller1
    ].forEach(o_controller=>{
        o_controller.userData.a_o_intersection.forEach((o)=>{
            if(o.object.userData.o_outline_plane){
                o.object.userData.o_outline_plane.visible = true 
                let b =  o_state.a_o_controller_selectstart.includes(
                    o_controller
                );
                // console.log({b, o_controller, a_o: o_state.a_o_controller_selectstart})
                if(
                    b
                ){
                    console.log(o_controller)
                    let s = f_s_name_skybox_texture(o.object.material.map.source.data.src);
                    if(o_state.s_name_skybox_texture != s){
                        o_state.s_name_skybox_texture = s
                        f_change_skybox_texture()
                    }
                }
            }
        })
    })



    o_state.o_controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    o_state.o_renderer.render(o_state.o_scene, o_state.o_camera);
    o_state.o_stats.end(); // End measuring
});

// Handle window resize
window.addEventListener('resize', function () {
    o_state.o_camera.aspect = window.innerWidth / window.innerHeight;
    o_state.o_camera.updateProjectionMatrix();
    o_state.o_renderer.setSize(window.innerWidth, window.innerHeight);
});

f_update_model();

function getIntersections(controller) {
    o_state.o_tempMatrix.identity().extractRotation(controller.matrixWorld);

    o_state.o_raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    o_state.o_raycaster.ray.direction.set(0, 0, -1).applyMatrix4(o_state.o_tempMatrix);

    return o_state.o_raycaster.intersectObjects(o_group.children, true);
}




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
function loadModel(path, onLoad) {
    const loader = new FBXLoader();
    loader.load(path, object => {
        object.traverse(child => {
            if (child.isMesh) {
                const material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(Math.random(), Math.random(), Math.random()),
                    vertexColors: true
                });
                child.material = material;

                const geometry = child.geometry;
                const position = geometry.attributes.position;
                const colors = [];

                for (let i = 0; i < position.count; i++) {
                    colors.push(Math.random(), Math.random(), Math.random());
                }

                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
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
let o_state = {
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
}
window.o_state = o_state


import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

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

// Lights
o_state.o_light_ambient = new THREE.AmbientLight(0x404040, 2); // Soft white ambient light
o_state.o_scene.add(o_state.o_light_ambient);

o_state.o_light_directional = new THREE.DirectionalLight(0xffffff, 1);
o_state.o_light_directional.position.set(5, 5, 5);
o_state.o_scene.add(o_state.o_light_directional);

// Controls
o_state.o_controls = new OrbitControls(o_state.o_camera, o_state.o_renderer.domElement);
o_state.o_controls.enableDamping = true;
o_state.o_controls.dampingFactor = 0.05;
o_state.o_controls.screenSpacePanning = false;
o_state.o_controls.maxPolarAngle = Math.PI / 2;

// Raycaster setup
o_state.o_raycaster = new THREE.Raycaster();
o_state.o_mouse = new THREE.Vector2();

let f_update_model = function(){

    let n_idx = o_state.a_s_name_model.indexOf(o_state.s_name_model);

    // Remove the current model if it exists
    removeModel(o_state.o_model);

    // Load the new model
    loadModel(o_state.a_s_path_model[n_idx], o_model_new => {
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
                let o_controller = o_e.target;
                let s_suffix = ['start', 'end'].filter(s=>{return s_name_event.includes(s)})
                let s_suffix_other = ['start', 'end'].find(s=>s!=s_suffix);
                let s_name_event_other = s_name_event.replace(s_suffix, s_suffix_other);
                o_state[`a_o_controller_${s_name_event_other}`] = o_state[`a_o_controller_${s_name_event_other}`].filter(o=>!o_controller); 
                o_state[`a_o_controller_${s_name_event}`].push(o_controller);
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


                o_state.a_o_controller
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
        // if (o_intersected) {
        //     o_intersected.object.material.color.set(o_intersected.currentColor);
        //     o_intersected.object.material.needsUpdate = true;
        // }
        // if (intersected) {
        //     intersected.currentColor = intersected.object.material.color.getHex();
        //     intersected.object.material.color.setHex(0xff0000); // Highlight color
        //     intersected.object.material.needsUpdate = true;
        // }
        // o_intersected = intersected;
    }
}

// Floor
const o_geometry_floor = new THREE.PlaneGeometry(100, 100);
const o_material_floor = new THREE.MeshStandardMaterial({ color: 0x808080 });
const o_floor = new THREE.Mesh(o_geometry_floor, o_material_floor);
o_floor.rotation.x = -Math.PI / 2;
o_floor.position.y = -0.5;
o_state.o_scene.add(o_floor);

// Skybox
const o_geometry_sky = new THREE.SphereGeometry(500, 60, 40);
const o_material_sky = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }); // Light blue color
const o_sky = new THREE.Mesh(o_geometry_sky, o_material_sky);
o_state.o_scene.add(o_sky);

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
// o_gui.domElement.style.visibility = 'hidden';



// Animation loop
o_state.o_renderer.setAnimationLoop(function () {
    o_state.o_stats.begin(); // Start measuring

    if (o_state.o_model) {
        // o_model.rotation.y += 0.001; // Adjust the rotation speed as needed

        let o_controller_squeezing = o_state.a_o_controller_squeezestart?.[0];
        // if (o_controller_squeezing) {
        //     const o_delta_translation = new THREE.Vector3().subVectors(
        //         o_controller_squeezing.position,
        //         o_controller_squeezing.userData.o_position_squeezestart
        //     );
        //     const o_delta_rotation = new THREE.Vector3().subVectors(
        //         o_controller_squeezing.rotation,
        //         o_controller_squeezing.userData.o_rotation_squeezestart
        //     );

        //     o_state.o_model.position.set(
        //         o_state.o_model.userData.o_position_squeezestart.x + o_delta_translation.x,
        //         o_state.o_model.userData.o_position_squeezestart.y + o_delta_translation.y,
        //         o_state.o_model.userData.o_position_squeezestart.z + o_delta_translation.z,
        //     );




        //     // Calculate rotation delta using quaternions
        //     const initialControllerQuaternion = new THREE.Quaternion().copy(o_controller_squeezing.userData.o_quaternion_squeezestart);
        //     const currentControllerQuaternion = o_controller_squeezing.quaternion.clone();
        //     const deltaQuaternion = new THREE.Quaternion().multiplyQuaternions(currentControllerQuaternion, initialControllerQuaternion.invert());

        //     const controllerPosition = o_controller_squeezing.position.clone();
        //     // Move the model to the controller's position for rotation
        //     // Rotation
        //     // Apply rotation around the model's center
        //     o_state.o_model.position.sub(controllerPosition);
        //     o_state.o_model.quaternion.copy(o_state.o_model.userData.o_quaternion_squeezestart).premultiply(deltaQuaternion);
        //     o_state.o_model.position.add(controllerPosition);

        // }
        // // Update raycaster to use the controller's position and direction
        // const o_state.o_controller1_world_position = new THREE.Vector3();
        // const o_state.o_controller1_world_direction = new THREE.Vector3();
        // o_state.o_controller1.getWorldPosition(o_state.o_controller1_world_position);
        // o_state.o_controller1.getWorldDirection(o_state.o_controller1_world_direction);

        // o_raycaster.set(o_state.o_controller1_world_position, o_state.o_controller1_world_direction);

        const intersects = o_state.o_raycaster.intersectObject(o_state.o_model, true);
        if (intersects.length > 0) {
            f_highlight_intersected_face(intersects[0]);
        } else {
            f_highlight_intersected_face(null);
        }
    }

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

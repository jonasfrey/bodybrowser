
import {
    f_add_css,
    f_s_css_prefixed,
    o_variables, 
    f_s_css_from_o_variables
} from "https://deno.land/x/f_add_css@1.1/mod.js"

import {
    f_o_html__and_make_renderable,
}
from 'https://deno.land/x/f_o_html_from_o_js@2.9/mod.js'



// import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
// import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/FBXLoader.js';



o_variables.n_rem_font_size_base = 1. // adjust font size, other variables can also be adapted before adding the css to the dom
o_variables.n_rem_padding_interactive_elements = 0.5; // adjust padding for interactive elements 
f_add_css(
    `
    body{
        min-height: 100vh;
        min-width: 100vw;
        /* background: rgba(0,0,0,0.84);*/
        display:flex;
        justify-content:center;
    }
    canvas{
        width: 100%;
        height: 100%;
        position:fixed;
        z-index:-1;
    }
    .app{
        max-width: 1000px;
        width:100%;
        height: 100vh;
        display:flex;
        flex-direction: column;
        justify-content:flex-end;
    }
    ${
        f_s_css_from_o_variables(
            o_variables
        )
    }
    `

);


let o_canvas = document.createElement('canvas');
o_canvas.width = window.innerWidth
o_canvas.height = window.innerHeight
document.body.appendChild(o_canvas);


let f_resize = ()=>{
    o_canvas.width = window.innerWidth
    o_canvas.height = window.innerHeight
}
window.addEventListener('resize',()=>{
    f_resize()
});
f_resize()

let n_id_raf = 0;
let f_raf = function(){
    //render
}
n_id_raf = window.requestAnimationFrame(f_raf);

// Determine the current domain
const s_hostname = window.location.hostname;

// Create the WebSocket URL, assuming ws for http and wss for https
const s_protocol_ws = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const s_url_ws = `${s_protocol_ws}//${s_hostname}:${window.location.port}`;


// To close the WebSocket
// o_ws.close();

let o_state = {
    s_msg: '', 
    a_o_msg: [], 
    o_trn_nor_mouse_last: [.5,.5],
    o_trn_nor_mouse: [.5,.5], 
    o_trn_nor_mouse_follow: [0.,0.]
}
window.o_state = o_state


import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// import { Stats } from "./stats.module.js";

// Scene
const o_scene = new THREE.Scene();

// Camera
const o_camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
o_camera.position.set(1, 1, 1);

// Renderer
const o_renderer = new THREE.WebGLRenderer({ antialias: true });
o_renderer.setSize(window.innerWidth, window.innerHeight);
o_renderer.xr.enabled = true;
document.body.appendChild(o_renderer.domElement);

// VR Button
document.body.appendChild(VRButton.createButton(o_renderer));

// Lights
const o_light_ambient = new THREE.AmbientLight(0x404040, 2); // Soft white ambient light
o_scene.add(o_light_ambient);

const o_light_directional = new THREE.DirectionalLight(0xffffff, 1);
o_light_directional.position.set(5, 5, 5);
o_scene.add(o_light_directional);

// Controls
const o_controls = new OrbitControls(o_camera, o_renderer.domElement);
o_controls.enableDamping = true;
o_controls.dampingFactor = 0.05;
o_controls.screenSpacePanning = false;
o_controls.maxPolarAngle = Math.PI / 2;

// Raycaster setup
const o_raycaster = new THREE.Raycaster();
const o_mouse = new THREE.Vector2();

// Load FBX model
let o_model;
const o_loader = new FBXLoader();
o_loader.load('./3d_files/MuscularSystem100_decimated.fbx', function (o_object) {
    o_object.traverse(function (o_child) {
        if (o_child.isMesh) {
            const o_material = new THREE.MeshStandardMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()), vertexColors: true });
            o_child.material = o_material;
            
            const geometry = o_child.geometry;
            const position = geometry.attributes.position;
            const colors = [];

            for (let i = 0; i < position.count; i++) {
                colors.push(Math.random(), Math.random(), Math.random());
            }

            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }
    });
    o_model = o_object;
    window.o_model = o_model;
    o_model.scale.set(0.01, 0.01, 0.01); // Scale down the model
    o_scene.add(o_model);
}, undefined, function (error) {
    console.error(error);
});

// VR controller setup
let o_controller1, o_controller2;
let o_position_initial_controller = new THREE.Vector3();
let o_rotation_initial_controller = new THREE.Vector3();
let o_position_initial_model = new THREE.Vector3();
let o_rotation_initial_model = new THREE.Vector3();
let b_is_grabbing = false;
let o_intersected = null;

function init_controllers() {
    o_controller1 = o_renderer.xr.getController(0);
    o_controller2 = o_renderer.xr.getController(1);
    o_scene.add(o_controller1);
    o_scene.add(o_controller2);

    const o_geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    const o_line = new THREE.Line(o_geometry);
    o_line.name = 'line';
    o_line.scale.z = 0.05;

    o_controller1.add(o_line.clone());
    o_controller2.add(o_line.clone());

    o_controller1.addEventListener('selectstart', on_select_start);
    o_controller1.addEventListener('selectend', on_select_end);
    o_controller2.addEventListener('selectstart', on_select_start);
    o_controller2.addEventListener('selectend', on_select_end);

    o_controller1.addEventListener('squeezestart', on_squeeze_start);
    o_controller2.addEventListener('squeezestart', on_squeeze_start);
}

function on_select_start(event) {
    b_is_grabbing = true;
    o_position_initial_controller = o_controller1.position.clone();
    o_rotation_initial_controller = o_controller1.rotation.clone();
    if (o_model) {
        o_position_initial_model = o_model.position.clone();
        o_rotation_initial_model = o_model.rotation.clone();
    }
    console.log({ o_position_initial_controller, o_position_initial_model });
}

function on_select_end(event) {
    b_is_grabbing = false;
}

function on_squeeze_start(event) {
    if (o_intersected) {
        o_intersected.object.visible = false; // Hide the intersected mesh
    }
}

function highlight_intersected_face(intersected) {
    if (o_intersected !== intersected) {
        if (o_intersected) {
            o_intersected.object.material.color.set(o_intersected.currentColor);
            o_intersected.object.material.needsUpdate = true;
        }
        if (intersected) {
            intersected.currentColor = intersected.object.material.color.getHex();
            intersected.object.material.color.setHex(0xff0000); // Highlight color
            intersected.object.material.needsUpdate = true;
        }
        o_intersected = intersected;
    }
}

// Floor
const o_geometry_floor = new THREE.PlaneGeometry(100, 100);
const o_material_floor = new THREE.MeshStandardMaterial({ color: 0x808080 });
const o_floor = new THREE.Mesh(o_geometry_floor, o_material_floor);
o_floor.rotation.x = -Math.PI / 2;
o_floor.position.y = -0.5;
o_scene.add(o_floor);

// Skybox
const o_geometry_sky = new THREE.SphereGeometry(500, 60, 40);
const o_material_sky = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }); // Light blue color
const o_sky = new THREE.Mesh(o_geometry_sky, o_material_sky);
o_scene.add(o_sky);

// Initialize Stats.js
const o_stats = new Stats();
document.body.appendChild(o_stats.dom);

// Animation loop
o_renderer.setAnimationLoop(function () {
    o_stats.begin(); // Start measuring

    if (o_model) {
        // o_model.rotation.y += 0.001; // Adjust the rotation speed as needed

        if (b_is_grabbing) {
            const o_delta_translation = new THREE.Vector3().subVectors(o_controller1.position, o_position_initial_controller);
            const o_delta_rotation = new THREE.Vector3().subVectors(o_controller1.rotation, o_rotation_initial_controller);

            o_model.position.set(
                o_position_initial_model.x + o_delta_translation.x,
                o_position_initial_model.y + o_delta_translation.y,
                o_position_initial_model.z + o_delta_translation.z,
            );
            o_model.rotation.set(
                o_rotation_initial_model.x + o_delta_rotation.x,
                o_rotation_initial_model.y + o_delta_rotation.y,
                o_rotation_initial_model.z + o_delta_rotation.z,
            );
        }

        // Update raycaster to use the controller's position and direction
        const o_controller1_world_position = new THREE.Vector3();
        const o_controller1_world_direction = new THREE.Vector3();
        o_controller1.getWorldPosition(o_controller1_world_position);
        o_controller1.getWorldDirection(o_controller1_world_direction);

        o_raycaster.set(o_controller1_world_position, o_controller1_world_direction);

        const intersects = o_raycaster.intersectObject(o_model, true);
        if (intersects.length > 0) {
            highlight_intersected_face(intersects[0]);
        } else {
            highlight_intersected_face(null);
        }
    }

    o_controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

    o_renderer.render(o_scene, o_camera);
    o_stats.end(); // End measuring
});

// Handle window resize
window.addEventListener('resize', function () {
    o_camera.aspect = window.innerWidth / window.innerHeight;
    o_camera.updateProjectionMatrix();
    o_renderer.setSize(window.innerWidth, window.innerHeight);
});

init_controllers();

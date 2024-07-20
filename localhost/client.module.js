
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

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(1, 1, 1);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// VR Button
document.body.appendChild(VRButton.createButton(renderer));

// Light
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;

// Load FBX model
let model;
const loader = new GLTFLoader();
loader.load('./3d_files/Skelet200k.glb', function (gltf) {
    model = gltf.scene;
    window.model = model;
    model.scale.set(0.01, 0.01, 0.01); // Scale down the model
    scene.add(model);
}, undefined, function (error) {
    console.error(error);
});

// VR controller setup
let controller1, controller2;
let initialGrabPosition = new THREE.Vector3();
let initialModelPosition = new THREE.Vector3();
let isGrabbing = false;

function initControllers() {
    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);
    scene.add(controller1);
    scene.add(controller2);

    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    const line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 0.05;

    controller1.add(line.clone());
    controller2.add(line.clone());

    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
}

function onSelectStart(event) {
    // alert('select start ');
    isGrabbing = true;
    initialGrabPosition = controller1.position.clone();
    if (model) {
        initialModelPosition = model.position.clone();
    }
    console.log({ initialGrabPosition, initialModelPosition });
}

function onSelectEnd(event) {
    // alert('select end');
    isGrabbing = false;
}

// Floor
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
scene.add(floor);

// Skybox
const skyGeometry = new THREE.SphereGeometry(500, 60, 40);
const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }); // Light blue color
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// Animation loop
renderer.setAnimationLoop(function () {
    if (model) {
        model.rotation.y += 0.01; // Adjust the rotation speed as needed

        if (isGrabbing) {
            const controllerPosition = controller1.position;
            const delta = new THREE.Vector3().subVectors(controllerPosition, initialGrabPosition);
            console.log({
                controllerPosition,
                initialGrabPosition,
                initialModelPosition,
                delta,
            });
            model.position.set(
                initialModelPosition.x + delta.x,
                initialModelPosition.y + delta.y,
                initialModelPosition.z + delta.z,
            );
        }
    }

    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

    renderer.render(scene, camera);
});

// Handle window resize
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

initControllers();

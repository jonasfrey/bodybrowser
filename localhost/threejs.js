
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


// //readme.md:start
document.body.appendChild(
    await f_o_html__and_make_renderable(
        {
            s_tag: 'div', 
            class: "app",
            a_o: [
                Object.assign(
                    o_state, 
                    {
                        o_js__a_o_mod: {
                            f_o_jsh: ()=>{
                                return {
                                    class: "a_o_msg",
                                    a_o: [
                                        o_state.a_o_msg.map(o=>{
                                            return {
                                                style: [
                                                    'display:flex',
                                                    'flex-direction:row',
                                                    `justify-content: ${(o.s_uuidv4 == o_state.s_uuidv4) ? 'end' : 'start'}`,
                                                    'align-items:end'
                                                ].join(';'),
                                                a_o: [
                                                    {
                                                        innerText: o.s_msg
                                                    }
                                                ]
                                            }
                                        })
                                    ]
                                }
                            }
                        }
                    }
                ).o_js__a_o_mod,
            ]
        }
    )
);
// //readme.md:end

import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(100, 180, 0);
camera.position.set(1,1,1);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// VR Button
document.body.appendChild(VRButton.createButton(renderer));

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;

// Load FBX model
let model;
const loader = new FBXLoader();
loader.load('./3d_files/SkeletalSystem100.fbx', function (object) {
    model = object;
    model.scale.set(0.01, 0.01, 0.01); // Scale down the model
    scene.add(model);
}, undefined, function (error) {
    console.error(error);
});

// Animation loop
renderer.setAnimationLoop(function () {
    if (model) {
        model.rotation.y += 0.01; // Adjust the rotation speed as needed
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

window.camera = camera;


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
// Get the canvas element
const canvas = document.getElementById('renderCanvas');

// Generate the Babylon.js engine
const engine = new BABYLON.Engine(canvas, true);

// Create the scene
const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    // Create a camera and position it
    const camera = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 2, 2, new BABYLON.Vector3(0, 1, 0), scene);
    camera.setPosition(new BABYLON.Vector3(1, 1, 1));
    camera.attachControl(canvas, true);

    // Add a light
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);

    // Load the GLB model
    BABYLON.SceneLoader.ImportMesh("", "./3d_files/", "Skelet.glb", scene, function (meshes) {
        const model = meshes[0]; // Assuming the model is the first mesh
        model.scaling = new BABYLON.Vector3(1, 1, 1); // Scale the model if needed

        // Animation loop to make the model spin
        scene.onBeforeRenderObservable.add(() => {
            model.rotation.y += 0.01;
        });
    }, null, function (scene, message) {
        console.error(message);
    });

    // Enable VR
    BABYLON.WebXRDefaultExperience.CreateAsync(scene).then((xr) => {
        console.log("VR experience created");
    });

    return scene;
};

// Create the scene
const scene = createScene();

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(() => {
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener('resize', () => {
    engine.resize();
});

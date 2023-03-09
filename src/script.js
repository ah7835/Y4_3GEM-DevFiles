"use strict";

import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

//debug
import * as dat from "lil-gui";
import Stats from "stats.js";

//postprocess
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";

/**
 * Debug
 */
const gui = new dat.GUI();
// use 1 to turn on debugger
switch (1) {
  case 1:
    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    break;
  case 2:
    gui.hide();
    break;
}

/**
 * NFT Filter --- Idk Adam says this will be cool?
 */
//Goes from 0 to 4
const NFTshaderColorR = 0.53;
const NFTshaderColorG = 0.8;
const NFTshaderColorB = 1;
//Goes from -0.012 to 0.012
const NFTshaderTintX = 0;
const NFTshaderTintY = 0;
const NFTshaderTintZ = 0;

/**
 * Model
 */
//Background
let BoxSpaceBG;
//change between Elements
// let Elements = 4;
// let ObjType = 1;

let Elements = Math.floor(Math.random() * 4) + 1;
let ObjType = Math.floor(Math.random() * 2) + 1;

// const ElementNum = 4
switch (Elements) {
  case 1:
    // ice
    var Card3D = "./models/Cards/IceCard.gltf";
    var Gem3D = "./models/Gem/HexGEM.gltf";
    var AmbientColor = 0xedfdff;
    var SparkleColorR = 0;
    var SparkleColorG = 0.5;
    var SparkleColorB = 0.5;
    BoxSpaceBG = "2";
    break;
  case 2:
    // Earth
    var Card3D = "./models/Cards/EarthCard.gltf";
    var Gem3D = "./models/Gem/SquareGEM.gltf";
    var AmbientColor = 0xfbffe0;
    var SparkleColorR = 0.5;
    var SparkleColorG = 1;
    var SparkleColorB = 0;
    BoxSpaceBG = "3";
    break;
  case 3:
    // wind
    var Card3D = "./models/Cards/WindCard.gltf";
    var Gem3D = "./models/Gem/CircleGEM.gltf";
    var AmbientColor = 0xff17f6;
    var SparkleColorR = 1;
    var SparkleColorG = 0.2;
    var SparkleColorB = 1;
    BoxSpaceBG = "4";
    break;
  case 4:
    // // fire
    var Card3D = "./models/Cards/FireCard.gltf";
    var Gem3D = "./models/Gem/TriGEM.gltf";
    var AmbientColor = 0xffa6b5;
    var SparkleColorR = 1;
    var SparkleColorG = 0;
    var SparkleColorB = 0;
    BoxSpaceBG = "1";
    break;
}

//Switch between Gems and Sword
switch (ObjType) {
  case 1:
    var modelGLTF3D = Card3D;
    var ModelSize = 0.008;
    var SparkleNum = 125;
    var AmbientIntensity = 12;
    var DirectLight = 10;
    var BloomS = 0.5;
    var BloomR = 1.5;
    var BloomT = 0;
    var SparkArrayPos = 3;
    var sparkPosHor = 4;
    var sparkCount = 10;
    BoxSpaceBG = "0";
    break;
  case 2:
    var modelGLTF3D = Gem3D;
    var ModelSize = 0.04;
    var SparkleNum = 170;
    var AmbientIntensity = 1;
    var DirectLight = 2;
    var BloomS = 1;
    var BloomR = 2;
    var BloomT = 0;
    var SparkArrayPos = 4;
    var sparkPosHor = 15;
    var sparkCount = 15;
    break;
}

/**
 * Scene
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");
//loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
const cubeTextureLoader = new THREE.CubeTextureLoader();

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      child.material.envMapIntensity = 2.5;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Environment map
 */
new RGBELoader().load(
  "textures/drachenfels_cellar_1k.hdr",
  function (texture, textureData) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  }
);

// Environment mapping alternative
const linkENV = "./textures/environmentMaps/" + BoxSpaceBG;
const linkEnd = ".png";
const environmentMap = cubeTextureLoader.load([
  linkENV + "/px" + linkEnd,
  linkENV + "/nx" + linkEnd,
  linkENV + "/py" + linkEnd,
  linkENV + "/ny" + linkEnd,
  linkENV + "/pz" + linkEnd,
  linkENV + "/nz" + linkEnd,
]);
environmentMap.encoding = THREE.sRGBEncoding;

scene.background = environmentMap;
scene.environment = environmentMap;

/**
 * Models
 */

gltfLoader.load(modelGLTF3D, (gltf) => {
  gltf.scene.scale.set(ModelSize, ModelSize, ModelSize);
  gltf.scene.rotation.y = Math.PI * 1.75;
  scene.add(gltf.scene);

  updateAllMaterials();
});

/**
 * Sparkles
 */
//geometry
const sparkGeometry = new THREE.BufferGeometry();
const positionArray = new Float32Array(sparkCount * 3);
const scaleArray = new Float32Array(sparkCount);
for (let i = 0; i < sparkCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * sparkPosHor;
  positionArray[i * 3 + 1] = Math.random() * SparkArrayPos;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * sparkPosHor;

  scaleArray[i] = Math.random();
}
sparkGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3)
);
sparkGeometry.setAttribute("aScale", new THREE.BufferAttribute(scaleArray, 1));

// Material sparkles
const sparkMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: SparkleNum },

    uColorR: { value: SparkleColorR },
    uColorG: { value: SparkleColorG },
    uColorB: { value: SparkleColorB },
  },
  vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uSize;

        attribute float aScale;

    void main()
    {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        modelPosition.y += sin(uTime + modelPosition.x * 100.0) * aScale * 0.2;

        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectionPosition = projectionMatrix * viewPosition;

        gl_Position = projectionPosition;
    
        gl_PointSize = uSize * aScale * uPixelRatio;
        gl_PointSize *= (1.0 / - viewPosition.z);
    }
    `,
  fragmentShader: `
        uniform float uColorR;
        uniform float uColorG;
        uniform float uColorB;
    void main()
    {
        float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
        float strength = 0.05 / distanceToCenter - 0.1;

        gl_FragColor = vec4(uColorR, uColorG, uColorB, strength);
    }`,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// Points
const sparkles = new THREE.Points(sparkGeometry, sparkMaterial);
scene.add(sparkles);

/**
 * Lights
 */
const light = new THREE.AmbientLight(AmbientColor, AmbientIntensity); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight("#ffffff", DirectLight);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 3, -2.25);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update fireflies
  sparkMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );

  // Update effect composer
  effectComposer.setSize(sizes.width, sizes.height);
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(4, 1, -4);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
});
renderer.setClearColor(0xff0000, 0);

//realistic rendering
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
renderer.outputEncoding = THREE.sRGBEncoding;

//responsive
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Post processing
 */
let RenderTargetClass = null;

if (renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2) {
  RenderTargetClass = THREE.WebGLMultisampleRenderTarget;
  console.log("Using WebGLMultisampleRenderTarget");
} else {
  RenderTargetClass = THREE.WebGLRenderTarget;
  console.log("Using WebGLRenderTarget");
}

const renderTarget = new RenderTargetClass(800, 600, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});

// Effect composer
const effectComposer = new EffectComposer(renderer, renderTarget);
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
effectComposer.setSize(sizes.width, sizes.height);

// Render pass
const renderPass = new RenderPass(scene, camera);
effectComposer.addPass(renderPass);

// Antialias pass
if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) {
  const smaaPass = new SMAAPass();
  effectComposer.addPass(smaaPass);

  console.log("Using SMAA");
}

/**
 * NFT Filter
 */
//Color Filter
const colorShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTint: { value: null },
    color: { value: new THREE.Color(0x88ccff) },
  },
  vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
      }
    `,
  fragmentShader: `
      uniform vec3 color;
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      void main() {
        vec4 previousPassColor = texture2D(tDiffuse, vUv);
        gl_FragColor = vec4(
            previousPassColor.rgb * color,
            previousPassColor.a);
      }
    `,
};

const colorPass = new ShaderPass(colorShader);
colorPass.material.uniforms.color.value = new THREE.Color(
  NFTshaderColorR,
  NFTshaderColorG,
  NFTshaderColorB
);
colorPass.renderToScreen = true;
effectComposer.addPass(colorPass);

// Tint pass
const TintShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTint: { value: null },
    // uTint: { value: null }
  },
  vertexShader: `
        varying vec2 vUv;

        void main()
        {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vUv = uv;
        }
    `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 uTint;

    varying vec2 vUv;

    void main()
    {
        vec4 color = texture2D(tDiffuse, vUv);
        color.rgb += uTint;

        gl_FragColor = color;
    }
`,
};

const tintPass = new ShaderPass(TintShader);
tintPass.material.uniforms.uTint.value = new THREE.Vector3(
  NFTshaderTintX,
  NFTshaderTintY,
  NFTshaderTintZ
);
effectComposer.addPass(tintPass);

// Unreal Bloom pass
const unrealBloomPass = new UnrealBloomPass();
unrealBloomPass.enabled = true;
effectComposer.addPass(unrealBloomPass);

unrealBloomPass.strength = BloomS;
unrealBloomPass.radius = BloomR;
unrealBloomPass.threshold = BloomT;

/**
 * Debugger
 */
gui
  .add(sparkMaterial.uniforms.uSize, "value")
  .min(0)
  .max(500)
  .step(1)
  .name("SparkleSize");

const BloomGUI = gui.addFolder("Bloom");
BloomGUI.add(unrealBloomPass, "enabled");
BloomGUI.add(unrealBloomPass, "strength").min(0).max(2).step(0.001);
BloomGUI.add(unrealBloomPass, "radius").min(0).max(2).step(0.001);
BloomGUI.add(unrealBloomPass, "threshold").min(0).max(1).step(0.001);

const GemTintGUI = gui.addFolder("GLTF NFTshaderColor");
GemTintGUI.add(colorPass.uniforms.color.value, "r", 0, 4).name("GEMred");
GemTintGUI.add(colorPass.uniforms.color.value, "g", 0, 4).name("GEMgreen");
GemTintGUI.add(colorPass.uniforms.color.value, "b", 0, 4).name("GEMblue");

const SceneTintGUI = gui.addFolder("Scene NFTshaderTint");
SceneTintGUI.add(tintPass.material.uniforms.uTint.value, "x")
  .min(-0.012)
  .max(0.012)
  .step(0.001)
  .name("TINTred");
SceneTintGUI.add(tintPass.material.uniforms.uTint.value, "y")
  .min(-0.012)
  .max(0.012)
  .step(0.001)
  .name("TINTgreen");
SceneTintGUI.add(tintPass.material.uniforms.uTint.value, "z")
  .min(-0.012)
  .max(0.012)
  .step(0.001)
  .name("TINTblue");

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  // stats.begin()
  const elapsedTime = clock.getElapsedTime();

  // Update materials
  sparkMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  // renderer.render(scene, camera)
  effectComposer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
  // stats.end()
};

tick();

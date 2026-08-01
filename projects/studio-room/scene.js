/**
 * Studio Room — interactive 3D piano room + workspace.
 *
 * Ported from the Studio Room source project (https://github.com/moltpany/studio-room),
 * where the same scene runs as a React client component. This build is plain ES modules
 * so the demo can be served as a static page with no build step.
 */

import * as THREE from "three";
import { OrbitControls } from "./vendor/three/OrbitControls.js";
import { RoundedBoxGeometry } from "./vendor/three/RoundedBoxGeometry.js";

const PALETTE = {
  piano: 0x080908,
  pianoEdge: 0x1a1b1a,
  ivory: 0xf4f0e5,
  desk: 0xe8e2d6,
  deskEdge: 0xcac0b0,
  metal: 0x16191a,
  floor: 0x8c6b52,
  wall: 0xb8b2a8,
  brass: 0xbc8e43,
};

const IDLE_HINT = "拖拽查看琴房 · 滚轮缩放";

function addBox(parent, size, position, material, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addRoundedBox(parent, size, position, material, radius = 0.08, castShadow = true) {
  const safeRadius = Math.min(radius, Math.min(...size) * 0.42);
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(size[0], size[1], size[2], 4, safeRadius),
    material,
  );
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, radius, height, position, material, segments = 16) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.04, height, segments),
    material,
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSphere(parent, radius, position, material, scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function woodTexture(base = "#ded4c5", grain = "#b9a996") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.2;
  for (let y = 0; y < canvas.height; y += 7) {
    ctx.strokeStyle = y % 21 === 0 ? grain : "#ffffff";
    ctx.lineWidth = y % 21 === 0 ? 1.2 : 0.55;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 12) {
      const offset = Math.sin(x * 0.018 + y * 0.08) * 2.4 + Math.sin(x * 0.053) * 0.8;
      if (x === 0) ctx.moveTo(x, y + offset);
      else ctx.lineTo(x, y + offset);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function addContactShadow(scene, position, size, opacity = 0.24) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
  gradient.addColorStop(0, `rgba(22,18,15,${opacity})`);
  gradient.addColorStop(0.5, `rgba(22,18,15,${opacity * 0.52})`);
  gradient.addColorStop(1, "rgba(22,18,15,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(position[0], position[1] + 0.012, position[2]);
  scene.add(shadow);
}

function addCable(parent, points, material, radius = 0.018) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 7, false), material);
  cable.castShadow = true;
  parent.add(cable);
  return cable;
}

function landscapeTexture(mode = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");
  const sky = ctx.createLinearGradient(0, 0, 0, 520);
  if (mode === 0) {
    sky.addColorStop(0, "#f0c3a5");
    sky.addColorStop(0.42, "#9ac5c8");
    sky.addColorStop(1, "#2c6f73");
  } else {
    sky.addColorStop(0, "#0c1630");
    sky.addColorStop(0.52, "#214c65");
    sky.addColorStop(1, "#0c272f");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1200, 520);
  ctx.fillStyle = mode === 0 ? "#2e6869" : "#152f3d";
  ctx.beginPath();
  ctx.moveTo(0, 285);
  ctx.lineTo(180, 170);
  ctx.lineTo(305, 280);
  ctx.lineTo(470, 105);
  ctx.lineTo(640, 280);
  ctx.lineTo(820, 145);
  ctx.lineTo(980, 272);
  ctx.lineTo(1200, 120);
  ctx.lineTo(1200, 380);
  ctx.lineTo(0, 380);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = mode === 0 ? "#3f9192" : "#123a4a";
  ctx.fillRect(0, 330, 1200, 190);
  ctx.fillStyle = mode === 0 ? "#f6d07d" : "#d7b36a";
  for (let i = 0; i < 18; i += 1) {
    ctx.fillRect(520 + i * 18, 352 + (i % 4) * 3, 5, 30 + (i % 3) * 14);
  }
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.font = "600 18px Arial";
  ctx.fillText(mode === 0 ? "DAYLIGHT / HALLSTATT" : "NIGHT SESSION / 22:14", 44, 470);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function outdoorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 500);
  gradient.addColorStop(0, "#bfd0c2");
  gradient.addColorStop(0.6, "#739779");
  gradient.addColorStop(1, "#344b39");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 500);
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 89) % 820;
    const y = 70 + ((i * 47) % 320);
    const radius = 18 + ((i * 19) % 45);
    ctx.fillStyle = i % 3 === 0 ? "#55775a" : i % 3 === 1 ? "#75966b" : "#3e664b";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function projectBoardTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 660;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f2e9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1d2926";
  ctx.font = "700 34px Arial";
  ctx.fillText("PROJECT NETWORKS", 54, 58);
  ctx.fillStyle = "#718078";
  ctx.font = "600 16px Arial";
  ctx.fillText("SYSTEM DESIGN / RESEARCH WALL", 54, 88);
  ctx.strokeStyle = "#c9cec7";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(700, 116);
  ctx.lineTo(700, 610);
  ctx.stroke();

  ctx.fillStyle = "#e9eee8";
  ctx.fillRect(45, 120, 610, 450);
  ctx.fillStyle = "#24332e";
  ctx.font = "700 23px Arial";
  ctx.fillText("MULTIMODAL LOGISTICS", 72, 163);
  const logisticsNodes = [
    [115, 270, "PORT", "#387f8f"],
    [282, 215, "RAIL", "#c07f42"],
    [350, 390, "HUB", "#5e8d67"],
    [520, 250, "CITY", "#7b6aa8"],
    [555, 455, "DC", "#c45f5f"],
  ];
  ctx.lineWidth = 7;
  for (const [a, b] of [[0, 1], [0, 2], [1, 3], [1, 2], [2, 3], [2, 4], [3, 4]]) {
    ctx.strokeStyle = a % 2 ? "#d39b58" : "#6c9c91";
    ctx.beginPath();
    ctx.moveTo(logisticsNodes[a][0], logisticsNodes[a][1]);
    ctx.lineTo(logisticsNodes[b][0], logisticsNodes[b][1]);
    ctx.stroke();
  }
  for (const [x, y, label, color] of logisticsNodes) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + 5);
  }

  ctx.fillStyle = "#17252d";
  ctx.fillRect(745, 120, 610, 450);
  ctx.fillStyle = "#ecf2ef";
  ctx.font = "700 23px Arial";
  ctx.textAlign = "left";
  ctx.fillText("SATELLITE NETWORK", 772, 163);
  ctx.strokeStyle = "rgba(122,194,205,.55)";
  ctx.lineWidth = 3;
  for (const radius of [130, 190, 250]) {
    ctx.beginPath();
    ctx.ellipse(1050, 410, radius, radius * 0.42, -0.18, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#2d8496";
  ctx.beginPath();
  ctx.arc(1050, 520, 108, Math.PI, Math.PI * 2);
  ctx.lineTo(1158, 520);
  ctx.closePath();
  ctx.fill();
  const satellites = [[835, 315], [965, 270], [1110, 260], [1260, 330], [925, 390], [1185, 395]];
  ctx.strokeStyle = "rgba(229,234,223,.35)";
  ctx.lineWidth = 2;
  satellites.forEach(([x, y], index) => {
    const next = satellites[(index + 1) % satellites.length];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(next[0], next[1]);
    ctx.stroke();
    ctx.fillStyle = "#e1b45f";
    ctx.fillRect(x - 12, y - 7, 24, 14);
    ctx.fillStyle = "#76aabd";
    ctx.fillRect(x - 27, y - 4, 12, 8);
    ctx.fillRect(x + 15, y - 4, 12, 8);
  });
  ctx.textAlign = "left";
  ctx.fillStyle = "#f4d57d";
  ctx.fillRect(80, 592, 170, 36);
  ctx.fillStyle = "#20302a";
  ctx.font = "700 14px Arial";
  ctx.fillText("FLOW OPTIMIZATION", 94, 616);
  ctx.fillStyle = "#b8d7dd";
  ctx.fillRect(275, 592, 154, 36);
  ctx.fillStyle = "#20302a";
  ctx.fillText("ORBIT ROUTING", 290, 616);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function playNote(frequency) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const audio = new AudioContextClass();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.15, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.9);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.92);
  oscillator.addEventListener("ended", () => audio.close());
}

function buildRoom(scene) {
  const floorMap = woodTexture("#8d6d55", "#4d3527");
  floorMap.repeat.set(3.2, 7.2);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.floor,
    map: floorMap,
    roughness: 0.78,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(19, 13), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -0.8);
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.wall,
    roughness: 0.95,
  });
  addBox(scene, [19, 2.25, 0.28], [0, 1.12, -7.1], wallMaterial, false);
  addBox(scene, [0.28, 8.2, 13], [9.35, 4.1, -0.8], wallMaterial, false);

  const outside = new THREE.MeshBasicMaterial({ map: outdoorTexture() });
  const frame = new THREE.MeshStandardMaterial({
    color: 0x111615,
    metalness: 0.5,
    roughness: 0.32,
  });
  addBox(scene, [14.7, 4.7, 0.06], [-1.4, 4.62, -7.02], outside, false);
  addBox(scene, [15.2, 0.16, 0.2], [-1.4, 2.3, -6.94], frame, false);
  addBox(scene, [15.2, 0.16, 0.2], [-1.4, 6.95, -6.94], frame, false);
  for (const x of [-8.9, -6.1, -3.3, -0.5, 2.3, 5.1]) {
    addBox(scene, [0.15, 4.8, 0.2], [x, 4.62, -6.94], frame, false);
  }
  addBox(scene, [15.2, 0.13, 0.2], [-1.4, 5.82, -6.94], frame, false);

  const acoustic = new THREE.MeshStandardMaterial({
    color: 0xd8d1c4,
    roughness: 0.92,
  });
  for (let i = 0; i < 9; i += 1) {
    addBox(scene, [0.42, 0.42, 10.2], [-5.2 + i * 1.25, 7.72, -1.3], acoustic, false);
  }

  addBox(scene, [15.5, 0.1, 0.1], [-0.2, 7.15, -2.6], frame, false);
  for (const x of [-6.7, -2.7, 1.3, 5.3]) {
    const lamp = addCylinder(scene, 0.18, 0.5, [x, 6.83, -2.55], frame, 20);
    lamp.rotation.z = Math.PI / 2;
  }

  addContactShadow(scene, [-4.25, 0, -5.05], [5.8, 2.2], 0.3);
  addContactShadow(scene, [6.0, 0, -2.8], [5.0, 4.6], 0.2);
  addContactShadow(scene, [8.5, 0, 2.45], [2.8, 4.8], 0.25);
}

function buildUprightPiano(scene, interactive) {
  const piano = new THREE.Group();
  piano.position.set(-4.25, 0, -5.45);
  piano.scale.set(0.94, 0.84, 0.94);
  scene.add(piano);

  const lacquer = new THREE.MeshPhysicalMaterial({
    color: PALETTE.piano,
    metalness: 0.15,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const edge = new THREE.MeshStandardMaterial({
    color: PALETTE.pianoEdge,
    metalness: 0.22,
    roughness: 0.22,
  });
  const ivory = new THREE.MeshStandardMaterial({
    color: PALETTE.ivory,
    roughness: 0.34,
  });
  const ebony = new THREE.MeshStandardMaterial({ color: 0x070807, roughness: 0.2 });
  const brass = new THREE.MeshStandardMaterial({
    color: PALETTE.brass,
    metalness: 0.78,
    roughness: 0.25,
  });

  addRoundedBox(piano, [4.45, 2.18, 0.72], [0, 3.58, 0], lacquer, 0.08);
  addRoundedBox(piano, [4.75, 0.24, 0.9], [0, 4.72, 0], edge, 0.07);
  addRoundedBox(piano, [4.7, 0.48, 1.12], [0, 2.18, 0.42], lacquer, 0.07);
  addBox(piano, [4.55, 0.2, 0.98], [0, 2.62, 0.44], lacquer);
  addBox(piano, [4.2, 0.1, 0.12], [0, 3.03, 0.43], brass, false);

  const notes = Array.from({ length: 24 }, (_, i) => 220 * Math.pow(2, i / 12));
  for (let i = 0; i < 24; i += 1) {
    const key = addBox(piano, [0.177, 0.09, 0.74], [-2.04 + i * 0.178, 2.42, 0.94], ivory, false);
    key.userData = { action: "piano", frequency: notes[i] };
    interactive.push(key);
  }
  const blackSlots = [0, 1, 3, 4, 5, 7, 8, 10, 12, 13, 15, 16, 17, 19, 20, 22];
  blackSlots.forEach((slot) => {
    const key = addBox(piano, [0.11, 0.16, 0.48], [-1.95 + slot * 0.178, 2.54, 0.76], ebony, false);
    key.userData = {
      action: "piano",
      frequency: notes[Math.min(slot, notes.length - 1)] * 1.0595,
    };
    interactive.push(key);
  });

  addRoundedBox(piano, [4.28, 2.22, 0.64], [0, 1.11, 0.02], lacquer, 0.075);
  const soundboard = addRoundedBox(piano, [3.88, 1.62, 0.07], [0, 1.18, 0.37], edge, 0.04);
  soundboard.receiveShadow = true;
  for (let y = 0; y < 5; y += 1) {
    addBox(piano, [3.46, 0.018, 0.026], [0, 0.72 + y * 0.23, 0.42], brass, false);
  }
  addBox(piano, [4.5, 0.2, 0.92], [0, 0.12, 0.24], lacquer);
  addBox(piano, [1.25, 0.22, 0.5], [0, 0.46, 0.48], lacquer);

  for (const x of [-0.34, 0, 0.34]) {
    const pedal = addBox(piano, [0.22, 0.08, 0.55], [x, 0.35, 0.78], brass, false);
    pedal.rotation.x = 0.16;
  }

  const bench = new THREE.Group();
  bench.position.set(0, 0, 2.65);
  piano.add(bench);
  addRoundedBox(bench, [2.35, 0.34, 1.05], [0, 1.28, 0], lacquer, 0.13);
  for (const x of [-0.94, 0.94]) {
    for (const z of [-0.35, 0.35]) {
      addBox(bench, [0.13, 1.2, 0.13], [x, 0.64, z], edge);
    }
  }
  const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0x323332, roughness: 0.28 });
  for (const x of [-0.7, -0.23, 0.23, 0.7]) {
    for (const z of [-0.26, 0.26]) {
      const button = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), buttonMaterial);
      button.scale.y = 0.35;
      button.position.set(x, 1.46, z);
      bench.add(button);
    }
  }
}

function buildDesk(scene, interactive) {
  const desk = new THREE.Group();
  desk.position.set(5.5, 0, -5.3);
  scene.add(desk);

  const deskMap = woodTexture("#e9e1d4", "#b9a892");
  deskMap.repeat.set(2.8, 1.25);
  const topMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.desk,
    map: deskMap,
    roughness: 0.54,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: PALETTE.metal,
    metalness: 0.66,
    roughness: 0.3,
  });
  const silver = new THREE.MeshStandardMaterial({
    color: 0xb9bdba,
    metalness: 0.7,
    roughness: 0.3,
  });
  const deskShape = new THREE.Shape();
  deskShape.moveTo(-3.5, 1.6);
  deskShape.lineTo(3.5, 1.6);
  deskShape.lineTo(3.5, -5.4);
  deskShape.lineTo(1.9, -5.4);
  deskShape.lineTo(1.9, -1.4);
  deskShape.quadraticCurveTo(1.55, -0.35, 0.5, 0);
  deskShape.lineTo(-3.5, 0);
  deskShape.closePath();
  const deskGeometry = new THREE.ExtrudeGeometry(deskShape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelSize: 0.08,
    bevelThickness: 0.05,
    bevelSegments: 3,
    curveSegments: 20,
  });
  deskGeometry.rotateX(-Math.PI / 2);
  const desktop = new THREE.Mesh(deskGeometry, topMaterial);
  desktop.position.y = 2.2;
  desktop.castShadow = true;
  desktop.receiveShadow = true;
  desk.add(desktop);

  for (const [x, z] of [
    [-3.12, -1.22],
    [-3.12, -0.26],
    [1.5, -1.22],
    [3.12, -1.22],
    [2.25, 4.96],
    [3.12, 4.96],
  ]) {
    addBox(desk, [0.18, 2.12, 0.18], [x, 1.06, z], metal);
  }
  addBox(desk, [6.35, 0.12, 0.12], [0, 1.92, -1.2], metal);
  addBox(desk, [0.12, 0.12, 6.35], [3.12, 1.92, 1.86], metal);

  const screenMaterials = [];
  const monitorRig = new THREE.Group();
  monitorRig.position.set(1.7, 0, 0.12);
  monitorRig.rotation.y = -Math.PI / 4;
  desk.add(monitorRig);
  const monitor = new THREE.Group();
  monitor.position.set(0, 4.0, 0);
  monitorRig.add(monitor);
  const curvedPlane = (width, height, depth) => {
    const geometry = new THREE.PlaneGeometry(width, height, 64, 1);
    const positions = geometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const normalized = x / (width * 0.5);
      positions.setZ(index, depth * (1 - Math.cos(normalized * Math.PI * 0.5)));
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  };
  const monitorBack = new THREE.Mesh(curvedPlane(4.85, 1.96, 0.42), metal);
  monitorBack.castShadow = true;
  monitor.add(monitorBack);
  const screenMaterial = new THREE.MeshBasicMaterial({
    map: landscapeTexture(0),
    toneMapped: false,
  });
  screenMaterials.push(screenMaterial);
  const screen = new THREE.Mesh(curvedPlane(4.66, 1.78, 0.38), screenMaterial);
  screen.position.z = 0.035;
  screen.userData = { action: "monitor", mode: 0, screenMaterials };
  monitor.add(screen);
  interactive.push(screen);
  const glass = new THREE.Mesh(
    curvedPlane(4.66, 1.78, 0.38),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.055,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      depthWrite: false,
    }),
  );
  glass.position.z = 0.052;
  monitor.add(glass);
  addCylinder(monitorRig, 0.22, 0.82, [0, 2.72, -0.04], metal, 24);
  addBox(monitorRig, [1.08, 0.16, 0.28], [0, 3.08, -0.02], metal);
  addCylinder(monitorRig, 0.3, 0.16, [0, 2.36, 0.07], metal, 24);
  const addStandFoot = (endX, endZ) => {
    const length = Math.hypot(endX, endZ);
    const foot = addBox(monitorRig, [length, 0.09, 0.15], [endX * 0.5, 2.35, 0.1 + endZ * 0.5], metal);
    foot.rotation.y = -Math.atan2(endZ, endX);
  };
  addStandFoot(-1.52, 0.62);
  addStandFoot(1.52, 0.62);
  addStandFoot(-0.92, -0.48);
  addStandFoot(0.92, -0.48);

  const portrait = new THREE.Group();
  portrait.position.set(3.12, 3.76, 2.45);
  portrait.rotation.y = -Math.PI / 2;
  desk.add(portrait);
  addBox(portrait, [1.55, 2.65, 0.12], [0, 0, 0], metal);
  const portraitMat = new THREE.MeshBasicMaterial({ map: landscapeTexture(0), toneMapped: false });
  screenMaterials.push(portraitMat);
  const portraitScreen = addBox(portrait, [1.42, 2.5, 0.018], [0, 0, 0.07], portraitMat, false);
  portraitScreen.userData = { action: "monitor", mode: 0, screenMaterials };
  interactive.push(portraitScreen);
  addBox(desk, [0.14, 1.15, 0.14], [3.12, 2.92, 2.32], metal);
  const portraitBase = addBox(desk, [1.2, 0.08, 0.62], [3.12, 2.34, 2.45], metal);
  portraitBase.rotation.y = -Math.PI / 2;

  const laptop = new THREE.Group();
  laptop.position.set(-1.55, 2.46, -0.52);
  laptop.rotation.y = 0.12;
  desk.add(laptop);
  addBox(laptop, [1.82, 0.08, 1.04], [0, 0, 0], silver);
  const lid = new THREE.Group();
  lid.position.set(0, 0.05, -0.46);
  lid.rotation.x = -0.12;
  laptop.add(lid);
  addBox(lid, [1.82, 1.18, 0.07], [0, 0.57, 0], silver);
  const laptopScreenMat = new THREE.MeshBasicMaterial({ map: landscapeTexture(0), toneMapped: false });
  addBox(lid, [1.67, 1.02, 0.016], [0, 0.57, 0.045], laptopScreenMat, false);
  addBox(desk, [2.0, 0.12, 0.75], [-1.55, 2.28, -0.55], silver);

  addBox(desk, [3.6, 0.12, 0.34], [0.85, 1.85, -1.06], metal, false);
  const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x171a19, roughness: 0.82 });
  addCable(desk, [[1.7, 2.45, -0.02], [1.74, 2.05, -0.5], [1.35, 1.82, -1.03]], cableMaterial);
  addCable(desk, [[3.1, 2.45, 2.35], [2.9, 2.0, 1.7], [2.7, 1.83, -0.9]], cableMaterial, 0.014);
  addCable(desk, [[-1.15, 2.34, -0.84], [-0.65, 2.06, -1.0], [0.4, 1.83, -1.03]], cableMaterial, 0.014);

  const keyboard = new THREE.Group();
  keyboard.position.set(1.06, 2.43, 0.18);
  keyboard.rotation.y = -0.54;
  desk.add(keyboard);
  addRoundedBox(keyboard, [2.72, 0.09, 0.82], [0, 0, 0], metal, 0.06, false);
  const keyMaterial = new THREE.MeshStandardMaterial({ color: 0x303534, roughness: 0.48 });
  for (let row = 0; row < 4; row += 1) {
    const count = 14;
    for (let col = 0; col < count; col += 1) {
      const key = addBox(
        keyboard,
        [0.145, 0.035, 0.105],
        [(col - (count - 1) / 2) * 0.176, 0.065, -0.27 + row * 0.135],
        keyMaterial,
        false,
      );
      key.rotation.x = -0.025;
    }
  }
  for (const x of [-1.13, -0.93, -0.73, 0.73, 0.93, 1.13]) {
    addBox(keyboard, [0.145, 0.035, 0.105], [x, 0.065, 0.27], keyMaterial, false);
  }
  addBox(keyboard, [1.18, 0.035, 0.105], [0, 0.065, 0.27], keyMaterial, false);

  const mouse = new THREE.Group();
  mouse.position.set(2.48, 2.5, 0.78);
  mouse.rotation.y = -0.72;
  desk.add(mouse);
  addSphere(mouse, 0.5, [0, 0, 0], metal, [0.68, 0.23, 0.92]);
  addSphere(mouse, 0.34, [-0.19, -0.035, 0.08], metal, [0.78, 0.14, 0.84]);
  const wheel = addCylinder(mouse, 0.055, 0.13, [0, 0.12, -0.19], keyMaterial, 18);
  wheel.rotation.z = Math.PI / 2;
  addBox(mouse, [0.015, 0.035, 0.34], [0, 0.105, -0.02], keyMaterial, false);
}

function buildErgonomicChair(scene) {
  const chair = new THREE.Group();
  chair.position.set(6.15, 0, -3.28);
  chair.rotation.y = -0.72;
  scene.add(chair);

  const fabric = new THREE.MeshStandardMaterial({ color: 0x111413, roughness: 0.78 });
  const shell = new THREE.MeshPhysicalMaterial({
    color: 0x080a09,
    roughness: 0.3,
    clearcoat: 0.55,
    clearcoatRoughness: 0.28,
  });
  const frame = new THREE.MeshStandardMaterial({ color: 0x252a28, metalness: 0.72, roughness: 0.3 });

  addRoundedBox(chair, [1.7, 0.24, 1.45], [0, 1.52, 0], fabric, 0.11);
  addSphere(chair, 0.88, [0, 1.65, -0.02], fabric, [1, 0.22, 0.86]);
  addBox(chair, [0.18, 1.52, 0.16], [0, 2.26, 0.56], frame);

  const backShape = new THREE.Shape();
  backShape.moveTo(-0.62, -0.92);
  backShape.quadraticCurveTo(-0.88, 0.05, -0.66, 0.92);
  backShape.quadraticCurveTo(0, 1.12, 0.66, 0.92);
  backShape.quadraticCurveTo(0.88, 0.05, 0.62, -0.92);
  backShape.quadraticCurveTo(0, -0.7, -0.62, -0.92);
  const backGeometry = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.04,
    bevelSegments: 3,
    curveSegments: 16,
  });
  const back = new THREE.Mesh(backGeometry, fabric);
  back.position.set(0, 2.88, 0.52);
  back.rotation.x = -0.08;
  back.castShadow = true;
  chair.add(back);
  addBox(chair, [0.64, 0.1, 0.18], [0, 2.45, 0.37], shell);
  addRoundedBox(chair, [0.92, 0.24, 0.22], [0, 4.02, 0.55], fabric, 0.09);
  addBox(chair, [0.16, 0.55, 0.16], [0, 3.72, 0.55], frame);

  for (const x of [-0.94, 0.94]) {
    addBox(chair, [0.12, 0.76, 0.12], [x, 1.96, 0.05], frame);
    addRoundedBox(chair, [0.55, 0.12, 0.18], [x * 0.9, 2.31, -0.06], shell, 0.05);
  }
  addCylinder(chair, 0.16, 0.95, [0, 0.93, 0.02], frame, 20);
  addCylinder(chair, 0.31, 0.16, [0, 0.47, 0.02], shell, 20);
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const spoke = addBox(chair, [0.12, 0.1, 1.34], [0, 0.39, 0.02], frame);
    spoke.rotation.y = angle;
    addCylinder(
      chair,
      0.12,
      0.12,
      [Math.sin(angle) * 0.64, 0.22, Math.cos(angle) * 0.64 + 0.02],
      shell,
      16,
    ).rotation.z = Math.PI / 2;
  }
}

function buildFootballField(scene) {
  const field = new THREE.Group();
  field.position.set(5.15, 0.035, 1.5);
  field.scale.setScalar(0.001);
  field.visible = false;
  field.userData.targetScale = 0;
  scene.add(field);

  const turf = new THREE.MeshPhysicalMaterial({
    color: 0x3d8a55,
    roughness: 0.72,
    transparent: true,
    opacity: 0.9,
    clearcoat: 0.15,
  });
  const line = new THREE.MeshBasicMaterial({ color: 0xf5f2df, toneMapped: false });
  const goal = new THREE.MeshStandardMaterial({ color: 0xe6e8e3, metalness: 0.35, roughness: 0.3 });
  addBox(field, [5.8, 0.08, 3.35], [0, 0, 0], turf, false);
  addBox(field, [5.6, 0.025, 0.045], [0, 0.06, -1.55], line, false);
  addBox(field, [5.6, 0.025, 0.045], [0, 0.06, 1.55], line, false);
  addBox(field, [0.045, 0.025, 3.14], [-2.72, 0.06, 0], line, false);
  addBox(field, [0.045, 0.025, 3.14], [2.72, 0.06, 0], line, false);
  addBox(field, [0.04, 0.025, 3.14], [0, 0.06, 0], line, false);
  const circle = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.026, 8, 40), line);
  circle.rotation.x = Math.PI / 2;
  circle.position.y = 0.075;
  field.add(circle);
  addCylinder(field, 0.045, 0.03, [0, 0.075, 0], line, 16);

  for (const side of [-1, 1]) {
    const x = side * 2.72;
    addBox(field, [0.72, 0.025, 1.6], [x - side * 0.36, 0.065, 0], line, false);
    addBox(field, [0.63, 0.03, 1.46], [x - side * 0.34, 0.086, 0], turf, false);
    addBox(field, [0.05, 0.58, 0.05], [x + side * 0.18, 0.31, -0.55], goal);
    addBox(field, [0.05, 0.58, 0.05], [x + side * 0.18, 0.31, 0.55], goal);
    addBox(field, [0.05, 0.05, 1.15], [x + side * 0.18, 0.58, 0], goal);
  }
  return field;
}

function buildProjectBoard(scene) {
  const white = new THREE.MeshStandardMaterial({ color: 0xf3f2e9, roughness: 0.72 });
  const frame = new THREE.MeshStandardMaterial({ color: 0x555b58, metalness: 0.65, roughness: 0.28 });
  addBox(scene, [0.07, 1.9, 4.0], [9.15, 6.15, 2.05], white, false);
  addBox(scene, [0.11, 0.09, 4.08], [9.1, 7.12, 2.05], frame, false);
  addBox(scene, [0.11, 0.09, 4.08], [9.1, 5.18, 2.05], frame, false);
  addBox(scene, [0.11, 2.02, 0.09], [9.1, 6.15, 0], frame, false);
  addBox(scene, [0.11, 2.02, 0.09], [9.1, 6.15, 4.1], frame, false);

  const content = new THREE.Mesh(
    new THREE.PlaneGeometry(3.86, 1.76),
    new THREE.MeshBasicMaterial({ map: projectBoardTexture(), toneMapped: false }),
  );
  content.rotation.y = -Math.PI / 2;
  content.position.set(9.105, 6.15, 2.05);
  scene.add(content);
  const tackColors = [0xd75f51, 0xe2b252, 0x4e8fa1, 0x63866a];
  const tackPositions = [[5.68, 0.28], [6.62, 0.28], [5.68, 3.82], [6.62, 3.82]];
  tackPositions.forEach(([y, z], index) => {
    addSphere(
      scene,
      0.052,
      [9.04, y, z],
      new THREE.MeshStandardMaterial({ color: tackColors[index], roughness: 0.42 }),
      [0.5, 1, 1],
    );
  });
}

function buildSensorRover(scene) {
  const rover = new THREE.Group();
  rover.position.set(7.75, 0, 4.45);
  rover.rotation.y = -0.18;
  scene.add(rover);

  const body = new THREE.MeshPhysicalMaterial({
    color: 0xd3d7d3,
    metalness: 0.35,
    roughness: 0.3,
    clearcoat: 0.55,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x171b1a, metalness: 0.65, roughness: 0.3 });
  const sensor = new THREE.MeshStandardMaterial({ color: 0x263f46, metalness: 0.55, roughness: 0.18 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x72d7c4, toneMapped: false });

  addRoundedBox(rover, [1.3, 0.38, 1.72], [0, 0.5, 0], dark, 0.12);
  addRoundedBox(rover, [1.12, 0.22, 1.44], [0, 0.78, -0.02], body, 0.1);
  addRoundedBox(rover, [0.82, 0.2, 0.72], [0, 0.99, -0.2], dark, 0.08);
  for (const x of [-0.7, 0.7]) {
    for (const z of [-0.58, 0.58]) {
      const wheel = addCylinder(rover, 0.25, 0.2, [x, 0.35, z], dark, 20);
      wheel.rotation.z = Math.PI / 2;
      addCylinder(rover, 0.1, 0.215, [x, 0.35, z], body, 16).rotation.z = Math.PI / 2;
      const tread = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.026, 8, 24), dark);
      tread.position.set(x, 0.35, z);
      tread.rotation.y = Math.PI / 2;
      rover.add(tread);
    }
  }

  addCylinder(rover, 0.09, 0.72, [0, 1.37, -0.05], dark, 18);
  const lidar = new THREE.Group();
  lidar.position.set(0, 1.78, -0.05);
  rover.add(lidar);
  addCylinder(lidar, 0.23, 0.12, [0, 0, 0], sensor, 28);
  addCylinder(lidar, 0.18, 0.1, [0, 0.11, 0], glow, 28);
  addCylinder(lidar, 0.23, 0.08, [0, 0.2, 0], dark, 28);

  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.18, 28, 1, true), body);
  dish.position.set(-0.36, 1.52, 0.1);
  dish.rotation.z = -Math.PI / 2;
  dish.castShadow = true;
  rover.add(dish);
  addSphere(rover, 0.08, [-0.2, 1.52, 0.1], glow);

  addRoundedBox(rover, [0.46, 0.28, 0.22], [0.35, 1.31, -0.42], sensor, 0.06);
  for (const x of [0.22, 0.38, 0.54]) {
    addSphere(rover, 0.055, [x, 1.34, -0.545], glow);
  }
  for (const x of [-0.45, 0.45]) {
    const antenna = addCylinder(rover, 0.022, 0.78, [x, 1.45, 0.42], dark, 10);
    antenna.rotation.z = x * 0.12;
  }
  return lidar;
}

function buildHumanoidRobot(scene, interactive) {
  const field = buildFootballField(scene);
  const robot = new THREE.Group();
  robot.position.set(8.82, 0, 1.8);
  robot.rotation.y = -Math.PI / 2;
  robot.scale.setScalar(0.9);
  scene.add(robot);

  const shell = new THREE.MeshPhysicalMaterial({
    color: 0xc8cdca,
    metalness: 0.38,
    roughness: 0.26,
    clearcoat: 0.62,
    clearcoatRoughness: 0.2,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x151918, metalness: 0.55, roughness: 0.28 });
  const joint = new THREE.MeshStandardMaterial({ color: 0x2b302e, metalness: 0.76, roughness: 0.22 });
  const visor = new THREE.MeshPhysicalMaterial({ color: 0x071217, metalness: 0.58, roughness: 0.1, clearcoat: 1 });
  const accent = new THREE.MeshBasicMaterial({ color: 0x78d6c3, toneMapped: false });

  addRoundedBox(robot, [1.24, 1.28, 0.62], [0, 3.28, 0], shell, 0.18);
  addRoundedBox(robot, [0.92, 0.72, 0.52], [0, 2.35, 0.02], dark, 0.14);
  addBox(robot, [0.72, 0.16, 0.54], [0, 3.66, 0.34], dark);
  addBox(robot, [0.42, 0.1, 0.025], [0, 3.66, 0.626], accent, false);

  addCylinder(robot, 0.22, 0.25, [0, 4.02, 0], joint, 20);
  addRoundedBox(robot, [0.78, 0.68, 0.58], [0, 4.4, 0], shell, 0.16);
  addRoundedBox(robot, [0.66, 0.3, 0.04], [0, 4.43, 0.31], visor, 0.035, false);
  addBox(robot, [0.28, 0.025, 0.025], [0, 4.43, 0.337], accent, false);

  addSphere(robot, 0.25, [-0.76, 3.62, 0], joint);
  const leftUpperArm = addCylinder(robot, 0.2, 0.9, [-0.86, 3.09, 0.02], shell, 18);
  leftUpperArm.rotation.z = -0.12;
  addSphere(robot, 0.2, [-0.92, 2.58, 0.02], joint);
  const leftForearm = addCylinder(robot, 0.17, 0.78, [-0.94, 2.12, -0.01], shell, 18);
  leftForearm.rotation.z = 0.06;
  addRoundedBox(robot, [0.3, 0.32, 0.2], [-0.96, 1.68, -0.01], dark, 0.07);

  addSphere(robot, 0.25, [0.76, 3.62, 0], joint);
  const rightUpperArm = addCylinder(robot, 0.2, 0.78, [0.88, 3.22, 0.06], shell, 18);
  rightUpperArm.rotation.z = -0.28;
  addSphere(robot, 0.2, [0.98, 2.82, 0.12], joint);
  const rightForearm = addCylinder(robot, 0.17, 0.72, [0.68, 2.91, 0.37], shell, 18);
  rightForearm.rotation.z = Math.PI / 2.45;
  addRoundedBox(robot, [0.3, 0.3, 0.22], [0.37, 3.02, 0.54], dark, 0.07);

  const ballWhite = new THREE.MeshStandardMaterial({ color: 0xf0eee6, roughness: 0.64 });
  const ballBlack = new THREE.MeshStandardMaterial({ color: 0x101312, roughness: 0.58 });
  addSphere(robot, 0.43, [0.12, 2.75, 0.48], ballWhite);
  for (const [x, y, z] of [
    [0.12, 3.14, 0.54],
    [-0.2, 2.79, 0.72],
    [0.42, 2.72, 0.7],
    [0.1, 2.46, 0.73],
  ]) {
    addSphere(robot, 0.12, [x, y, z], ballBlack, [1, 0.42, 1]);
  }

  for (const side of [-1, 1]) {
    addSphere(robot, 0.27, [side * 0.38, 2.08, 0], joint);
    const thigh = addCylinder(robot, 0.24, 0.92, [side * 0.39, 1.51, 0], shell, 20);
    thigh.rotation.z = -side * 0.035;
    addSphere(robot, 0.22, [side * 0.42, 0.97, 0.02], joint);
    const calf = addCylinder(robot, 0.2, 0.76, [side * 0.43, 0.5, 0], shell, 20);
    calf.rotation.z = side * 0.025;
    addRoundedBox(robot, [0.48, 0.2, 0.72], [side * 0.43, 0.13, 0.12], dark, 0.08);
    const kneeRing = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.035, 8, 24), accent);
    kneeRing.position.set(side * 0.42, 0.97, 0.235);
    robot.add(kneeRing);
  }

  robot.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.userData = { action: "robot", field };
    interactive.push(object);
  });
  return field;
}

function mountStudioRoom(mount, ui) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9f9c95);
  scene.fog = new THREE.Fog(0x9f9c95, 20, 42);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(15.1, 8.5, 12.4);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  mount.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(4.35, 2.45, -2.0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 10;
  controls.maxDistance = 27;
  controls.minPolarAngle = Math.PI * 0.15;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.18;

  buildRoom(scene);
  const interactive = [];
  buildUprightPiano(scene, interactive);
  buildDesk(scene, interactive);
  buildErgonomicChair(scene);
  buildProjectBoard(scene);
  const roverLidar = buildSensorRover(scene);
  const footballField = buildHumanoidRobot(scene, interactive);

  scene.add(new THREE.HemisphereLight(0xe4efe5, 0x4f453d, 2.35));
  const windowLight = new THREE.DirectionalLight(0xe7f0d7, 4.8);
  windowLight.position.set(-8, 11, 5);
  windowLight.castShadow = true;
  windowLight.shadow.mapSize.set(2048, 2048);
  windowLight.shadow.camera.left = -12;
  windowLight.shadow.camera.right = 12;
  windowLight.shadow.camera.top = 12;
  windowLight.shadow.camera.bottom = -12;
  windowLight.shadow.bias = -0.0006;
  windowLight.shadow.normalBias = 0.035;
  scene.add(windowLight);
  const warmLight = new THREE.PointLight(0xffc878, 32, 14, 2);
  warmLight.position.set(3.4, 6.5, 2.2);
  scene.add(warmLight);
  const deskSpot = new THREE.SpotLight(0xffe0aa, 38, 12, 0.6, 0.75, 1.8);
  deskSpot.position.set(5.6, 7.0, -1.7);
  deskSpot.target.position.set(5.6, 0, -2.4);
  scene.add(deskSpot, deskSpot.target);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const hitAt = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(interactive, false)[0]?.object ?? null;
  };
  const onMove = (event) => {
    const hovered = hitAt(event);
    renderer.domElement.style.cursor = hovered ? "pointer" : "grab";
    ui.setStatus(
      hovered?.userData.action === "piano"
        ? "点击琴键试听"
        : hovered?.userData.action === "monitor"
          ? "点击屏幕切换昼夜"
          : hovered?.userData.action === "robot"
            ? "点击机器人展开足球队项目"
            : IDLE_HINT,
    );
  };
  const onDown = () => {
    controls.autoRotate = false;
    renderer.domElement.style.cursor = "grabbing";
  };
  const onUp = (event) => {
    const hit = hitAt(event);
    renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    if (!hit) return;
    if (hit.userData.action === "piano") {
      playNote(hit.userData.frequency);
      const y = hit.position.y;
      hit.position.y -= 0.05;
      window.setTimeout(() => (hit.position.y = y), 130);
    }
    if (hit.userData.action === "monitor") {
      const mode = hit.userData.mode === 0 ? 1 : 0;
      hit.userData.mode = mode;
      const materials = hit.userData.screenMaterials;
      materials.forEach((material, index) => {
        material.map?.dispose();
        const texture = landscapeTexture(mode);
        if (materials.length > 2 && index < 3) {
          texture.repeat.set(1 / 3, 1);
          texture.offset.set(index / 3, 0);
        }
        material.map = texture;
        material.needsUpdate = true;
      });
      ui.setStatus(mode ? "夜间练琴模式" : "日间工作模式");
    }
    if (hit.userData.action === "robot") {
      const field = hit.userData.field;
      const open = field.userData.targetScale !== 1;
      field.userData.targetScale = open ? 1 : 0;
      if (open) field.visible = true;
      ui.setProjectOpen(open);
      ui.setStatus(open ? "机器人足球队 · 项目已展开" : "机器人足球队 · 项目已收起");
    }
  };
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);

  const resize = () => {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(mount);
  resize();

  let frame = 0;
  const render = () => {
    frame = window.requestAnimationFrame(render);
    const target = footballField.userData.targetScale;
    const next = THREE.MathUtils.lerp(footballField.scale.x, target, 0.09);
    footballField.scale.setScalar(Math.max(0.001, next));
    footballField.rotation.y += target === 1 ? 0.0008 : 0;
    if (target === 0 && next < 0.008) footballField.visible = false;
    roverLidar.rotation.y += 0.012;
    controls.update();
    renderer.render(scene, camera);
  };
  render();

  return () => {
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    renderer.domElement.removeEventListener("pointermove", onMove);
    renderer.domElement.removeEventListener("pointerdown", onDown);
    renderer.domElement.removeEventListener("pointerup", onUp);
    controls.dispose();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if ("map" in material && material.map instanceof THREE.Texture) material.map.dispose();
          material.dispose();
        });
      }
    });
    renderer.dispose();
    mount.removeChild(renderer.domElement);
  };
}

/* ---------- page wiring ---------- */

const mount = document.getElementById("scene-mount");
const statusEl = document.getElementById("interaction-status");
const projectCard = document.getElementById("project-card");
const fallback = document.getElementById("scene-fallback");

const ui = {
  setStatus(text) {
    if (statusEl.textContent !== text) statusEl.textContent = text;
  },
  setProjectOpen(open) {
    projectCard.classList.toggle("is-visible", open);
    projectCard.setAttribute("aria-hidden", String(!open));
  },
};

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

if (!webglAvailable()) {
  fallback.hidden = false;
  ui.setStatus("当前浏览器未启用 WebGL");
} else {
  try {
    mountStudioRoom(mount, ui);
    ui.setStatus(IDLE_HINT);
  } catch (error) {
    console.error(error);
    fallback.hidden = false;
    ui.setStatus("场景加载失败");
  }
}

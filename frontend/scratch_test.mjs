import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const filePath = path.resolve('../backend/uploads/scans/foot_scan_1785416298472-364457856.obj');
const objData = fs.readFileSync(filePath, 'utf8');

const loader = new OBJLoader();
const obj = loader.parse(objData);

// 1. ROTACIONAR -90º NO EIXO X PARA COLOCAR A PLANTA DO PÉ VIRADA PARA BAIXO
obj.rotateX(-Math.PI / 2);
obj.updateMatrixWorld(true);

let box = new THREE.Box3().setFromObject(obj);
let size = new THREE.Vector3();
box.getSize(size);

const scaleFactor = 260.0 / size.z;
obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
obj.updateMatrixWorld(true);

box.setFromObject(obj);
let center = new THREE.Vector3();
box.getCenter(center);

obj.position.x = -center.x;
obj.position.z = -center.z;
// Apoiar a sola (min.y) na superfície da palmilha (5.0mm)
obj.position.y = -box.min.y + 5.0;
obj.updateMatrixWorld(true);

box.setFromObject(obj);

// Recalcular normais
obj.traverse((child) => {
  if (child.isMesh && child.geometry) {
    child.geometry.computeVertexNormals();
  }
});

console.log('=== TEST WITH rotateX(-Math.PI / 2) ===');
console.log('Sole Y (Bottom of foot sole resting on insole):', box.min.y.toFixed(1), 'mm');
console.log('Ankle Y (Top of leg pointing UP into sky):    ', box.max.y.toFixed(1), 'mm');
console.log('Toes Z (Pointing to the RIGHT):                ', box.max.z.toFixed(1), 'mm');
console.log('Heel Z (Pointing to the LEFT):                 ', box.min.z.toFixed(1), 'mm');

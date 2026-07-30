const fs = require('fs');
const path = require('path');
const THREE = require('three');
const { OBJLoader } = require('three/examples/jsm/loaders/OBJLoader.js');

const filePath = path.join(__dirname, 'uploads', 'scans', 'foot_scan_1785415997448-360398896.obj');
const objData = fs.readFileSync(filePath, 'utf8');

const loader = new OBJLoader();
const obj = loader.parse(objData);

console.log('--- OBJ PARSED ---');
console.log('Children count:', obj.children.length);

let box = new THREE.Box3().setFromObject(obj);
let size = new THREE.Vector3();
box.getSize(size);
let center = new THREE.Vector3();
box.getCenter(center);

console.log('Original Box Min:', box.min);
console.log('Original Box Max:', box.max);
console.log('Original Size:', size);
console.log('Original Center:', center);

// Test scale
const currentMaxDim = Math.max(size.x, size.y, size.z);
const targetDimension = 260.0;
const scaleFactor = targetDimension / currentMaxDim;
obj.scale.set(scaleFactor, scaleFactor, scaleFactor);

box.setFromObject(obj);
box.getSize(size);
box.getCenter(center);

console.log('--- AFTER SCALE (' + scaleFactor + ') ---');
console.log('Scaled Size:', size);
console.log('Scaled Center:', center);
console.log('Scaled Box Min:', box.min);
console.log('Scaled Box Max:', box.max);

// Test positioning
obj.position.x = -center.x;
obj.position.z = -center.z;
obj.position.y = -box.min.y + 5.0 + 1.0;

let finalBox = new THREE.Box3().setFromObject(obj);
console.log('--- FINAL WORLD BOUNDING BOX ---');
console.log('Final Box Min:', finalBox.min);
console.log('Final Box Max:', finalBox.max);
console.log('Final Position:', obj.position);

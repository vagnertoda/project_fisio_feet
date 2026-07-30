import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const filePath = path.resolve('../backend/uploads/scans/foot_scan_1785415997448-360398896.obj');
const objData = fs.readFileSync(filePath, 'utf8');
const loader = new OBJLoader();
const baseObj = loader.parse(objData);

const candidates = [
  { name: '#19 rx:90° ry:0° rz:180°', rx: Math.PI / 2, ry: 0, rz: Math.PI },
  { name: '#49 rx:270° ry:0° rz:0°', rx: -Math.PI / 2, ry: 0, rz: 0 },
];

for (let cand of candidates) {
  const obj = baseObj.clone();
  obj.rotation.set(cand.rx, cand.ry, cand.rz);
  obj.updateMatrixWorld(true);

  let box = new THREE.Box3().setFromObject(obj);
  let size = new THREE.Vector3();
  box.getSize(size);
  const scale = 260.0 / size.z;
  obj.scale.set(scale, scale, scale);
  obj.updateMatrixWorld(true);

  box.setFromObject(obj);
  let center = new THREE.Vector3();
  box.getCenter(center);
  obj.position.x = -center.x;
  obj.position.z = -center.z;
  obj.position.y = -box.min.y + 5.0;
  obj.updateMatrixWorld(true);

  box.setFromObject(obj);

  // Analisar extremo X do antepé (dedos Z > 80)
  const pos = obj.children[0].geometry.attributes.position;
  let minXToes = 9999, maxXToes = -9999;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) * scale - center.x;
    const z = pos.getZ(i) * scale - center.z;

    if (z > 80) {
      if (x < minXToes) minXToes = x;
      if (x > maxXToes) maxXToes = x;
    }
  }

  console.log(`\nCandidate: ${cand.name}`);
  console.log(`Toe Region X Range: [ Min: ${minXToes.toFixed(1)}mm (Left), Max: ${maxXToes.toFixed(1)}mm (Right) ]`);

  if (Math.abs(minXToes) > Math.abs(maxXToes)) {
    console.log('-> Hallux (Big Toe) is on the LEFT (X < 0). Perfect for Right Foot!');
  } else {
    console.log('-> Hallux (Big Toe) is on the RIGHT (X > 0).');
  }
}

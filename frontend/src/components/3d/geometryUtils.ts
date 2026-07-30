import * as THREE from 'three';

/**
 * Gerador de Malha Anatômica de Pé Sintético de Alta Fidelidade (Pé Esquerdo ou Pé Direito)
 */
export function createSyntheticFootGeometry(
  length = 260,
  width = 98,
  height = 75,
  footSide: 'left' | 'right' = 'right'
): THREE.BufferGeometry {
  const segmentsX = 40;
  const segmentsZ = 60;
  const geometry = new THREE.PlaneGeometry(width, length, segmentsX, segmentsZ);
  geometry.rotateX(-Math.PI / 2);

  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let z = pos.getZ(i);

    const normZ = (z + length / 2) / length;
    const normX = (x + width / 2) / width;

    let footWidthFactor = 1;
    if (normZ < 0.25) {
      footWidthFactor = Math.sin((normZ / 0.25) * (Math.PI / 2)) * 0.75 + 0.25;
    } else if (normZ >= 0.25 && normZ < 0.5) {
      const t = (normZ - 0.25) / 0.25;
      footWidthFactor = 0.75 - Math.sin(t * Math.PI) * 0.2;
    } else if (normZ >= 0.5 && normZ < 0.85) {
      footWidthFactor = 0.8 + Math.sin(((normZ - 0.5) / 0.35) * Math.PI) * 0.25;
    } else {
      footWidthFactor = Math.cos(((normZ - 0.85) / 0.15) * (Math.PI / 2)) * 0.95;
    }

    const maxDist = (width / 2) * footWidthFactor;
    if (Math.abs(x) > maxDist) {
      x = Math.sign(x) * maxDist;
      pos.setX(i, x);
    }

    let y = 0;
    const centerDist = Math.sqrt(Math.pow(x / (width * 0.45), 2) + Math.pow((z - length * 0.1) / (length * 0.4), 2));
    if (centerDist < 1.0) {
      y += (1.0 - Math.pow(centerDist, 2)) * height * 0.75;
    }

    if (normX > 0.4 && normZ > 0.3 && normZ < 0.7) {
      const archFactor = Math.sin(((normZ - 0.3) / 0.4) * Math.PI) * Math.sin(((normX - 0.4) / 0.6) * Math.PI);
      y += archFactor * 18;
    }

    if (normZ < 0.2) {
      const heelFactor = Math.cos((normZ / 0.2) * (Math.PI / 2));
      y += heelFactor * 25;
    }

    pos.setY(i, Math.max(0, y));
  }

  // Mapeamento de Lado para o Pé Sintético:
  // Pé Direito (right): Hallux e Arco Medial no lado ESQUERDO da tela (X < 0) em vista frontal
  // Pé Esquerdo (left): Hallux e Arco Medial no lado DIREITO da tela (X > 0) em vista frontal
  if (footSide === 'left') {
    geometry.scale(-1, 1, 1);
  }

  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Gerador Paramétrico Anatômico de Alta Fidelidade da Palmilha Base Ortopédica (Preenche 100% a planta do pé)
 * Respeita estritamente:
 * - Pé Direito: Arco Medial & Hallux no lado ESQUERDO da palmilha (X < 0)
 * - Pé Esquerdo: Arco Medial & Hallux no lado DIREITO da palmilha (X > 0)
 */
export function createBaseInsoleGeometry(
  length = 260,
  width = 105,
  baseThickness = 5.0,
  archHeight = 18.0,
  archWidth = 30.0,
  footSide: 'left' | 'right' = 'right'
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const halfL = length / 2; // 130
  const halfW = width / 2;  // 52.5

  // Perfil anatômico EXPANDIDO que envolve 100% da planta do pé (sem sobras no 1º e 5º metatarsos)
  // Desenhar forma base un-mirrored (Pé Direito padrão onde X < 0 é o lado Medial)
  shape.moveTo(0, -halfL);
  
  // Calcanhar -> Cintura Medial (Arco Medial X < 0 na forma base de Pé Direito)
  shape.bezierCurveTo(-halfW * 0.8, -halfL, -halfW * 0.85, -halfL * 0.5, -halfW * 0.75, -halfL * 0.1);
  // Antepé Medial (1º Metatarso / Hallux X < 0)
  shape.bezierCurveTo(-halfW * 0.75, halfL * 0.3, -halfW * 1.05, halfL * 0.65, -halfW * 1.0, halfL * 0.85);
  // Curva dos Dedos (Ponteiro nos Dedos Z = +130)
  shape.bezierCurveTo(-halfW * 0.6, halfL * 1.0, halfW * 0.4, halfL * 1.0, halfW * 0.85, halfL * 0.82);
  // Antepé Lateral (5º Metatarso X > 0)
  shape.bezierCurveTo(halfW * 0.95, halfL * 0.6, halfW * 0.72, halfL * 0.2, halfW * 0.68, -halfL * 0.1);
  // Cintura Lateral -> Calcanhar
  shape.bezierCurveTo(halfW * 0.72, -halfL * 0.5, halfW * 0.8, -halfL, 0, -halfL);

  const extrudeSettings = {
    steps: 10,
    depth: baseThickness,
    bevelEnabled: true,
    bevelThickness: 1.5,
    bevelSize: 1.5,
    bevelOffset: 0,
    bevelSegments: 5
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(Math.PI / 2); // Deitar no plano XZ
  geometry.center();

  // Deformações Anatômicas de Alta Fidelidade (Preenchimento Total do Arco Plantar + Calcanheira em U)
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const normZ = (z + halfL) / length; // 0 no calcanhar, 1 nos dedos
    const normX = (x + halfW) / width;   // 0 medial (Pé Direito), 1 lateral

    if (y > 0) {
      // 1. Elevação e Preenchimento Total da Cavidade do Arco Plantar Medial (X < 0 para Pé Direito)
      if (normX < 0.65 && normZ > 0.18 && normZ < 0.75) {
        const archZ = Math.sin(((normZ - 0.18) / 0.57) * Math.PI);
        const archX = Math.sin(((0.65 - normX) / 0.65) * Math.PI);
        const archElevation = archZ * archX * archHeight * (archWidth / 25.0);
        y += Math.max(0, archElevation);
      }

      // 2. Calcanheira Anatômica em U para Travar o Retropé
      if (normZ < 0.25) {
        const heelCenterZ = -halfL * 0.75;
        const distFromHeel = Math.sqrt(Math.pow(x / (halfW * 0.65), 2) + Math.pow((z - heelCenterZ) / (halfL * 0.22), 2));
        if (distFromHeel > 0.35) {
          const cupFactor = Math.min(1.0, (distFromHeel - 0.35) * 1.5);
          const heelZFactor = 1.0 - normZ / 0.25;
          const cupHeight = cupFactor * heelZFactor * 10.0;
          y += Math.max(0, cupHeight);
        }
      }

      // 3. Suavização Fina no Antepé / Dedos (Antepé fino para encaixe confortável no calçado)
      if (normZ > 0.8) {
        const toeFactor = (normZ - 0.8) / 0.2;
        y = Math.max(1.5, y * (1.0 - toeFactor * 0.5));
      }
    }

    pos.setY(i, y);
  }

  // REGRA ANATÔMICA RÍGIDA DE LADOS:
  // Pé Direito (right): Forma base padrão com Arco Medial no lado ESQUERDO (X < 0)
  // Pé Esquerdo (left): Espelhar no Eixo X (X > 0)
  if (footSide === 'left') {
    geometry.scale(-1, 1, 1);
  }

  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Geradores de Geometria para Componentes Ortopédicos Adicionais
 */
export function createComponentGeometry(type: string, w: number, h: number, d: number): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry;

  switch (type) {
    case 'amortecedor_calcaneo': {
      geo = new THREE.CylinderGeometry(w / 2, w / 2 * 0.8, h, 32);
      geo.scale(1, 1, d / w);
      break;
    }
    case 'piloto_metatarso': {
      geo = new THREE.SphereGeometry(Math.max(w, d) / 2, 32, 16);
      geo.scale(1, h / (Math.max(w, d) / 2), d / w);
      break;
    }
    case 'cunha_pronacao':
    case 'cunha_supinacao': {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(w, 0);
      shape.lineTo(0, h);
      shape.closePath();
      const extrudeSettings = { depth: d, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 1, bevelThickness: 1 };
      geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      break;
    }
    case 'estimulo_proprioceptivo': {
      geo = new THREE.SphereGeometry(w / 2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      geo.scale(1, h / (w / 2), d / w);
      break;
    }
    case 'placa_pressao': {
      geo = new THREE.BoxGeometry(w, h, d, 16, 4, 16);
      break;
    }
    case 'arco_suporte':
    default: {
      geo = new THREE.CylinderGeometry(w / 2, w / 2, h, 32);
      geo.scale(1, 1, d / w);
      break;
    }
  }

  geo.computeVertexNormals();
  return geo;
}

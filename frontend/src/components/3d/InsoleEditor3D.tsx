import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import type {
  InsoleProject,
  RenderMode,
  ViewpointPreset
} from '../../types/insole';
import {
  createSyntheticFootGeometry,
  createBaseInsoleGeometry,
  createComponentGeometry
} from './geometryUtils';

interface InsoleEditor3DProps {
  project: InsoleProject;
  scanUrl?: string | null;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onUpdateComponentPosition: (id: string, pos: { x: number; y: number; z: number }) => void;
  renderMode: RenderMode;
  viewpoint: ViewpointPreset;
  showFoot: boolean;
  showGrid?: boolean;
  isRotatedY?: boolean;
  onExportReady?: (stlBlob: Blob) => void;
}

export const InsoleEditor3D: React.FC<InsoleEditor3DProps> = ({
  project,
  scanUrl,
  selectedComponentId,
  onSelectComponent,
  onUpdateComponentPosition,
  renderMode,
  viewpoint,
  showFoot,
  showGrid = true,
  isRotatedY = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Referências para objetos 3D
  const footMeshRef = useRef<THREE.Object3D | null>(null);
  const baseInsoleMeshRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const componentsGroupRef = useRef<THREE.Group>(new THREE.Group());

  const isDraggingComponent = useRef(false);
  const draggedCompId = useRef<string | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Algoritmo Anatômico Estrito de Auto-Orientação e Espelhamento (scale.x *= -1) com Recálculo de Normais
  const normalizeAndCenterModel = useCallback((object: THREE.Object3D) => {
    object.rotation.set(0, 0, 0);
    object.scale.set(1, 1, 1);
    object.position.set(0, 0, 0);
    object.updateMatrixWorld(true);

    let box = new THREE.Box3().setFromObject(object);
    let size = new THREE.Vector3();
    box.getSize(size);

    if (size.x === 0 && size.y === 0 && size.z === 0) return object;

    // Alinhamento de eixos: Z = Comprimento, Y = Altura, X = Largura
    const dims = [
      { axis: 'x', val: size.x },
      { axis: 'y', val: size.y },
      { axis: 'z', val: size.z }
    ].sort((a, b) => b.val - a.val);

    const longestAxis = dims[0].axis;
    if (longestAxis === 'y') {
      object.rotateX(-Math.PI / 2);
    } else if (longestAxis === 'x') {
      object.rotateY(Math.PI / 2);
    }

    object.updateMatrixWorld(true);

    box.setFromObject(object);
    box.getSize(size);

    // Preservar escala e aplicar espelhamento no Eixo X (scale.x *= -1)
    const targetLength = 260.0;
    if (size.z > 0) {
      let scaleFactor = targetLength / size.z;
      // Aplica espelhamento no Eixo X para Pé Direito / Esquerdo
      const isRight = project.foot_side === 'right';
      const scaleX = isRight ? -Math.abs(scaleFactor) : Math.abs(scaleFactor);
      object.scale.set(scaleX, scaleFactor, scaleFactor);
    }

    object.updateMatrixWorld(true);

    // Recalcular as normais da malha para manter iluminação 3D perfeita pós-espelhamento
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.computeVertexNormals();
      }
    });

    box.setFromObject(object);
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Preservar pivô e alinhar a base da sola (box.min.y) no topo da palmilha
    object.position.x = -center.x;
    object.position.z = -center.z;
    object.position.y = -box.min.y + project.base_thickness + 1.0;

    return object;
  }, [project.base_thickness, project.foot_side]);

  // 1. Inicializar Cena 3D, Câmera, Renderer e OrbitControls
  useEffect(() => {
    if (!mountRef.current) return;

    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(0, 250, 380);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 50;
    controls.maxDistance = 1500;
    controls.target.set(0, 10, 0);
    controlsRef.current = controls;

    // Luzes Estúdio CAD
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(150, 300, 200);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.5);
    dirLight2.position.set(-150, -100, -200);
    scene.add(dirLight2);

    // Grid e Eixos
    const gridHelper = new THREE.GridHelper(500, 50, 0x3b82f6, 0x334155);
    gridHelper.position.y = -15;
    gridHelper.visible = showGrid;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const axesHelper = new THREE.AxesHelper(40);
    axesHelper.position.set(-120, -14, -150);
    axesHelper.visible = showGrid;
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    scene.add(componentsGroupRef.current);

    // Loop de Animação
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h, false);
        }
      }
    });
    resizeObserver.observe(mountRef.current);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Atualizar visibilidade dinâmica do Grid
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
    if (axesHelperRef.current) axesHelperRef.current.visible = showGrid;
  }, [showGrid]);

  // Aplicar Rotação de 180° no Eixo Y na Palmilha e Componentes
  useEffect(() => {
    const rotY = isRotatedY ? Math.PI : 0;
    if (baseInsoleMeshRef.current) {
      baseInsoleMeshRef.current.rotation.y = rotY;
    }
    if (componentsGroupRef.current) {
      componentsGroupRef.current.rotation.y = rotY;
    }
  }, [isRotatedY]);

  // 2. Carregar Modelo do Pé (Escaneamento 3D ou Sintético)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (footMeshRef.current) {
      scene.remove(footMeshRef.current);
      footMeshRef.current = null;
    }

    const footMaterial = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: renderMode === 'xray' ? 0.35 : 0.9,
      wireframe: renderMode === 'wireframe',
      side: THREE.DoubleSide
    });

    if (scanUrl) {
      const ext = scanUrl.split('.').pop()?.toLowerCase();
      const fullUrl = scanUrl.startsWith('http') ? scanUrl : `http://localhost:3001${scanUrl}`;

      if (ext === 'stl') {
        new STLLoader().load(
          fullUrl,
          (geo) => {
            geo.computeVertexNormals();
            const mesh = new THREE.Mesh(geo, footMaterial);
            normalizeAndCenterModel(mesh);
            footMeshRef.current = mesh;
            if (showFoot) scene.add(mesh);
          },
          undefined,
          (err) => console.error('Erro ao carregar STL:', err)
        );
      } else if (ext === 'ply') {
        new PLYLoader().load(
          fullUrl,
          (geo) => {
            geo.computeVertexNormals();
            const mesh = new THREE.Mesh(geo, footMaterial);
            normalizeAndCenterModel(mesh);
            footMeshRef.current = mesh;
            if (showFoot) scene.add(mesh);
          },
          undefined,
          (err) => console.error('Erro ao carregar PLY:', err)
        );
      } else if (ext === 'obj') {
        new OBJLoader().load(
          fullUrl,
          (obj) => {
            obj.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).material = footMaterial;
              }
            });
            normalizeAndCenterModel(obj);
            footMeshRef.current = obj;
            if (showFoot) scene.add(obj);
          },
          undefined,
          (err) => console.error('Erro ao carregar OBJ:', err)
        );
      }
    } else {
      const syntheticGeo = createSyntheticFootGeometry(260, 102, 75, project.foot_side || 'right');
      const mesh = new THREE.Mesh(syntheticGeo, footMaterial);
      mesh.position.set(0, 5, 0);
      footMeshRef.current = mesh;
      if (showFoot) scene.add(mesh);
    }
  }, [scanUrl, showFoot, renderMode, normalizeAndCenterModel, project.foot_side]);

  // Atualizar visibilidade do pé
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !footMeshRef.current) return;
    if (showFoot) {
      scene.add(footMeshRef.current);
    } else {
      scene.remove(footMeshRef.current);
    }
  }, [showFoot]);

  // 3. Atualizar Malha da Palmilha Base em Tempo Real
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (baseInsoleMeshRef.current) {
      scene.remove(baseInsoleMeshRef.current);
      baseInsoleMeshRef.current.geometry.dispose();
    }

    const insoleGeo = createBaseInsoleGeometry(
      260,
      105,
      project.base_thickness,
      project.arch_height,
      project.arch_width,
      project.foot_side || 'right'
    );

    const insoleMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.3,
      metalness: 0.2,
      wireframe: renderMode === 'wireframe',
      transparent: renderMode === 'xray',
      opacity: renderMode === 'xray' ? 0.5 : 1.0,
      side: THREE.DoubleSide
    });

    const baseMesh = new THREE.Mesh(insoleGeo, insoleMat);
    baseMesh.position.set(0, 0, 0);
    baseMesh.rotation.y = isRotatedY ? Math.PI : 0;
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    scene.add(baseMesh);
    baseInsoleMeshRef.current = baseMesh;
  }, [project.base_thickness, project.arch_height, project.arch_width, project.foot_side, renderMode, isRotatedY]);

  // 4. Atualizar Componentes Ortopédicos na Cena
  useEffect(() => {
    const group = componentsGroupRef.current;
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    project.components.forEach((comp) => {
      const geo = createComponentGeometry(comp.component_type, comp.width, comp.height, comp.depth);
      const isSelected = comp.id === selectedComponentId;

      const mat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xfacc15 : (comp.color || 0x22c55e),
        roughness: 0.2,
        metalness: 0.3,
        wireframe: renderMode === 'wireframe',
        emissive: isSelected ? 0x854d0e : 0x000000,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(comp.position_x, comp.position_y + comp.height / 2, comp.position_z);
      if (comp.rotation_y) {
        mesh.rotation.y = comp.rotation_y;
      }
      mesh.name = comp.id;
      mesh.castShadow = true;
      group.add(mesh);
    });
  }, [project.components, selectedComponentId, renderMode]);

  // 5. Presets de Câmera
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    switch (viewpoint) {
      case 'top':
        camera.position.set(0, 450, 0.1);
        break;
      case 'lateral_medial':
        camera.position.set(380, 50, 0);
        break;
      case 'lateral_lateral':
        camera.position.set(-380, 50, 0);
        break;
      case 'front':
        camera.position.set(0, 50, 380);
        break;
      case 'perspective':
      default:
        camera.position.set(0, 250, 380);
        break;
    }
    controls.target.set(0, 10, 0);
    controls.update();
  }, [viewpoint]);

  // 6. Arraste e Seleção 3D de Componentes
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const intersects = raycaster.current.intersectObjects(componentsGroupRef.current.children, true);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const compId = clickedMesh.name;
      onSelectComponent(compId);
      isDraggingComponent.current = true;
      draggedCompId.current = compId;
      if (controlsRef.current) controlsRef.current.enabled = false;
    } else {
      onSelectComponent(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingComponent.current || !draggedCompId.current || !mountRef.current || !cameraRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    if (raycaster.current.ray.intersectPlane(plane, intersectionPoint)) {
      const clampedX = Math.max(-50, Math.min(50, intersectionPoint.x));
      const clampedZ = Math.max(-120, Math.min(120, intersectionPoint.z));

      onUpdateComponentPosition(draggedCompId.current, {
        x: Math.round(clampedX),
        y: project.base_thickness,
        z: Math.round(clampedZ)
      });
    }
  };

  const handlePointerUp = () => {
    isDraggingComponent.current = false;
    draggedCompId.current = null;
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  // 7. Módulo de Exportação STL
  const exportToSTL = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene || !baseInsoleMeshRef.current) return;

    const exportGroup = new THREE.Group();
    const clonedBase = baseInsoleMeshRef.current.clone();
    exportGroup.add(clonedBase);

    componentsGroupRef.current.children.forEach((compMesh) => {
      exportGroup.add(compMesh.clone());
    });

    const exporter = new STLExporter();
    const stlBuffer = exporter.parse(exportGroup, { binary: true });
    const blob = new Blob([stlBuffer], { type: 'application/octet-stream' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project.project_name.replace(/\s+/g, '_')}_${project.foot_side === 'left' ? 'ESQUERDA' : 'DIREITA'}_TPU.stl`;
    link.click();

    return blob;
  }, [project.project_name, project.foot_side]);

  useEffect(() => {
    (window as any).__exportInsoleSTL = exportToSTL;
  }, [exportToSTL]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
};

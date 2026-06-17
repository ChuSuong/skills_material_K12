import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import gsap from 'gsap';

export const DissolveContext = createContext(false);

const normalizeScale = (scale) => {
  if (Array.isArray(scale)) {
    return scale;
  }

  if (typeof scale === 'number') {
    return [scale, scale, scale];
  }

  return [1, 1, 1];
};

const InteractiveMesh = ({ position, onClick, data, children, objectName, floatOffset = 0, floatSpeed = 1, rotationSpeed = [0, 0, 0] }) => {
  const groupRef = useRef();
  const [hovered, setHover] = useState(false);
  const isDissolving = useContext(DissolveContext);
  const dissolveAmount = useRef(0);
  const { camera, controls } = useThree();

  const handleInteraction = (e) => {
    e.stopPropagation();
    if (!isDissolving) {
      onClick(data);
      if (groupRef.current && controls) {
        const targetPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(targetPos);
        const cameraPos = targetPos.clone().add(new THREE.Vector3(2, 2, 4));

        gsap.to(camera.position, {
          x: cameraPos.x,
          y: cameraPos.y,
          z: cameraPos.z,
          duration: 1.5,
          ease: 'power3.inOut'
        });

        gsap.to(controls.target, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration: 1.5,
          ease: 'power3.inOut'
        });
      }
    }
  };

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const targetDissolve = isDissolving ? 1 : 0;
    dissolveAmount.current += (targetDissolve - dissolveAmount.current) * 0.045;

    if (groupRef.current) {
      if (floatSpeed > 0) {
        groupRef.current.position.y = position[1] + Math.sin(elapsed * floatSpeed + floatOffset) * 0.15;
      }

      groupRef.current.rotation.x += rotationSpeed[0];
      groupRef.current.rotation.y += rotationSpeed[1];
      groupRef.current.rotation.z += rotationSpeed[2];

      const hoverScale = hovered && !isDissolving ? 1.1 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(hoverScale, hoverScale, hoverScale), 0.1);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleInteraction}
      onPointerOver={(e) => { e.stopPropagation(); if (!isDissolving) { setHover(true); document.body.style.cursor = 'pointer'; } }}
      onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto'; }}
    >
      <DissolveContext.Provider value={{ isDissolving, dissolveAmount, hovered }}>
        {children}
      </DissolveContext.Provider>

      {hovered && !isDissolving && (
        <Html position={[0, 1.5, 0]} center zIndexRange={[100, 0]}>
          <div className="tooltip">{objectName}</div>
        </Html>
      )}
    </group>
  );
};

export const Artifact = ({ data, onClick }) => {
  const meshRef = useRef();
  const ringRef = useRef();
  const materialRef = useRef();
  const [hovered, setHover] = useState(false);
  const isDissolving = useContext(DissolveContext);
  const dissolveAmount = useRef(0);
  const { camera, controls } = useThree();

  const handleInteraction = (e) => {
    e.stopPropagation();
    if (!isDissolving) {
      onClick(data);
      if (meshRef.current && controls) {
        const targetPos = new THREE.Vector3();
        meshRef.current.getWorldPosition(targetPos);
        const cameraPos = targetPos.clone().add(new THREE.Vector3(2, 2, 4));
        gsap.to(camera.position, { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z, duration: 1.5, ease: 'power3.inOut' });
        gsap.to(controls.target, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 1.5, ease: 'power3.inOut' });
      }
    }
  };

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    const targetDissolve = isDissolving ? 1 : 0;
    dissolveAmount.current += (targetDissolve - dissolveAmount.current) * 0.045;

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008;
      meshRef.current.rotation.x = Math.sin(elapsed * 0.6) * 0.15;
      meshRef.current.position.y = 1.45 + Math.sin(elapsed * 1.2) * 0.08;

      const hoverScale = hovered && !isDissolving ? 1.1 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(hoverScale, hoverScale, hoverScale), 0.1);
    }

    if (materialRef.current) {
      materialRef.current.opacity = 1;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
      const ringScale = 1 + Math.sin(elapsed * 2) * 0.035;
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
      ringRef.current.material.opacity = 1;
    }
  });

  return (
    <group
      onClick={handleInteraction}
      onPointerOver={(e) => { e.stopPropagation(); if (!isDissolving) { setHover(true); document.body.style.cursor = 'pointer'; } }}
      onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto'; }}
    >
      <mesh ref={meshRef} castShadow>
        <torusKnotGeometry args={[0.75, 0.23, 160, 24]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#d6b16a"
          emissive="#3b2500"
          emissiveIntensity={hovered && !isDissolving ? 0.6 : 0.2}
          metalness={0.8}
          roughness={0.18}
          transparent
          opacity={1}
        />

        {hovered && !isDissolving && (
          <Html position={[0, 1.5, 0]} center zIndexRange={[100, 0]}>
            <div className="tooltip">Nhấn để xem Artifact</div>
          </Html>
        )}
      </mesh>

      <mesh ref={ringRef} position={[0, 1.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.015, 16, 120]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={1} />
      </mesh>
    </group>
  );
};

export const Crystal = ({ position, color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Pha lê năng lượng" floatOffset={position[0]} floatSpeed={1.5} rotationSpeed={[0, -0.01, 0]}>
    <mesh castShadow>
      <octahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.9} roughness={0.1} transparent opacity={0.9} />
    </mesh>
  </InteractiveMesh>
);

export const FloatingCube = ({ position, color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Khối dữ liệu" floatOffset={position[0]} floatSpeed={1} rotationSpeed={[0.005, 0.01, 0]}>
    <mesh castShadow>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={0.8} transparent opacity={0.8} />
    </mesh>
  </InteractiveMesh>
);

export const Sun = ({ size, color, texturePath, data, onClick }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const [hovered, setHover] = useState(false);
  const isDissolving = useContext(DissolveContext);
  const dissolveAmount = useRef(0);
  const textureMap = useLoader(THREE.TextureLoader, texturePath);
  const { camera, controls } = useThree();

  const handleInteraction = (e) => {
    e.stopPropagation();
    if (!isDissolving) {
      onClick(data);
      if (meshRef.current && controls) {
        const targetPos = new THREE.Vector3();
        meshRef.current.getWorldPosition(targetPos);
        const cameraPos = targetPos.clone().add(new THREE.Vector3(0, 5, 10));
        gsap.to(camera.position, { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z, duration: 1.5, ease: 'power3.inOut' });
        gsap.to(controls.target, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 1.5, ease: 'power3.inOut' });
      }
    }
  };

  useFrame(() => {
    const targetDissolve = isDissolving ? 1 : 0;
    dissolveAmount.current += (targetDissolve - dissolveAmount.current) * 0.045;

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      const hoverScale = hovered && !isDissolving ? 1.05 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(hoverScale, hoverScale, hoverScale), 0.1);
    }

    if (materialRef.current) {
      materialRef.current.opacity = 1;
    }
  });

  return (
    <group
      onClick={handleInteraction}
      onPointerOver={(e) => { e.stopPropagation(); if (!isDissolving) { setHover(true); document.body.style.cursor = 'pointer'; } }}
      onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto'; }}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial
          ref={materialRef} map={textureMap} color={color} emissive={color}
          emissiveIntensity={hovered && !isDissolving ? 0.8 : 0.4} transparent opacity={1}
        />
        <pointLight intensity={2} distance={30} decay={1.5} color={color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size + 0.15, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </mesh>
      {hovered && !isDissolving && (
        <Html position={[0, size + 0.8, 0]} center zIndexRange={[100, 0]}><div className="tooltip">Mặt Trời</div></Html>
      )}
    </group>
  );
};

export const Planet = ({ name, size, color, texturePath, orbitRadius, orbitSpeed, data, onClick }) => {
  const orbitGroupRef = useRef();
  const planetMeshRef = useRef();
  const materialRef = useRef();
  const [hovered, setHover] = useState(false);
  const isDissolving = useContext(DissolveContext);
  const dissolveAmount = useRef(0);
  const textureMap = useLoader(THREE.TextureLoader, texturePath);
  const { camera, controls } = useThree();

  const handleInteraction = (e) => {
    e.stopPropagation();
    if (!isDissolving) {
      onClick(data);
      if (planetMeshRef.current && controls) {
        const targetPos = new THREE.Vector3();
        planetMeshRef.current.getWorldPosition(targetPos);
        const cameraPos = targetPos.clone().add(new THREE.Vector3(1.5, 1.5, 2.5));
        gsap.to(camera.position, { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z, duration: 1.5, ease: 'power3.inOut' });
        gsap.to(controls.target, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 1.5, ease: 'power3.inOut' });
      }
    }
  };

  useFrame((state) => {
    const targetDissolve = isDissolving ? 1 : 0;
    dissolveAmount.current += (targetDissolve - dissolveAmount.current) * 0.045;

    if (orbitGroupRef.current) orbitGroupRef.current.rotation.y = state.clock.getElapsedTime() * orbitSpeed * 0.3;

    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y += 0.02;
      const hoverScale = hovered && !isDissolving ? 1.2 : 1;
      planetMeshRef.current.scale.lerp(new THREE.Vector3(hoverScale, hoverScale, hoverScale), 0.1);
    }

    if (materialRef.current) materialRef.current.opacity = 1;
  });

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 0.015, orbitRadius + 0.015, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15 - (dissolveAmount.current * 0.15)} side={THREE.DoubleSide} />
      </mesh>
      <group ref={orbitGroupRef}>
        <mesh
          ref={planetMeshRef}
          position={[orbitRadius, 0, 0]}
          onClick={handleInteraction}
          onPointerOver={(e) => { e.stopPropagation(); if (!isDissolving) { setHover(true); document.body.style.cursor = 'pointer'; } }}
          onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto'; }}
          castShadow receiveShadow
        >
          <sphereGeometry args={[size, 64, 64]} />
          <meshStandardMaterial ref={materialRef} map={textureMap} color="#ffffff" metalness={0.1} roughness={0.8} transparent opacity={1} />
          {hovered && !isDissolving && (<Html position={[0, size + 0.5, 0]} center zIndexRange={[100, 0]}><div className="tooltip">{name}</div></Html>)}
        </mesh>
      </group>
    </group>
  );
};

export const Fish = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => {
  const { scene } = useGLTF('/models/fish.glb');
  return (
    <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Cá Chẽm" floatOffset={position[0]} floatSpeed={2} rotationSpeed={[0, 0.02, 0]}>
      <group scale={scale} rotation={rotation}>
        <primitive object={scene.clone()} scale={1.5} />
      </group>
    </InteractiveMesh>
  );
};

export const Duck = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => {
  const { scene } = useGLTF('/models/duck.glb');
  return (
    <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Vịt Tàu Ngầm" floatOffset={position[0]} floatSpeed={0.5} rotationSpeed={[0, 0.005, 0]}>
      <group scale={scale} rotation={rotation} position={[0, -0.5, 0]}>
        <primitive object={scene.clone()} />
      </group>
    </InteractiveMesh>
  );
};

export const Coral = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Rạn San Hô" floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
    <group scale={scale} rotation={rotation}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.2, 1, 16]} />
        <meshStandardMaterial color={color || '#ec4899'} roughness={0.9} />
      </mesh>
      <mesh position={[0.3, 0.3, 0]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 0.8, 16]} />
        <meshStandardMaterial color={color || '#ec4899'} roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, 0.4, 0]} rotation={[0, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.12, 0.6, 16]} />
        <meshStandardMaterial color={color || '#ec4899'} roughness={0.9} />
      </mesh>
    </group>
  </InteractiveMesh>
);

export const Tree = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Cây Cổ Thụ" floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
    <group scale={scale} rotation={rotation}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 1, 16]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[1, 2, 16]} />
        <meshStandardMaterial color={color || '#166534'} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[0.8, 1.5, 16]} />
        <meshStandardMaterial color={color || '#166534'} roughness={0.8} />
      </mesh>
    </group>
  </InteractiveMesh>
);

export const Mountain = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Dãy Núi" floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
    <mesh scale={scale} rotation={rotation} castShadow receiveShadow>
      <tetrahedronGeometry args={[4, 1]} />
      <meshStandardMaterial color={color || '#78716c'} roughness={0.9} />
    </mesh>
  </InteractiveMesh>
);

export const Tent = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Lều Cắm Trại" floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
    <group scale={scale} rotation={rotation}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color={color || '#0ea5e9'} roughness={0.9} />
      </mesh>
    </group>
  </InteractiveMesh>
);

export const Cloud = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Đám Mây" floatOffset={position[0]} floatSpeed={0.5} rotationSpeed={[0, 0.002, 0]}>
    <group scale={scale} rotation={rotation}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color || '#fefce8'} transparent opacity={0.6} roughness={1} />
      </mesh>
      <mesh position={[0.8, -0.2, 0.2]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color={color || '#fefce8'} transparent opacity={0.6} roughness={1} />
      </mesh>
      <mesh position={[-0.8, -0.3, -0.2]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color={color || '#fefce8'} transparent opacity={0.6} roughness={1} />
      </mesh>
    </group>
  </InteractiveMesh>
);

export const Fox = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => {
  const { scene } = useGLTF('/models/ces.glb');
  return (
    <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Khách Tham Quan" floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
      <group scale={scale} rotation={rotation}>
        <primitive object={scene.clone()} scale={1.5} />
      </group>
    </InteractiveMesh>
  );
};

export const Lantern = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => {
  const { scene } = useGLTF('/models/lantern.glb');
  return (
    <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Đèn Lồng" floatOffset={0} floatSpeed={0.2} rotationSpeed={[0, 0.005, 0]}>
      <group scale={scale} rotation={rotation} position={[0, -0.5, 0]}>
        <primitive object={scene.clone()} scale={0.06} />
        <pointLight color="#f97316" intensity={2} distance={8} decay={2} position={[0, 0.2, 0]} />
      </group>
    </InteractiveMesh>
  );
};

export const MagicalParticles = ({ color }) => {
  const pointsRef = useRef();
  const materialRef = useRef();
  const isDissolving = useContext(DissolveContext);
  const dissolveAmount = useRef(0);

  const particleCount = 15000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 45;
      const angle = Math.random() * Math.PI * 2;
      const height = -10 + Math.random() * 40;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame(() => {
    const targetDissolve = isDissolving ? 1 : 0;
    dissolveAmount.current += (targetDissolve - dissolveAmount.current) * 0.045;

    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0018 + (dissolveAmount.current * 0.003);
    }
    if (materialRef.current) {
      materialRef.current.opacity = 0.35 + dissolveAmount.current * 0.65;
      materialRef.current.size = 0.035 + dissolveAmount.current * 0.035;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} /></bufferGeometry>
      <pointsMaterial ref={materialRef} color={color} size={0.035} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

export const Pyramid = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Kim Tự Tháp" floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
    <mesh scale={scale} rotation={rotation} castShadow receiveShadow position={[0, 3, 0]}>
      <coneGeometry args={[5, 6, 4]} />
      <meshStandardMaterial color={color || '#d97706'} roughness={0.9} />
    </mesh>
  </InteractiveMesh>
);

export const Pharaoh = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick, id }) => {
  const modelFile = id === 'pharaoh_1' ? '/models/ra.glb' : '/models/anubis.glb';
  const { scene } = useGLTF(modelFile);
  const title = id === 'pharaoh_1' ? 'Thần Ra' : 'Thần Anubis';
  return (
    <InteractiveMesh position={position} onClick={onClick} data={data} objectName={title} floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
      <group scale={scale} rotation={rotation}>
        <primitive object={scene.clone()} scale={1.5} />
      </group>
    </InteractiveMesh>
  );
};

export const Market = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Lều Chợ Ai Cập" floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
    <group scale={scale} rotation={rotation}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[1.5, 1, 4]} />
        <meshStandardMaterial color={color || '#ef4444'} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.9} />
      </mesh>
    </group>
  </InteractiveMesh>
);

export const Citizen = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => {
  const { scene } = useGLTF('/models/ces.glb');
  return (
    <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Người dân" floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
      <group scale={scale} rotation={rotation}>
        <primitive object={scene.clone()} scale={1.5} />
      </group>
    </InteractiveMesh>
  );
};

const GeneratedMeshModel = ({ obj, onClick }) => {
  const { scene } = useGLTF(obj.model_url);
  const displayScale = obj.displayMode === 'museumFocus' ? [2.35, 2.35, 2.35] : normalizeScale(obj.scale);
  const useAlbedoFirstPreview = obj.previewRenderMode === 'flat';
  const normalizedScene = useMemo(() => {
    const clonedScene = scene.clone();
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const min = box.min.clone();
    const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
    const scaleFactor = 1 / maxDimension;

    clonedScene.scale.setScalar(scaleFactor);
    clonedScene.position.set(
      -center.x * scaleFactor,
      (-min.y * scaleFactor) + 0.02,
      -center.z * scaleFactor
    );
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (!material) {
            return;
          }
          material.side = THREE.DoubleSide;
          material.color?.set?.('#ffffff');
          if (useAlbedoFirstPreview) {
            if ('metalness' in material) {
              material.metalness = 0.0;
            }
            if ('roughness' in material) {
              material.roughness = 1.0;
            }
            if ('metalnessMap' in material) {
              material.metalnessMap = null;
            }
            if ('roughnessMap' in material) {
              material.roughnessMap = null;
            }
            if ('aoMap' in material) {
              material.aoMap = null;
            }
          }
          material.needsUpdate = true;
        });
      }
    });

    return clonedScene;
  }, [scene, useAlbedoFirstPreview]);

  return (
    <InteractiveMesh
      position={obj.position || [0, 0, 0]}
      onClick={onClick}
      data={obj}
      objectName={obj.title || obj.name || obj.id || obj.type || '3D Object'}
      floatOffset={0}
      floatSpeed={0}
      rotationSpeed={[0, 0.0035, 0]}
    >
      <group scale={displayScale} rotation={obj.rotation || [0, 0, 0]}>
        <primitive object={normalizedScene} />
      </group>
    </InteractiveMesh>
  );
};

const GeneratedSplat = ({ obj, onClick }) => {
  const [viewer, setViewer] = useState(null);
  const displayScale = normalizeScale(obj.scale);

  useEffect(() => {
    let mounted = true;

    const dropInViewer = new GaussianSplats3D.DropInViewer({
      gpuAcceleratedSort: true,
      sharedMemoryForWorkers: false,
      integerBasedSort: true,
      enableSIMDInSort: true,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
      renderMode: GaussianSplats3D.RenderMode.OnChange,
      splatRenderMode: GaussianSplats3D.SplatRenderMode.TwoD,
      logLevel: GaussianSplats3D.LogLevel.None,
      sphericalHarmonicsDegree: 0,
      enableOptionalEffects: false,
    });

    dropInViewer.addSplatScene(obj.splat_url, {
      showLoadingUI: false,
      splatAlphaRemovalThreshold: 5,
      scale: [1, 1, 1],
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
    }).catch((error) => {
      console.error('Failed to load Gaussian splat scene', error);
    });

    if (mounted) {
      setViewer(dropInViewer);
    }

    return () => {
      mounted = false;
      setViewer(null);
      dropInViewer.dispose().catch((error) => {
        console.error('Failed to dispose Gaussian splat viewer', error);
      });
    };
  }, [obj.splat_url]);

  return (
    <InteractiveMesh
      position={obj.position || [0, 0, 0]}
      onClick={onClick}
      data={obj}
      objectName={obj.title || obj.name || obj.id || 'WorldGen Splat'}
      floatOffset={0}
      floatSpeed={0}
      rotationSpeed={[0, 0, 0]}
    >
      <group scale={displayScale} rotation={obj.rotation || [0, 0, 0]}>
        {viewer ? <primitive object={viewer} /> : null}
        <mesh position={[0, 0, 0]} renderOrder={-1}>
          <sphereGeometry args={[1.6, 16, 16]} />
          <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
        </mesh>
      </group>
    </InteractiveMesh>
  );
};

export const GeneratedModel = ({ obj, onClick }) => {
  if (obj.splat_url) {
    return <GeneratedSplat obj={obj} onClick={onClick} />;
  }

  return <GeneratedMeshModel obj={obj} onClick={onClick} />;
};

export const GeneratedPlaceholder = ({ obj, onClick }) => {
  const normalizedScale = normalizeScale(obj.scale);
  const type = (obj.type || '').toLowerCase();

  let geometry = <boxGeometry args={[1, 1, 1]} />;
  let color = '#38bdf8';
  const objectName = obj.title || obj.name || obj.id || obj.type || 'Object';

  if (type.includes('apple')) {
    geometry = <sphereGeometry args={[0.5, 32, 32]} />;
    color = '#ef4444';
  } else if (type.includes('table')) {
    geometry = <boxGeometry args={[1.8, 0.35, 1.2]} />;
    color = '#8b5a2b';
  } else if (type.includes('planet') || type.includes('sun')) {
    geometry = <sphereGeometry args={[0.6, 32, 32]} />;
    color = '#f59e0b';
  } else if (type.includes('tree')) {
    geometry = <coneGeometry args={[0.7, 1.4, 12]} />;
    color = '#16a34a';
  }

  return (
    <InteractiveMesh
      position={obj.position || [0, 0, 0]}
      onClick={onClick}
      data={obj}
      objectName={objectName}
      floatOffset={0}
      floatSpeed={0}
      rotationSpeed={[0, 0.005, 0]}
    >
      <mesh scale={normalizedScale} rotation={obj.rotation || [0, 0, 0]} castShadow receiveShadow>
        {geometry}
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.7} />
      </mesh>
    </InteractiveMesh>
  );
};

export const Cactus = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Xương Rồng" floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
    <group scale={scale} rotation={rotation}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.2, 1, 8, 16]} />
        <meshStandardMaterial color={color || '#15803d'} roughness={0.8} />
      </mesh>
      <mesh position={[0.3, 0.4, 0]} rotation={[0, 0, -0.5]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
        <meshStandardMaterial color={color || '#15803d'} roughness={0.8} />
      </mesh>
      <mesh position={[-0.3, 0.6, 0]} rotation={[0, 0, 0.5]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 8, 16]} />
        <meshStandardMaterial color={color || '#15803d'} roughness={0.8} />
      </mesh>
    </group>
  </InteractiveMesh>
);

export const Temple = ({ position, scale = 1, rotation = [0, 0, 0], color, data, onClick }) => (
  <InteractiveMesh position={position} onClick={onClick} data={data} objectName="Đền Thần Ai Cập" floatOffset={0} floatSpeed={0} rotationSpeed={[0, 0, 0]}>
    <group scale={scale} rotation={rotation} castShadow receiveShadow>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.5, 4]} />
        <meshStandardMaterial color={color || '#d97706'} roughness={0.8} />
      </mesh>

      <mesh position={[-2.5, 2, -1.5]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.3, 3]} /><meshStandardMaterial color={color || '#d97706'} roughness={0.9} /></mesh>
      <mesh position={[-2.5, 2, 1.5]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.3, 3]} /><meshStandardMaterial color={color || '#d97706'} roughness={0.9} /></mesh>
      <mesh position={[2.5, 2, -1.5]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.3, 3]} /><meshStandardMaterial color={color || '#d97706'} roughness={0.9} /></mesh>
      <mesh position={[2.5, 2, 1.5]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.3, 3]} /><meshStandardMaterial color={color || '#d97706'} roughness={0.9} /></mesh>
      <mesh position={[0, 2, -1.5]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.3, 3]} /><meshStandardMaterial color={color || '#d97706'} roughness={0.9} /></mesh>
      <mesh position={[0, 2, 1.5]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.3, 3]} /><meshStandardMaterial color={color || '#d97706'} roughness={0.9} /></mesh>

      <mesh position={[0, 3.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.5, 0.5, 4.5]} />
        <meshStandardMaterial color={color || '#b45309'} roughness={0.9} />
      </mesh>
    </group>
  </InteractiveMesh>
);

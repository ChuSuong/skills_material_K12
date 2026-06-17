import React from 'react';
import { MagicalParticles } from './objectComponents';
import { getGeneratedScenePalette, isGeneratedScene } from './scenePresentation';

export default function SceneEnvironment({ activeScene, renderMode = 'flat' }) {
  const generatedScene = isGeneratedScene(activeScene);
  const museumFocusScene = generatedScene && activeScene.environment === 'museumFocus';
  const palette = getGeneratedScenePalette(activeScene);
  const useFlatGeneratedRenderMode = museumFocusScene && renderMode === 'flat';

  return (
    <group>
      {museumFocusScene && (
        <>
          {!useFlatGeneratedRenderMode && <ambientLight intensity={1.1} />}
          <hemisphereLight
            intensity={1.8}
            skyColor="#ffffff"
            groundColor={palette.sceneStyle === 'desertStudio' ? '#d6c2a8' : '#b6b0a8'}
          />
          <directionalLight
            position={[4, 6, 4]}
            intensity={1.4}
            color={palette.sceneStyle === 'desertStudio' ? '#fff4db' : '#ffffff'}
            castShadow={!useFlatGeneratedRenderMode}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-4, 4, -2]} intensity={0.9} color="#fef3c7" />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow={!useFlatGeneratedRenderMode}>
            <circleGeometry args={[3.2, 80]} />
            <meshStandardMaterial color={palette.floorColor} metalness={0.0} roughness={0.96} />
          </mesh>
          {!useFlatGeneratedRenderMode && (
            <>
              <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.95, 1.18, 0.56, 64]} />
                <meshStandardMaterial color={palette.pedestalColor} metalness={0.25} roughness={0.32} />
              </mesh>
              <MagicalParticles color={activeScene.particleColor || palette.accentColor} />
            </>
          )}
        </>
      )}

      {activeScene.id === 'museum' && (
        <>
          <ambientLight intensity={0.15} />
          <directionalLight position={[4, 8, 6]} intensity={1.2} castShadow />
          <pointLight position={[-4, 3, 3]} color="#8b5cf6" intensity={1.4} distance={10} />
          <pointLight position={[4, 3, -3]} color="#06b6d4" intensity={1.2} distance={10} />

          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[5, 80]} />
            <meshStandardMaterial color="#111827" metalness={0.25} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.1, 1.35, 0.6, 64]} />
            <meshStandardMaterial color="#2d2f3a" metalness={0.4} roughness={0.35} />
          </mesh>
          <MagicalParticles color={activeScene.particleColor} />
        </>
      )}

      {activeScene.id === 'solar' && (
        <>
          <ambientLight intensity={0.2} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow>
            <circleGeometry args={[20, 80]} />
            <meshStandardMaterial color="#0b0f19" metalness={0.25} roughness={0.45} />
          </mesh>
          <MagicalParticles color={activeScene.particleColor} />
        </>
      )}

      {activeScene.id === 'ocean' && (
        <>
          <ambientLight intensity={0.2} color="#0ea5e9" />
          <directionalLight position={[0, 10, 0]} intensity={1.5} color="#38bdf8" castShadow />
          <pointLight position={[0, 2, 2]} color="#0284c7" intensity={3} distance={15} />
          <fog attach="fog" args={['#082f49', 2, 15]} />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
            <planeGeometry args={[30, 30, 32, 32]} />
            <meshStandardMaterial color="#0c4a6e" roughness={0.8} metalness={0.2} wireframe={false} />
          </mesh>
          <MagicalParticles color={activeScene.particleColor} />
        </>
      )}

      {activeScene.id === 'forest' && (
        <>
          <ambientLight intensity={0.3} color="#fcd34d" />
          <directionalLight position={[-30, 20, -30]} intensity={2.5} color="#f97316" castShadow />
          <fog attach="fog" args={['#431407', 5, 20]} />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#14532d" roughness={0.9} />
          </mesh>

          <mesh position={[-30, 20, -30]}>
            <sphereGeometry args={[6, 32, 32]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          <MagicalParticles color={activeScene.particleColor} />
        </>
      )}

      {activeScene.id === 'egypt' && (
        <>
          <ambientLight intensity={0.4} color="#fef08a" />
          <directionalLight position={[20, 25, 20]} intensity={3} color="#fef08a" castShadow />
          <fog attach="fog" args={['#78350f', 15, 60]} />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
            <planeGeometry args={[150, 150]} />
            <meshStandardMaterial color="#d97706" roughness={0.9} />
          </mesh>
          <MagicalParticles color={activeScene.particleColor} />
        </>
      )}
    </group>
  );
}

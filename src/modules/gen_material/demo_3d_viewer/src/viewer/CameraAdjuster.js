import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { builtInSceneIds } from '../scenes/sceneRegistry';

export default function CameraAdjuster({ activeScene }) {
  const { camera, controls } = useThree();
  const sceneId = activeScene?.id;
  const hasImmersiveSplatScene = Boolean(activeScene?.objects?.some((obj) => obj.splat_url));

  useEffect(() => {
    if (hasImmersiveSplatScene) {
      camera.position.set(0, 0, 0.05);
      controls?.target.set(0, 0, 1);
    } else if (sceneId === 'solar') {
      camera.position.set(0, 10, 15);
      controls?.target.set(0, 0, 0);
    } else if (sceneId && !builtInSceneIds.has(sceneId)) {
      camera.position.set(0, 1.6, 6.4);
      controls?.target.set(0, 0.78, 0);
    } else if (sceneId === 'forest') {
      camera.position.set(0, 2, 8);
      controls?.target.set(0, 0, 0);
    } else if (sceneId === 'ocean') {
      camera.position.set(0, 3, 8);
      controls?.target.set(0, 0, 0);
    } else if (sceneId === 'egypt') {
      camera.position.set(0, 5, 20);
      controls?.target.set(0, 0, 0);
    } else {
      camera.position.set(0, 2.2, 7);
      controls?.target.set(0, 0, 0);
    }

    camera.lookAt(controls?.target || new THREE.Vector3(0, 0, 0));
    controls?.update();
  }, [sceneId, hasImmersiveSplatScene, camera, controls]);

  return null;
}

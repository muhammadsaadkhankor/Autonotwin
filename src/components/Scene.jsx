import { CameraControls, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Avatar } from "./Avatar";

const STUDIO_PATH = "/models/Scene/studio.glb";

function Studio(props) {
  const { scene } = useGLTF(STUDIO_PATH);
  return <primitive object={scene} {...props} />;
}

export function Scene({ avatarPath }) {
  const cam = useRef();

  useEffect(() => {
    cam.current?.setLookAt(0, 1.4, 3, 0, 1.0, 0, true);
  }, []);

  return (
    <>
      <CameraControls
        ref={cam}
        minDistance={3}
        maxDistance={3}
        minZoom={1}
        maxZoom={1}
        dollySpeed={0}
        truckSpeed={0}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={0}
        maxAzimuthAngle={0}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <Studio position={[0, -1, 0]} />
      <Avatar position={[0, 0, 0]} modelPath={avatarPath} />
    </>
  );
}

useGLTF.preload(STUDIO_PATH);

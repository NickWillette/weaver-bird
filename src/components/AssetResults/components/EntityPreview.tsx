import { useMemo, useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { jemToThreeJS } from "@lib/emf";
import { OrbitControls, PerspectiveCamera, Bounds } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

interface Props {
  jemModel: any;
  textureUrl: string | null;
}

export function EntityPreview({ jemModel, textureUrl }: Props) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Load texture
  useEffect(() => {
    if (!textureUrl) {
      setTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.warn("[EntityPreview] Failed to load texture:", err);
        setTexture(null);
      },
    );
  }, [textureUrl]);

  // Convert JEM to Three.js group
  const group = useMemo(() => {
    if (!jemModel) return null;
    try {
      const g = jemToThreeJS(jemModel, texture);
      return g;
    } catch (err) {
      console.error("[EntityPreview] Failed to convert JEM to ThreeJS:", err);
      return null;
    }
  }, [jemModel, texture]);

  // Custom rotation logic
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5; // Constant speed: 0.5 radians per second
    }
  });

  const boundsRef = useRef<any>(null);
  const frameCountRef = useRef(0);

  // Force bounds refresh when group changes
  useEffect(() => {
    frameCountRef.current = 0;
  }, [group]);

  // Aggressively fit bounds for the first few frames to ensure layout is caught up
  // Use ref instead of state to avoid triggering re-renders
  useFrame(() => {
    if (frameCountRef.current < 120 && boundsRef.current) {
      boundsRef.current.refresh().fit();
      frameCountRef.current++;
    }
  });

  if (!group || !jemModel) {
    // Render a placeholder box if model failed to load
    return (
      <>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </>
    );
  }

  return (
    <>
      {/* Brighter lighting setup */}
      <ambientLight intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, 10, -10]} intensity={1.0} />
      <directionalLight position={[0, 10, 5]} intensity={1.0} />

      <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />

      {/* Bounds will auto-fit the model to the view */}
      {/* @ts-ignore - Bounds ref type definition is missing in this version of drei */}
      <Bounds ref={boundsRef} fit clip observe margin={1.2}>
        <group ref={groupRef}>
          <primitive object={group} />
        </group>
      </Bounds>

      {/* Disable autoRotate since we handle it manually */}
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
      />
    </>
  );
}

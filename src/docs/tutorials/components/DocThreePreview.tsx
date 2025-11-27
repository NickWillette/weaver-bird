import { useEffect, useMemo, useState, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  ContactShadows,
  // Environment,
  Text,
} from "@react-three/drei";
import * as THREE from "three";
import {
  loadJEM,
  addDebugVisualization,
  type JEMFile,
} from "@lib/emf/jemLoader";

interface Layer {
  jemData: JEMFile;
  textureUrl?: string;
  color?: string;
}

interface Props {
  jemData: JEMFile;
  textureUrl?: string;
  showPivots?: boolean;
  solidColor?: boolean;
  showLabels?: boolean;
  color?: string;
  extraLayers?: Layer[];
}

function DirectionalLabels() {
  return (
    <group>
      <Text
        position={[0, 0, -2.5]}
        fontSize={0.25}
        color="#3b82f6"
        anchorY="bottom"
      >
        North (-Z)
      </Text>
      <Text
        position={[0, 0, 2.5]}
        fontSize={0.25}
        color="#3b82f6"
        anchorY="top"
      >
        South (+Z)
      </Text>
      <Text
        position={[-2.5, 0, 0]}
        fontSize={0.25}
        color="#ef4444"
        anchorX="right"
      >
        West (-X)
      </Text>
      <Text
        position={[2.5, 0, 0]}
        fontSize={0.25}
        color="#ef4444"
        anchorX="left"
      >
        East (+X)
      </Text>
      <Text
        position={[0, 2.8, 0]}
        fontSize={0.25}
        color="#22c55e"
        anchorY="bottom"
      >
        Up (+Y)
      </Text>

      {/* Axis lines - X (Red) */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 5]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.6} />
      </mesh>

      {/* Axis lines - Y (Green) */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 2.5]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.6} />
      </mesh>

      {/* Axis lines - Z (Blue) */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 5]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// Separate component for textured models to avoid useLoader being called with empty string
function TexturedModel({
  jemData,
  textureUrl,
  showPivots,
  showLabels,
  color,
}: {
  jemData: JEMFile;
  textureUrl: string;
  showPivots?: boolean;
  showLabels?: boolean;
  color?: string;
}) {
  const loadedTexture = useLoader(THREE.TextureLoader, textureUrl);

  // Configure texture settings (Three.js textures are mutable by design)
  useEffect(() => {
    if (loadedTexture) {
      // eslint-disable-next-line react-hooks/immutability
      loadedTexture.magFilter = THREE.NearestFilter;
      // eslint-disable-next-line react-hooks/immutability
      loadedTexture.minFilter = THREE.NearestFilter;
      // eslint-disable-next-line react-hooks/immutability
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [loadedTexture]);

  const group = useMemo(() => {
    const modelGroup = loadJEM(jemData, loadedTexture);

    if (color) {
      modelGroup.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial
        ) {
          child.material.color.set(color);
        }
      });
    }

    if (showPivots) {
      addDebugVisualization(modelGroup);
    }

    return modelGroup;
  }, [jemData, loadedTexture, showPivots, color]);

  return (
    <group>
      <primitive object={group} />
      {showLabels && <DirectionalLabels />}
    </group>
  );
}

// Component for solid color models (no texture loading)
function SolidColorModel({
  jemData,
  showPivots,
  showLabels,
}: {
  jemData: JEMFile;
  showPivots?: boolean;
  showLabels?: boolean;
}) {
  const group = useMemo(() => {
    const modelGroup = loadJEM(jemData, null);

    modelGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0x888888,
          roughness: 0.7,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });
      }
    });

    if (showPivots) {
      addDebugVisualization(modelGroup);
    }

    return modelGroup;
  }, [jemData, showPivots]);

  return (
    <group>
      <primitive object={group} />
      {showLabels && <DirectionalLabels />}
    </group>
  );
}

export default function DocThreePreview({
  jemData,
  textureUrl,
  showPivots,
  solidColor,
  showLabels,
  color,
  extraLayers,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "200px 0px 200px 0px", threshold: 0.01 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#111",
        borderRadius: "8px",
        overflow: "hidden",
        minHeight: "300px",
        position: "relative",
      }}
    >
      {/* Corner decorations */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          width: "16px",
          height: "16px",
          borderLeft: "2px solid rgba(255, 92, 92, 0.4)",
          borderTop: "2px solid rgba(255, 92, 92, 0.4)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          right: "8px",
          width: "16px",
          height: "16px",
          borderRight: "2px solid rgba(92, 225, 230, 0.4)",
          borderBottom: "2px solid rgba(92, 225, 230, 0.4)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />

      {/* Controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          display: "flex",
          gap: "8px",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            padding: "4px 8px",
            borderRadius: "4px",
            fontFamily: "var(--docs-font-mono)",
            fontSize: "10px",
            color: "rgba(255, 255, 255, 0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Drag to rotate
        </span>
        <span
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            padding: "4px 8px",
            borderRadius: "4px",
            fontFamily: "var(--docs-font-mono)",
            fontSize: "10px",
            color: "rgba(255, 255, 255, 0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Scroll to zoom
        </span>
      </div>

      {isVisible && (
        <Canvas
          onCreated={({ gl, scene }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.2;
            scene.background = null;
          }}
          gl={{
            antialias: true,
            alpha: true,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
          <PerspectiveCamera makeDefault position={[3, 2.5, 3]} fov={45} />
          <OrbitControls
            target={[0, 0.75, 0]}
            enableDamping
            dampingFactor={0.05}
            minDistance={1.5}
            maxDistance={10}
          />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />
          <pointLight position={[0, 4, 0]} intensity={0.5} color="#5ce1e6" />

          {textureUrl && !solidColor ? (
            <TexturedModel
              jemData={jemData}
              textureUrl={textureUrl}
              showPivots={showPivots}
              showLabels={showLabels}
              color={color}
            />
          ) : (
            <SolidColorModel
              jemData={jemData}
              showPivots={showPivots}
              showLabels={showLabels}
            />
          )}

          {/* Render extra layers */}
          {extraLayers?.map((layer, index) => (
            <TexturedModel
              key={index}
              jemData={layer.jemData}
              textureUrl={layer.textureUrl || ""}
              color={layer.color}
            />
          ))}

          <ContactShadows
            opacity={0.5}
            scale={20}
            blur={2}
            far={10}
            resolution={512}
            color="#000000"
            position={[0, 0, 0]}
          />

          {/* Grid */}
          <gridHelper
            args={[20, 20, 0x333333, 0x222222]}
            position={[0, 0, 0]}
          />
        </Canvas>
      )}
    </div>
  );
}

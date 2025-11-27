import { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  parseJEM,
  type JEMFile,
  type ParsedEntityModel,
} from "@lib/emf/jemLoader";

interface Props {
  textureUrl: string;
  jemData?: JEMFile;
  showUV?: boolean;
}

interface UVBoxProps {
  position: [number, number, number];
  size: [number, number];
  color: number;
  label: string;
  faceName: string;
  onHover: (label: string | null, x: number, y: number) => void;
}

function UVBox({
  position,
  size,
  color,
  label,
  faceName,
  onHover,
}: UVBoxProps) {
  const [hovered, setHovered] = useState(false);

  const getDirectionalLabels = () => {
    const face = faceName.toLowerCase();
    if (["north", "south", "east", "west"].includes(face)) {
      return { top: "UP", bottom: "DOWN" };
    } else if (["up", "down"].includes(face)) {
      return { top: "NORTH", bottom: "SOUTH" };
    }
    return null;
  };

  const labels = getDirectionalLabels();

  return (
    <group>
      <mesh
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(label, e.clientX, e.clientY);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHover(null, 0, 0);
        }}
        onPointerMove={(e) => {
          if (hovered) onHover(label, e.clientX, e.clientY);
        }}
      >
        <planeGeometry args={size} />
        <meshBasicMaterial
          color={hovered ? 0xffffff : color}
          transparent
          opacity={hovered ? 0.6 : 0.35}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>

      {/* Border */}
      <lineSegments position={position}>
        <edgesGeometry args={[new THREE.PlaneGeometry(...size)]} />
        <lineBasicMaterial
          color={hovered ? 0xffffff : color}
          opacity={0.8}
          transparent
        />
      </lineSegments>

      {hovered && labels && (
        <>
          <Text
            position={[
              position[0],
              position[1] + size[1] / 2 + 0.08,
              position[2] + 0.02,
            ]}
            fontSize={0.08}
            color="#5ce1e6"
            anchorY="bottom"
          >
            {labels.top}
          </Text>
          <Text
            position={[
              position[0],
              position[1] - size[1] / 2 - 0.08,
              position[2] + 0.02,
            ]}
            fontSize={0.08}
            color="#5ce1e6"
            anchorY="top"
          >
            {labels.bottom}
          </Text>
        </>
      )}
    </group>
  );
}

function UVOverlay({
  entityModel,
  textureWidth,
  textureHeight,
  aspectRatio,
  onHover,
}: {
  entityModel: ParsedEntityModel;
  textureWidth: number;
  textureHeight: number;
  aspectRatio: number;
  onHover: (label: string | null, x: number, y: number) => void;
}) {
  const colors = [0xff5c5c, 0x5ce1e6, 0x8b5cf6, 0xf59e0b, 0x22c55e, 0xec4899];
  const boxes: JSX.Element[] = [];
  let colorIndex = 0;

  entityModel.parts.forEach((part) => {
    const partColor = colors[colorIndex % colors.length];
    colorIndex++;

    part.boxes.forEach((box, boxIndex) => {
      Object.entries(box.uv).forEach(([faceName, uvCoords]) => {
        if (!uvCoords || uvCoords.every((v) => v === 0)) return;
        const [u1, v1, u2, v2] = uvCoords;

        const x1 = u1 / textureWidth;
        const y1 = v1 / textureHeight;
        const x2 = u2 / textureWidth;
        const y2 = v2 / textureHeight;

        const spriteX1 = (x1 - 0.5) * 2;
        const spriteY1 = (0.5 - y1) * 2;
        const spriteX2 = (x2 - 0.5) * 2;
        const spriteY2 = (0.5 - y2) * 2;

        const width = Math.abs(spriteX2 - spriteX1);
        const height = Math.abs(spriteY2 - spriteY1);
        const centerX = (spriteX1 + spriteX2) / 2;
        const centerY = (spriteY1 + spriteY2) / 2;

        const scaledCenterX = centerX * aspectRatio;
        const scaledWidth = width * aspectRatio;

        boxes.push(
          <UVBox
            key={`${part.name}-${boxIndex}-${faceName}`}
            position={[scaledCenterX, centerY, 0.01]}
            size={[scaledWidth, height]}
            color={partColor}
            label={`${part.name} → ${faceName}`}
            faceName={faceName}
            onHover={onHover}
          />,
        );
      });
    });
  });

  return <group>{boxes}</group>;
}

function TextureSprite({
  textureUrl,
  onLoaded,
}: {
  textureUrl: string;
  onLoaded: (w: number, h: number) => void;
}) {
  const texture = useLoader(THREE.TextureLoader, textureUrl);

  // Configure texture settings (Three.js textures are mutable by design)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    texture.magFilter = THREE.NearestFilter;
     
    texture.minFilter = THREE.NearestFilter;
     
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  useEffect(() => {
    if (texture.image) {
      onLoaded(texture.image.width, texture.image.height);
    }
  }, [texture, onLoaded]);

  const aspectRatio = texture.image
    ? texture.image.width / texture.image.height
    : 1;
  const width = aspectRatio >= 1 ? aspectRatio * 2 : 2;
  const height = aspectRatio >= 1 ? 2 : 2 / aspectRatio;

  return (
    <mesh scale={[width, height, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function Checkerboard() {
  const texture = useMemo(() => {
    const size = 32;
    const data = new Uint8Array(size * size * 4);

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4;
        const isLight = (i + j) % 2 === 0;
        const value = isLight ? 40 : 30;
        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
        data[idx + 3] = 255;
      }
    }

    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh position={[0, 0, -0.1]}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export default function DocTexturePreview({
  textureUrl,
  jemData,
  showUV,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [tooltip, setTooltip] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);

  const entityModel = useMemo(() => {
    if (jemData) return parseJEM(jemData);
    return null;
  }, [jemData]);

  const aspectRatio = dims.h ? dims.w / dims.h : 1;

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
        minHeight: "300px",
        background: "linear-gradient(180deg, #1a1f2e 0%, #12151c 100%)",
        borderRadius: "var(--docs-radius-md)",
        overflow: "hidden",
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
          borderLeft: "2px solid rgba(139, 92, 246, 0.4)",
          borderTop: "2px solid rgba(139, 92, 246, 0.4)",
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

      {/* Label */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          padding: "4px 10px",
          borderRadius: "4px",
          fontFamily: "var(--docs-font-mono)",
          fontSize: "10px",
          color: "rgba(255, 255, 255, 0.6)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {dims.w}×{dims.h}px
      </div>

      {/* Help text */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          padding: "4px 8px",
          borderRadius: "4px",
          fontFamily: "var(--docs-font-mono)",
          fontSize: "10px",
          color: "rgba(255, 255, 255, 0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        Hover UV regions
      </div>

      {isVisible && (
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 2.5]} />
          <OrbitControls
            enableRotate={false}
            enableDamping
            dampingFactor={0.1}
            minDistance={1}
            maxDistance={5}
          />
          <ambientLight intensity={1} />
          <Checkerboard />
          <TextureSprite
            textureUrl={textureUrl}
            onLoaded={(w, h) => setDims({ w, h })}
          />

          {showUV && entityModel && dims.w > 0 && (
            <UVOverlay
              entityModel={entityModel}
              textureWidth={dims.w}
              textureHeight={dims.h}
              aspectRatio={aspectRatio}
              onHover={(l, x, y) =>
                l ? setTooltip({ label: l, x, y }) : setTooltip(null)
              }
            />
          )}
        </Canvas>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            background: "rgba(18, 21, 28, 0.95)",
            backdropFilter: "blur(8px)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "var(--docs-radius-sm)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            pointerEvents: "none",
            fontSize: "13px",
            fontFamily: "var(--docs-font-mono)",
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
          }}
        >
          <span style={{ color: "var(--docs-accent)" }}>
            {tooltip.label.split(" → ")[0]}
          </span>
          <span style={{ color: "var(--docs-text-muted)" }}> → </span>
          <span style={{ color: "var(--docs-accent-secondary)" }}>
            {tooltip.label.split(" → ")[1]}
          </span>
        </div>
      )}
    </div>
  );
}

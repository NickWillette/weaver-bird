import { useState } from "react";
import type { Block2DProps } from "./types";
import s from "../../styles.module.scss";

export const Block2D = ({ textureUrl, alt, size, onError }: Block2DProps) => {
  const [frameCount, setFrameCount] = useState<number>(1);

  // Check animation when image loads
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const width = img.naturalWidth;
    const height = img.naturalHeight;

    // Check if animated: height > width and evenly divisible
    if (height > width && height % width === 0) {
      const frames = height / width;
      console.log(
        `[Block2D] Animated texture detected: ${frames} frames (${width}x${height})`,
      );
      setFrameCount(frames);
    }
  };

  // For animated textures (frameCount > 1), we need an inner wrapper to properly crop
  if (frameCount > 1) {
    return (
      <div className={s.blockContainer} style={{ width: size, height: size }}>
        <div
          style={{
            width: "70%",
            height: "70%",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <img
            src={textureUrl}
            alt={alt}
            style={{
              width: "100%",
              height: `${100 / frameCount}%`,
              objectFit: "none",
              objectPosition: "center top",
              imageRendering: "pixelated",
            }}
            onLoad={handleImageLoad}
            onError={() => {
              onError?.();
            }}
            draggable={false}
          />
        </div>
      </div>
    );
  }

  // Non-animated textures use the standard rendering
  return (
    <div className={s.blockContainer} style={{ width: size, height: size }}>
      <img
        src={textureUrl}
        alt={alt}
        className={s.fallbackTexture}
        onLoad={handleImageLoad}
        onError={() => {
          onError?.();
        }}
        draggable={false}
      />
    </div>
  );
};

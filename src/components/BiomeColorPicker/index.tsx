import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getBiomesWithCoords, type BiomeData } from "./biomeData";
import s from "./styles.module.scss";

interface Props {
  type: "grass" | "foliage";
  onColorSelect: (color: { r: number; g: number; b: number }) => void;
}

export default function BiomeColorPicker({ type, onColorSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colormapSrc, setColormapSrc] = useState<string>("");
  const [selectedBiome, setSelectedBiome] = useState<string | null>(null);
  const [hoveredBiome, setHoveredBiome] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);

  // Load the colormap image
  useEffect(() => {
    async function loadColormap() {
      try {
        const path = await invoke<string>("get_colormap_path", {
          colormapType: type,
        });
        const url = convertFileSrc(path);
        setColormapSrc(url);
      } catch (error) {
        console.error(`Failed to load ${type} colormap:`, error);
      }
    }

    loadColormap();
  }, [type]);

  // Draw the colormap image to canvas and extract image data
  useEffect(() => {
    if (!colormapSrc || !canvasRef.current) {
      console.log("[BiomeColorPicker] Waiting for colormap or canvas:", {
        colormapSrc,
        hasCanvas: !!canvasRef.current,
      });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    console.log("[BiomeColorPicker] Loading colormap image:", colormapSrc);
    const img = new Image();
    img.onload = () => {
      console.log(
        "[BiomeColorPicker] Image loaded, size:",
        img.width,
        "x",
        img.height,
      );
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Extract pixel data for color sampling
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setImageData(data);
      console.log(
        "[BiomeColorPicker] Image data extracted, ready for sampling",
      );
    };
    img.onerror = (error) => {
      console.error("[BiomeColorPicker] Failed to load image:", error);
    };
    img.src = colormapSrc;
  }, [colormapSrc]);

  // Handle canvas click to sample color
  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    console.log("[BiomeColorPicker] Canvas clicked");
    if (!imageData || !canvasRef.current) {
      console.log("[BiomeColorPicker] Click ignored - no image data or canvas");
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Get click coordinates relative to canvas
    const x = Math.floor(
      ((event.clientX - rect.left) / rect.width) * canvas.width,
    );
    const y = Math.floor(
      ((event.clientY - rect.top) / rect.height) * canvas.height,
    );
    console.log("[BiomeColorPicker] Click at pixel:", x, y);

    // Sample color at clicked position
    const color = sampleColor(x, y);
    if (color) {
      console.log("[BiomeColorPicker] Sampled color:", color);
      onColorSelect(color);
      setSelectedBiome(null); // Clear biome selection when manually clicking
    }
  }

  // Sample color from image data at given coordinates
  function sampleColor(
    x: number,
    y: number,
  ): { r: number; g: number; b: number } | null {
    if (!imageData) return null;

    const index = (y * imageData.width + x) * 4;
    return {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
    };
  }

  // Handle biome hotspot selection
  function handleBiomeSelect(biome: BiomeData, x: number, y: number) {
    setSelectedBiome(biome.id);

    // In canvas coordinates, Y is flipped (0 is top)
    // But our biome data has Y from bottom, so flip it
    const canvasY = imageData ? imageData.height - 1 - y : 255 - y;

    const color = sampleColor(x, canvasY);
    if (color) {
      onColorSelect(color);
    }
  }

  const biomesWithCoords = getBiomesWithCoords();

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h3>Biome Color</h3>
        <p>Select a biome or click anywhere on the map</p>
      </div>

      <div className={s.content}>
        {/* Colormap canvas */}
        <div className={s.canvasContainer}>
          <canvas
            ref={canvasRef}
            className={s.canvas}
            onClick={handleCanvasClick}
          />

          {/* Biome hotspots overlay */}
          {imageData && (
            <div className={s.hotspots}>
              {biomesWithCoords.map((biome) => {
                // Convert to percentage for CSS positioning
                // Y needs to be flipped since CSS top:0 is at top but our data is from bottom
                const leftPercent = (biome.x / 255) * 100;
                const topPercent = ((255 - biome.y) / 255) * 100;

                const isSelected = selectedBiome === biome.id;
                const isHovered = hoveredBiome === biome.id;

                return (
                  <button
                    key={biome.id}
                    className={`${s.hotspot} ${isSelected ? s.selected : ""} ${isHovered ? s.hovered : ""}`}
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                    }}
                    onClick={() => handleBiomeSelect(biome, biome.x, biome.y)}
                    onMouseEnter={() => setHoveredBiome(biome.id)}
                    onMouseLeave={() => setHoveredBiome(null)}
                    title={biome.name}
                  >
                    <span className={s.dot} />
                    {isHovered && (
                      <span className={s.tooltip}>{biome.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Canvas Settings Component
 *
 * Displays canvas-specific settings that change based on the active canvas mode:
 * - 3D: Floor grid toggle
 * - 2D: Pixel grid toggle
 * - Item: Grid, rotation, and hover animation toggles
 */

import { useStore } from "@state/store";
import { Canvas3DSettings } from "./components/Canvas3DSettings";
import { Canvas2DSettings } from "./components/Canvas2DSettings";
import { CanvasItemSettings } from "./components/CanvasItemSettings";
import s from "./styles.module.scss";

export const CanvasSettings = () => {
  const canvasRenderMode = useStore((state) => state.canvasRenderMode);

  return (
    <div className={s.root}>
      {canvasRenderMode === "3D" && <Canvas3DSettings />}
      {canvasRenderMode === "2D" && <Canvas2DSettings />}
      {canvasRenderMode === "Item" && <CanvasItemSettings />}
    </div>
  );
};

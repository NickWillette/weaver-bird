import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
import s from "./ResizeHandle.module.scss";

export const ResizeHandle = () => {
  const isResizingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });

  const handleMouseDown = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const appWindow = getCurrentWindow();

      // Try the native method first
      try {
        await appWindow.startResizeDragging("SouthEast");
        return;
      } catch (nativeError) {
        // Native resize dragging failed, fall back to manual implementation
      }

      // Fallback: manual resize implementation for transparent windows on macOS
      isResizingRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      const size = await appWindow.innerSize();
      startSizeRef.current = { width: size.width, height: size.height };
    } catch (error) {
      console.error("Failed to start resize:", error);
    }
  };

  useEffect(() => {
    const handleMouseMove = async (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;

      const newWidth = Math.max(400, startSizeRef.current.width + deltaX);
      const newHeight = Math.max(300, startSizeRef.current.height + deltaY);

      try {
        const appWindow = getCurrentWindow();
        await appWindow.setSize(new LogicalSize(newWidth, newHeight));
      } catch (error) {
        console.error("Failed to resize window:", error);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      className={s.resizeHandle}
      onMouseDown={handleMouseDown}
      aria-label="Resize window"
      title="Resize window"
      style={{ pointerEvents: "auto" }}
    >
      <div className={s.resizeIndicator}>
        <span className={s.gripLine}></span>
        <span className={s.gripLine}></span>
        <span className={s.gripLine}></span>
      </div>
    </div>
  );
};

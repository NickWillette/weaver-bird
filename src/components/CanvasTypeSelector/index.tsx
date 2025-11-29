import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { useStore } from "@state/store";
import { useElementPosition } from "./hooks/useElementPosition";
import type { CanvasTypeSelectorProps, CanvasRenderMode } from "./types";
import styles from "./styles.module.scss";

export const CanvasTypeSelector: React.FC<CanvasTypeSelectorProps> = ({
  disabled2D = false,
  disabled3D = false,
  disabledItem = false,
  targetRef,
}) => {
  const canvasRenderMode = useStore((state) => state.canvasRenderMode);
  const setCanvasRenderMode = useStore((state) => state.setCanvasRenderMode);
  const position = useElementPosition(targetRef);

  return (
    <div
      className={styles.canvasTypeSelector}
      style={{
        left: `${position.left + position.width / 2}px`,
        top: `${position.top}px`,
      }}
    >
      <Tabs
        value={canvasRenderMode}
        onValueChange={(value) =>
          setCanvasRenderMode(value as CanvasRenderMode)
        }
      >
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="3D" disabled={disabled3D}>
            3D
          </TabsTrigger>
          <TabsTrigger value="2D" disabled={disabled2D}>
            2D
          </TabsTrigger>
          <TabsTrigger value="Item" disabled={disabledItem}>
            Item
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

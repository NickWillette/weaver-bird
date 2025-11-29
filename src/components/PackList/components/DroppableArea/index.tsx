import { useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";
import type { DroppableAreaProps } from "./types";

export const DroppableArea = ({ id, children }: DroppableAreaProps) => {
    const { isDropTarget, ref } = useDroppable({
        id,
        type: "column",
        accept: ["pack"],
        collisionPriority: CollisionPriority.Low,
    });

    return <>{children({ isDropTarget, setNodeRef: ref })}</>;
};

import type { PackItem, PackContainer } from "../../types";

export interface SortablePackItemProps {
    item: PackItem;
    containerId: PackContainer;
    index: number;
    isDraggable?: boolean;
    actionLabel: string;
    actionIcon: string;
    onActionClick?: () => void;
}

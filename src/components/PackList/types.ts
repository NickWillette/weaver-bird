import type { DragDropEvents } from "@dnd-kit/react";

export interface PackItem {
    id: string;
    name: string;
    size: number;
    description?: string;
    icon_data?: string;
}

export interface PackListProps {
    packs: PackItem[];
    disabledPacks?: PackItem[];
    onReorder?: (order: string[]) => void;
    onReorderDisabled?: (order: string[]) => void;
    onDisable?: (packId: string, targetIndex?: number) => void;
    onEnable?: (packId: string, targetIndex?: number) => void;
    onBrowse?: () => void;
    packsDir?: string;
    selectedLauncher?: import("@/state/types").LauncherInfo;
    availableLaunchers?: import("@/state/types").LauncherInfo[];
    onLauncherChange?: (launcher: import("@/state/types").LauncherInfo) => void;
}

export type PackContainer = "enabled" | "disabled";
export type PreviewState = Record<PackContainer, string[]>;

export type DragStartEventType = Parameters<DragDropEvents["dragstart"]>[0];
export type DragOverEventType = Parameters<DragDropEvents["dragover"]>[0];
export type DragEndEventType = Parameters<DragDropEvents["dragend"]>[0];
export type MoveEvent = DragOverEventType | DragEndEventType;

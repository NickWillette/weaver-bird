import type { ReactNode } from "react";

export interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    minecraftTab: ReactNode;
    vanillaVersionTab: ReactNode;
    targetVersionTab: ReactNode;
}

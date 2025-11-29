import type { LauncherInfo } from "@/state/types";

export interface LauncherSelectorProps {
    selectedLauncher?: LauncherInfo;
    availableLaunchers: LauncherInfo[];
    onLauncherChange: (launcher: LauncherInfo) => void;
}

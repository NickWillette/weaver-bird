import type { ColormapSourceOption } from "../../types";

export interface ColorSourceDropdownProps {
    sourceOptions: ColormapSourceOption[];
    selectedSource: ColormapSourceOption | null;
    isAutoSelected: boolean;
    onSourceSelect: (optionId: string) => void;
}

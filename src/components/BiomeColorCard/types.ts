export interface ColormapSourceOption {
    id: string;
    assetId: string;
    packId: string;
    packName: string;
    label: string;
    variantLabel?: string | null;
    relativePath: string;
    order: number;
}

export interface BiomeColorCardProps {
    assetId: string;
    type: "grass" | "foliage";
    onColorSelect?: (color: { r: number; g: number; b: number }) => void;
    showSourceSelector?: boolean;
    readOnly?: boolean;
    accent?: "emerald" | "gold" | "berry";
    /**
     * Whether to update global colormap coordinates when clicking
     * - true: Updates global state (affects all tinted blocks) - used in Settings
     * - false: Only calls onColorSelect callback (temporary override) - used in 3D preview
     * @default true
     */
    updateGlobalState?: boolean;
}

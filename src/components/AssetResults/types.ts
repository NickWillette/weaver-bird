export interface AssetItem {
    id: string;
    name: string;
}

export interface Props {
    assets: AssetItem[];
    selectedId?: string;
    onSelect: (id: string) => void;
    totalItems?: number; // Total count before pagination (for display)
    displayRange?: { start: number; end: number }; // Range being displayed
}

export interface AssetCardProps {
    asset: AssetItem;
    isSelected: boolean;
    onSelect: () => void;
    variantCount?: number; // Number of variants if this is a grouped asset
    staggerIndex?: number; // Index for staggering 3D model loading
}

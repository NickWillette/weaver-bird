export interface AssetCardProps {
    asset: {
        id: string;
        name: string;
    };
    isSelected: boolean;
    onSelect: () => void;
    variantCount?: number; // Number of variants if this is a grouped asset
    staggerIndex?: number; // Index for staggering 3D model loading
}

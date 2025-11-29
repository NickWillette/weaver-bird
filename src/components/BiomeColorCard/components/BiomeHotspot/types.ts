import type { BiomeData } from "@/components/BiomeColorCard/biomeData";

export interface BiomeHotspotProps {
    biomes: Array<BiomeData & { x: number; y: number }>;
    x: number;
    y: number;
    maxX: number;
    maxY: number;
    isSelected: boolean;
    isHovered: boolean;
    onSelect: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    readOnly: boolean;
}

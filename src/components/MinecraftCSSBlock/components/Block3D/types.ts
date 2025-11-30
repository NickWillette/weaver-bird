import type { RenderedFace } from "../../types";
import type { TintColor } from "@lib/textureColorization";

export interface Block3DProps {
    faces: RenderedFace[];
    tintedTextures: Map<string, string>;
    foliageColor: TintColor;
    alt: string;
    size: number;
    onError?: () => void;
}

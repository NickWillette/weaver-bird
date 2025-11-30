export interface ProgressPayload {
    current: number;
    total: number;
}

export interface VanillaTextureProgressProps {
    progress: ProgressPayload | null;
    isVisible: boolean;
}

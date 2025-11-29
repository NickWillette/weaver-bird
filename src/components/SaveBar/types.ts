import type { OverrideWirePayload } from "@state";

export interface Progress {
    phase: string;
    completed: number;
    total: number;
    bytes?: number;
}

export type StatusType = "idle" | "success" | "error";

export interface SaveBarProps {
    isLoading?: boolean;
    progress?: Progress;
    disabled?: boolean;
    packsDir?: string;
    packOrder: string[];
    overrides: Record<string, OverrideWirePayload>;
    outputDir?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
    statusMessage?: string;
    statusType?: StatusType;
    onClearStatus?: () => void;
}

import { useCallback } from "react";
import { buildWeaverNest, formatError } from "@lib/tauri";
import type { OverrideWirePayload, PackMeta } from "@state";
import Button from "@/ui/components/buttons/Button";
import { BIOMES } from "@components/BiomeColorPicker/biomeData";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/ui/components/Tooltip/Tooltip";
import s from "./styles.module.scss";

interface Progress {
  phase: string;
  completed: number;
  total: number;
  bytes?: number;
}

type StatusType = "idle" | "success" | "error";

interface Props {
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
  grassColormapUrl?: string;
  grassColormapPackId?: string;
  foliageColormapUrl?: string;
  foliageColormapPackId?: string;
  selectedBiomeId?: string;
  packs: PackMeta[];
}

/**
 * Get pack display name from pack ID
 */
function getPackName(packId: string | undefined, packs: PackMeta[]): string {
  if (!packId) return "None";

  // Handle vanilla pack specially
  if (packId === "minecraft:vanilla") {
    return "Vanilla";
  }

  // Find pack in packs array
  const pack = packs.find((p) => p.id === packId);
  return pack ? pack.name : packId.replace(/_/g, " ");
}

/**
 * Get biome display name from biome ID
 */
function getBiomeName(biomeId?: string): string {
  if (!biomeId) return "None";

  const biome = BIOMES.find((b) => b.id === biomeId);
  return biome ? biome.name : biomeId;
}

const SaveIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export default function SaveBar({
  isLoading = false,
  progress,
  disabled = false,
  packsDir = "",
  packOrder,
  overrides,
  outputDir = "",
  onSuccess,
  onError,
  statusMessage,
  statusType = "idle",
  onClearStatus,
  grassColormapUrl,
  grassColormapPackId,
  foliageColormapUrl,
  foliageColormapPackId,
  selectedBiomeId,
  packs,
}: Props) {
  const percent = progress
    ? Math.round((progress.completed / Math.max(progress.total, 1)) * 100)
    : 0;

  const handleSave = useCallback(async () => {
    if (!packsDir || !outputDir) {
      onError?.("Please select both packs folder and output directory");
      return;
    }

    try {
      const result = await buildWeaverNest({
        packsDir,
        packOrder,
        overrides,
        outputDir,
      });
      console.warn("Save result:", result);
      onSuccess?.();
    } catch (error) {
      const errorMessage = formatError(error);
      console.error("Failed to save:", error);
      onError?.(errorMessage);
    }
  }, [packsDir, packOrder, overrides, outputDir, onSuccess, onError]);

  return (
    <div className={s.root}>
      <Button
        className={s.button}
        onClick={handleSave}
        disabled={isLoading || disabled}
        variant="primary"
        size="md"
        renderIcon={() => <SaveIcon />}
        iconLocation="leading"
      >
        {isLoading ? "Saving..." : "Save"}
      </Button>

      <div className={s.statusArea}>
        {progress ? (
          <div className={s.progress}>
            <div className={s.progressBar}>
              <div className={s.fill} style={{ width: `${percent}%` }} />
            </div>
            <span className={s.progressText}>
              {progress.phase} {progress.completed}/{progress.total}
              {progress.bytes &&
                ` (${(progress.bytes / 1024 / 1024).toFixed(1)} MB)`}
            </span>
          </div>
        ) : statusMessage ? (
          <div className={s.status} data-type={statusType}>
            <span className={s.statusText}>{statusMessage}</span>
            {onClearStatus && (
              <button
                className={s.clearButton}
                onClick={onClearStatus}
                aria-label="Clear status"
              >
                ×
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div className={s.info}>
        <div className={s.infoItem}>
          <span className={s.infoLabel}>Foliage:</span>
          {foliageColormapUrl ? (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <span className={s.infoValue}>
                  {getPackName(foliageColormapPackId, packs)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <div className={s.colormapPreview}>
                  <img
                    src={foliageColormapUrl}
                    alt="Foliage colormap"
                    className={s.colormapImage}
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className={s.infoValue}>
              {getPackName(foliageColormapPackId, packs)}
            </span>
          )}
        </div>
        <div className={s.infoItem}>
          <span className={s.infoLabel}>Grass:</span>
          {grassColormapUrl ? (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <span className={s.infoValue}>
                  {getPackName(grassColormapPackId, packs)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <div className={s.colormapPreview}>
                  <img
                    src={grassColormapUrl}
                    alt="Grass colormap"
                    className={s.colormapImage}
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className={s.infoValue}>
              {getPackName(grassColormapPackId, packs)}
            </span>
          )}
        </div>
        <div className={s.infoItem}>
          <span className={s.infoLabel}>Biome:</span>
          <span className={s.infoValue}>{getBiomeName(selectedBiomeId)}</span>
        </div>
      </div>
    </div>
  );
}

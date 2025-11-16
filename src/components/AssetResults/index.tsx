import { useEffect, useState, useRef, useMemo } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getVanillaTexturePath, getPackTexturePath } from "@lib/tauri";
import {
  beautifyAssetName,
  groupAssetsByVariant,
  normalizeAssetId,
} from "@lib/assetUtils";
import {
  useSelectWinner,
  useSelectIsPenciled,
  useSelectPack,
} from "@state/selectors";
import s from "./styles.module.scss";

interface AssetItem {
  id: string;
  name: string;
}

interface Props {
  assets: AssetItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

interface AssetCardProps {
  asset: AssetItem;
  isSelected: boolean;
  onSelect: () => void;
  variantCount?: number; // Number of variants if this is a grouped asset
}

function AssetCard({
  asset,
  isSelected,
  onSelect,
  variantCount,
}: AssetCardProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get the winning pack for this asset
  const winnerPackId = useSelectWinner(asset.id);
  const isPenciled = useSelectIsPenciled(asset.id);
  const winnerPack = useSelectPack(winnerPackId || "");

  // Intersection Observer to detect visibility
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing (lazy load only once)
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }, // Start loading 200px before visible
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Only load image when visible
  useEffect(() => {
    if (!isVisible) return;

    let mounted = true;

    const loadImage = async () => {
      try {
        let texturePath: string;
        // Normalize asset ID to fix trailing underscores and other issues
        const normalizedAssetId = normalizeAssetId(asset.id);

        // Priority: 1. Pack texture (if exists), 2. Vanilla texture (fallback)
        if (winnerPackId && winnerPack) {
          try {
            // Try to load from the winning pack
            texturePath = await getPackTexturePath(
              winnerPack.path,
              normalizedAssetId,
              winnerPack.is_zip,
            );
          } catch (error) {
            // If pack texture fails, fall back to vanilla
            console.warn(
              `Pack texture not found for ${normalizedAssetId}, using vanilla.`,
            );
            texturePath = await getVanillaTexturePath(normalizedAssetId);
          }
        } else {
          // No pack provides this texture, use vanilla
          texturePath = await getVanillaTexturePath(normalizedAssetId);
        }

        if (mounted) {
          // Convert file path to Tauri asset URL
          const assetUrl = convertFileSrc(texturePath);
          setImageSrc(assetUrl);
          setImageError(false);
        }
      } catch (error) {
        if (mounted) {
          setImageError(true);
          console.warn(`Failed to load texture for ${asset.id}:`, error);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [isVisible, asset.id, winnerPackId, winnerPack]);

  const displayName = beautifyAssetName(asset.id);

  return (
    <div
      ref={cardRef}
      className={`${s.card} ${isSelected ? s.selected : ""}`}
      onClick={onSelect}
    >
      <div className={s.imageContainer}>
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt={displayName}
            className={s.texture}
            onError={() => setImageError(true)}
          />
        ) : imageError ? (
          <div className={s.placeholder}>
            <span className={s.placeholderIcon}>🎨</span>
          </div>
        ) : (
          <div className={s.placeholder}>
            <span className={s.placeholderIcon}>⏳</span>
          </div>
        )}
        {isPenciled && (
          <div
            className={s.penciledIndicator}
            title="Manually selected texture"
          >
            ✏️
          </div>
        )}
        {variantCount && variantCount > 1 && (
          <div className={s.variantBadge} title={`${variantCount} variants`}>
            {variantCount}
          </div>
        )}
      </div>
      <div className={s.assetName}>{displayName}</div>
    </div>
  );
}

export default function AssetResults({ assets, selectedId, onSelect }: Props) {
  // Group assets by variant
  const groupedAssets = useMemo(() => {
    const assetIds = assets.map((a) => a.id);
    const groups = groupAssetsByVariant(assetIds);

    // Create a map for quick lookup of variant counts
    const variantCountMap = new Map<string, number>();
    groups.forEach((group) => {
      group.variantIds.forEach((id) => {
        variantCountMap.set(id, group.variantIds.length);
      });
    });

    // Return only the base asset from each group (first variant)
    const displayAssets = groups.map((group) => ({
      id: group.variantIds[0], // Use the first variant as the display asset
      name: assets.find((a) => a.id === group.variantIds[0])?.name || "",
      variantCount: group.variantIds.length,
      allVariants: group.variantIds,
    }));

    return displayAssets;
  }, [assets]);

  console.log(
    "[AssetResults] Rendering",
    assets.length,
    "assets (",
    groupedAssets.length,
    "groups) with lazy loading",
  );

  if (assets.length === 0) {
    return (
      <div className={s.root}>
        <div className={s.emptyState}>
          No assets found. Try searching for a block or texture.
        </div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.results}>
        {groupedAssets.map((group) => (
          <AssetCard
            key={group.id}
            asset={{ id: group.id, name: group.name }}
            isSelected={
              selectedId === group.id ||
              group.allVariants.includes(selectedId || "")
            }
            onSelect={() => onSelect(group.id)}
            variantCount={group.variantCount}
          />
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useStore } from "@/state/store";
import s from "./styles.module.scss";

/**
 * Represents a pack variant option with UI state
 * (distinct from the domain model Provider type)
 */
interface ProviderOption {
  packId: string;
  packName: string;
  isPenciled?: boolean;
  isWinner?: boolean;
}

interface Props {
  providers: ProviderOption[];
  onSelectProvider: (packId: string) => void;
  assetId?: string;
}

export default function VariantChooser({
  providers,
  onSelectProvider,
  assetId,
}: Props) {
  const packs = useStore((state) => state.packs);
  const [textureUrls, setTextureUrls] = useState<Record<string, string>>({});
  const [loadingTextures, setLoadingTextures] = useState<Record<string, boolean>>({});

  // Load texture URLs for each provider
  useEffect(() => {
    if (!assetId || providers.length === 0) return;

    const loadTextureUrls = async () => {
      const newUrls: Record<string, string> = {};
      const newLoading: Record<string, boolean> = {};

      // Mark all as loading
      for (const provider of providers) {
        newLoading[provider.packId] = true;
      }
      setLoadingTextures(newLoading);

      // Load texture URLs in parallel
      await Promise.all(
        providers.map(async (provider) => {
          const pack = packs[provider.packId];
          if (!pack) return;

          try {
            const texturePath = await invoke<string>("get_pack_texture_path", {
              packPath: pack.path,
              assetId: assetId,
              isZip: pack.is_zip,
            });
            newUrls[provider.packId] = convertFileSrc(texturePath);
          } catch (error) {
            console.error(`Failed to load texture for ${provider.packId}:`, error);
          }
        })
      );

      setTextureUrls(newUrls);
      setLoadingTextures({});
    };

    loadTextureUrls();
  }, [assetId, providers, packs]);

  if (!assetId || providers.length === 0) {
    return (
      <div className={s.root}>
        <h3 className={s.header}>Variants</h3>
        <div className={s.emptyState}>
          {!assetId
            ? "Select an asset to see available variants"
            : "No variants available"}
        </div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.providers}>
        {providers.map((provider) => (
          <div
            key={provider.packId}
            className={`${s.provider} ${provider.isWinner ? s.winner : ""} ${
              provider.isPenciled ? s.penciled : ""
            }`}
            onClick={() => onSelectProvider(provider.packId)}
            title="Click to select this texture variant"
          >
            <div className={s.texturePreview}>
              {loadingTextures[provider.packId] ? (
                <div className={s.texturePlaceholder} />
              ) : textureUrls[provider.packId] ? (
                <img
                  src={textureUrls[provider.packId]}
                  alt={`${provider.packName} texture`}
                  className={s.textureIcon}
                />
              ) : (
                <div className={s.texturePlaceholder} />
              )}
            </div>
            <div className={s.providerInfo}>
              <div className={s.providerName}>
                {provider.packName}
                {provider.isPenciled && (
                  <span className={`${s.badge} ${s.pencilBadge}`}>Override</span>
                )}
                {provider.isWinner && !provider.isPenciled && (
                  <span className={s.badge}>Active</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

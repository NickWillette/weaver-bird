import type { AssetId } from "@state";

export type EntityFeatureControl =
  | {
      kind: "toggle";
      id: string;
      label: string;
      defaultValue: boolean;
      description?: string;
    }
  | {
      kind: "select";
      id: string;
      label: string;
      defaultValue: string;
      options: Array<{ value: string; label: string }>;
      description?: string;
    };

export type EntityLayerKind = "cloneTexture" | "cemModel";

export type EntityLayerBlend = "normal" | "additive";

export type EntityLayerMaterialMode =
  | { kind: "default" }
  /**
   * Color multiplier in sRGB space (0..1), matching Minecraft's
   * `DyeColor#getTextureDiffuseColors` constants.
   *
   * Three.js PBR materials expect linear color values, so the renderer must
   * convert this to linear before applying it to `material.color`.
   */
  | { kind: "tint"; color: { r: number; g: number; b: number } }
  | { kind: "emissive"; intensity?: number };

export interface EntityLayerDefinitionBase {
  id: string;
  label: string;
  kind: EntityLayerKind;
  blend: EntityLayerBlend;
  /**
   * Higher values render later (in front).
   * Used to avoid z-fighting and preserve expected compositing order.
   */
  zIndex: number;
  /**
   * Opacity multiplier for the overlay material (0..1).
   */
  opacity?: number;
  materialMode?: EntityLayerMaterialMode;
}

export interface EntityCloneTextureLayerDefinition
  extends EntityLayerDefinitionBase {
  kind: "cloneTexture";
  textureAssetId: AssetId;
}

export interface EntityCemModelLayerDefinition
  extends EntityLayerDefinitionBase {
  kind: "cemModel";
  /**
   * JEM entity type candidates to try (e.g. ["sheep_wool", "sheep_fur"]).
   * The loader attempts each candidate in pack-priority order and falls back
   * to vanilla mocks when available.
   */
  cemEntityTypeCandidates: string[];
  textureAssetId: AssetId;
}

export type EntityLayerDefinition =
  | EntityCloneTextureLayerDefinition
  | EntityCemModelLayerDefinition;

export interface EntityCompositeSchema {
  baseAssetId: AssetId;
  entityRoot: string;
  controls: EntityFeatureControl[];
  /**
   * Returns the layers to render for the current feature state.
   */
  getActiveLayers: (state: EntityFeatureStateView) => EntityLayerDefinition[];
}

export interface EntityFeatureStateView {
  toggles: Record<string, boolean | undefined>;
  selects: Record<string, string | undefined>;
}

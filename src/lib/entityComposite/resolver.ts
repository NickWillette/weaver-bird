import type { AssetId } from "@state";
import { DYE_COLORS, getDyeRgb } from "./dyeColors";
import type {
  EntityCompositeSchema,
  EntityFeatureControl,
  EntityFeatureStateView,
  EntityLayerDefinition,
} from "./types";
import { getLikelyBaseEntityAssetIdForLayer } from "./layerDetection";

function stripNamespace(assetId: AssetId): string {
  const idx = assetId.indexOf(":");
  return idx >= 0 ? assetId.slice(idx + 1) : assetId;
}

function getEntityPath(assetId: AssetId): string | null {
  const path = stripNamespace(assetId);
  if (!path.startsWith("entity/")) return null;
  return path.slice("entity/".length);
}

function getEntityRoot(entityPath: string): string {
  return entityPath.split("/")[0] ?? entityPath;
}

function getDirAndLeaf(entityPath: string): { dir: string; leaf: string } {
  const parts = entityPath.split("/");
  const leaf = parts[parts.length - 1] ?? entityPath;
  const dir = parts.slice(0, -1).join("/");
  return { dir, leaf };
}

function stableUnique(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function getToggle(state: EntityFeatureStateView, id: string, def: boolean) {
  return state.toggles[id] ?? def;
}

function getSelect(state: EntityFeatureStateView, id: string, def: string) {
  return state.selects[id] ?? def;
}

function findAssetId(
  ns: string,
  pathCandidates: string[],
  all: Set<AssetId>,
): AssetId | null {
  for (const path of pathCandidates) {
    const id = `${ns}:${path}` as AssetId;
    if (all.has(id)) return id;
  }
  return null;
}

function makeVillagerSelect(
  all: Set<AssetId>,
  ns: string,
  prefix: string,
  label: string,
  id: string,
  defaultValue: string,
  labelForValue?: (value: string) => string,
): EntityFeatureControl | null {
  const options: Array<{ value: string; label: string }> = [{ value: "none", label: "None" }];
  const values: string[] = [];
  for (const assetId of all) {
    if (!assetId.startsWith(`${ns}:${prefix}`)) continue;
    const path = stripNamespace(assetId);
    const leaf = path.split("/").pop();
    if (!leaf) continue;
    values.push(leaf);
  }
  for (const v of stableUnique(values)) {
    options.push({
      value: v,
      label:
        labelForValue?.(v) ??
        v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
    });
  }
  if (options.length <= 1) return null;
  const hasDefault = options.some((o) => o.value === defaultValue);
  return {
    kind: "select",
    id,
    label,
    defaultValue: hasDefault ? defaultValue : options[1]?.value ?? "none",
    options,
  };
}

export function resolveEntityCompositeSchema(
  selectedAssetId: AssetId,
  allAssetIds: AssetId[],
): EntityCompositeSchema | null {
  const all = new Set(allAssetIds);
  const baseFromLayer = getLikelyBaseEntityAssetIdForLayer(
    selectedAssetId,
    allAssetIds,
  );
  const baseAssetId = baseFromLayer ?? selectedAssetId;

  const entityPath = getEntityPath(baseAssetId);
  if (!entityPath) return null;

  const ns = baseAssetId.includes(":") ? baseAssetId.split(":")[0] : "minecraft";
  const folderRoot = getEntityRoot(entityPath);
  const { dir, leaf } = getDirAndLeaf(entityPath);
  const entityType = leaf;

  const controls: EntityFeatureControl[] = [];

  // -----------------------------------------------------------------------
  // Glowing eyes (generic `_eyes` overlay in same folder)
  // -----------------------------------------------------------------------
  const eyesTexture = findAssetId(
    ns,
    [
      dir ? `entity/${dir}/${leaf}_eyes` : `entity/${leaf}_eyes`,
      dir ? `entity/${dir}/${entityType}_eyes` : `entity/${entityType}_eyes`,
      `entity/${folderRoot}/${folderRoot}_eyes`,
    ],
    all,
  );
  const hasEyes = !!eyesTexture;
  if (hasEyes && eyesTexture) {
    controls.push({
      kind: "toggle",
      id: "feature.glowing_eyes",
      label: "Glowing Eyes",
      defaultValue: true,
    });
  }

  // -----------------------------------------------------------------------
  // Creeper charge overlay (generic `_armor` texture + optional charge JEM)
  // -----------------------------------------------------------------------
  let creeperArmor: AssetId | null = null;
  if (entityType === "creeper") {
    creeperArmor = findAssetId(
      ns,
      [
        dir ? `entity/${dir}/${leaf}_armor` : `entity/${leaf}_armor`,
        `entity/creeper/creeper_armor`,
        `entity/creeper_armor`,
      ],
      all,
    );
    if (creeperArmor) {
      controls.push({
        kind: "toggle",
        id: "creeper.charge",
        label: "Charged",
        defaultValue: false,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Generic "outer layer" skin (e.g. drowned_outer_layer) + optional `_outer` CEM.
  // -----------------------------------------------------------------------
  const outerLayerTexture = findAssetId(
    ns,
    [
      dir ? `entity/${dir}/${leaf}_outer_layer` : `entity/${leaf}_outer_layer`,
      dir ? `entity/${dir}/${leaf}_outer` : `entity/${leaf}_outer`,
      `entity/${folderRoot}/${leaf}_outer_layer`,
    ],
    all,
  );
  if (outerLayerTexture) {
    controls.push({
      kind: "toggle",
      id: "feature.outer_layer",
      label: "Outer Layer",
      defaultValue: true,
    });
  }

  // -----------------------------------------------------------------------
  // Generic crackiness overlays (iron golem damage states)
  // -----------------------------------------------------------------------
  const crackinessValues = ["low", "medium", "high"] as const;
  const availableCrackiness = crackinessValues.filter((v) =>
    findAssetId(
      ns,
      [
        dir
          ? `entity/${dir}/${leaf}_crackiness_${v}`
          : `entity/${leaf}_crackiness_${v}`,
        `entity/${folderRoot}/${leaf}_crackiness_${v}`,
      ],
      all,
    ),
  );
  if (availableCrackiness.length > 0) {
    controls.push({
      kind: "select",
      id: "feature.crackiness",
      label: "Cracks",
      defaultValue: "none",
      options: [
        { value: "none", label: "None" },
        ...availableCrackiness.map((v) => ({
          value: v,
          label: v.replace(/^\w/, (c) => c.toUpperCase()),
        })),
      ],
    });
  }

  // -----------------------------------------------------------------------
  // Sheep wool/coat overlay + color
  // -----------------------------------------------------------------------
  let sheepWoolTexture: AssetId | null = null;
  let sheepUndercoatTexture: AssetId | null = null;
  if (entityType === "sheep") {
    sheepWoolTexture = findAssetId(
      ns,
      [
        dir ? `entity/${dir}/${leaf}_wool` : `entity/${leaf}_wool`,
        dir ? `entity/${dir}/${leaf}_fur` : `entity/${leaf}_fur`,
        `entity/sheep/sheep_fur`,
      ],
      all,
    );

    sheepUndercoatTexture =
      findAssetId(
        ns,
        [
          dir
            ? `entity/${dir}/${leaf}_wool_undercoat`
            : `entity/${leaf}_wool_undercoat`,
          dir ? `entity/${dir}/${leaf}_undercoat` : `entity/${leaf}_undercoat`,
        ],
        all,
      ) ?? sheepWoolTexture;

    const dyeOptions = DYE_COLORS.map((d) => ({ value: d.id, label: d.label }));
    controls.push({
      kind: "select",
      id: "sheep.coat_state",
      label: "Coat",
      defaultValue: "full",
      options: [
        { value: "full", label: "Full" },
        { value: "sheared", label: "Sheared" },
        { value: "bare", label: "Bare" },
      ],
    });
    controls.push({
      kind: "select",
      id: "sheep.color",
      label: "Wool Color",
      defaultValue: "white",
      options: dyeOptions,
    });
  }

  // -----------------------------------------------------------------------
  // Villager outfits (type + profession overlays)
  // -----------------------------------------------------------------------
  const isVillagerFamily = folderRoot === "villager";
  const isZombieVillagerFamily = folderRoot === "zombie_villager";
  let villagerTypeDefault = "none";
  let villagerProfessionDefault = "none";
  let villagerLevelDefault = "none";
  let zombieVillagerTypeDefault = "none";
  let zombieVillagerProfessionDefault = "none";
  let zombieVillagerLevelDefault = "none";

  const villagerLevelLabel = (value: string): string => {
    const map: Record<string, string> = {
      novice: "Stone",
      apprentice: "Iron",
      journeyman: "Gold",
      expert: "Emerald",
      master: "Diamond",
      stone: "Stone",
      iron: "Iron",
      gold: "Gold",
      emerald: "Emerald",
      diamond: "Diamond",
    };
    return map[value] ?? value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  };

  if (isVillagerFamily) {
    const typeSelect = makeVillagerSelect(
      all,
      ns,
      "entity/villager/type/",
      "Villager Type",
      "villager.type",
      "plains",
    );
    if (typeSelect) {
      villagerTypeDefault = typeSelect.defaultValue;
      controls.push(typeSelect);
    }
    const profSelect = makeVillagerSelect(
      all,
      ns,
      "entity/villager/profession/",
      "Profession",
      "villager.profession",
      "none",
    );
    if (profSelect) {
      villagerProfessionDefault = profSelect.defaultValue;
      controls.push(profSelect);
    }

    const levelSelect = makeVillagerSelect(
      all,
      ns,
      "entity/villager/profession_level/",
      "Level",
      "villager.level",
      "none",
      villagerLevelLabel,
    );
    if (levelSelect) {
      villagerLevelDefault = levelSelect.defaultValue;
      controls.push(levelSelect);
    }
  }

  if (isZombieVillagerFamily) {
    const typeSelect = makeVillagerSelect(
      all,
      ns,
      "entity/zombie_villager/type/",
      "Villager Type",
      "zombie_villager.type",
      "plains",
    );
    if (typeSelect) {
      zombieVillagerTypeDefault = typeSelect.defaultValue;
      controls.push(typeSelect);
    }
    const profSelect = makeVillagerSelect(
      all,
      ns,
      "entity/zombie_villager/profession/",
      "Profession",
      "zombie_villager.profession",
      "none",
    );
    if (profSelect) {
      zombieVillagerProfessionDefault = profSelect.defaultValue;
      controls.push(profSelect);
    }

    const levelSelect = makeVillagerSelect(
      all,
      ns,
      "entity/zombie_villager/profession_level/",
      "Level",
      "zombie_villager.level",
      "none",
      villagerLevelLabel,
    );
    if (levelSelect) {
      zombieVillagerLevelDefault = levelSelect.defaultValue;
      controls.push(levelSelect);
    }
  }

  // -----------------------------------------------------------------------
  // Banner patterns (toggle list) + global color
  // -----------------------------------------------------------------------
  const bannerPatternPrefix = `${ns}:entity/banner/`;
  const bannerPatterns = allAssetIds
    .filter((id) => id.startsWith(bannerPatternPrefix))
    .map((id) => id as AssetId);

  const shouldOfferBannerPatterns =
    bannerPatterns.length > 0 &&
    (entityType === "banner" ||
      entityType === "banner_base" ||
      stripNamespace(baseAssetId).startsWith("entity/banner"));

  if (shouldOfferBannerPatterns) {
    controls.push({
      kind: "select",
      id: "banner.color",
      label: "Pattern Color",
      defaultValue: "black",
      options: DYE_COLORS.map((d) => ({ value: d.id, label: d.label })),
    });
    for (const pat of stableUnique(bannerPatterns)) {
      const leafName = stripNamespace(pat).split("/").pop() ?? pat;
      controls.push({
        kind: "toggle",
        id: `banner.pattern.${leafName}`,
        label: leafName.replace(/_/g, " "),
        defaultValue: false,
      });
    }
  }

  // If nothing is discoverable, don't show a schema.
  const hasNonBannerControls = controls.some(
    (c) => !(c.kind === "toggle" && c.id.startsWith("banner.pattern.")),
  );
  const hasAnyControls = controls.length > 0;
  if (!hasAnyControls || (!hasNonBannerControls && !shouldOfferBannerPatterns)) {
    return null;
  }

  const getActiveLayers = (state: EntityFeatureStateView): EntityLayerDefinition[] => {
    const layers: EntityLayerDefinition[] = [];

    if (hasEyes && eyesTexture) {
      if (getToggle(state, "feature.glowing_eyes", true)) {
        layers.push({
          id: "glowing_eyes",
          label: "Glowing Eyes",
          kind: "cloneTexture",
          textureAssetId: eyesTexture,
          blend: "additive",
          zIndex: 200,
          opacity: 1,
          materialMode: { kind: "emissive", intensity: 1 },
        });
      }
    }

    if (entityType === "creeper" && creeperArmor) {
      if (getToggle(state, "creeper.charge", false)) {
        layers.push({
          id: "creeper_charge",
          label: "Charge",
          kind: "cemModel",
          cemEntityTypeCandidates: ["creeper_charge", "creeper_armor"],
          textureAssetId: creeperArmor,
          blend: "additive",
          zIndex: 180,
          opacity: 0.85,
          materialMode: { kind: "emissive", intensity: 0.8 },
        });
      }
    }

    if (outerLayerTexture && getToggle(state, "feature.outer_layer", true)) {
      layers.push({
        id: "outer_layer",
        label: "Outer Layer",
        kind: "cemModel",
        cemEntityTypeCandidates: [`${entityType}_outer`, `${leaf}_outer`],
        textureAssetId: outerLayerTexture,
        blend: "normal",
        zIndex: 110,
        opacity: 1,
        materialMode: { kind: "default" },
      });
    }

    // Crackiness overlays (iron golem)
    const crackiness = getSelect(state, "feature.crackiness", "none");
    if (crackiness !== "none") {
      const tex = findAssetId(
        ns,
        [
          dir
            ? `entity/${dir}/${leaf}_crackiness_${crackiness}`
            : `entity/${leaf}_crackiness_${crackiness}`,
          `entity/${folderRoot}/${leaf}_crackiness_${crackiness}`,
        ],
        all,
      );
      if (tex) {
        layers.push({
          id: "crackiness",
          label: "Cracks",
          kind: "cloneTexture",
          textureAssetId: tex,
          blend: "normal",
          zIndex: 115,
          opacity: 1,
          materialMode: { kind: "default" },
        });
      }
    }

    if (entityType === "sheep" && (sheepWoolTexture || sheepUndercoatTexture)) {
      const coatState = getSelect(state, "sheep.coat_state", "full");
      const dyeId = getSelect(state, "sheep.color", "white");
      const rgb = getDyeRgb(dyeId);

      const wantUndercoat = coatState === "full" || coatState === "sheared";
      const wantOuterCoat = coatState === "full";

      if (wantUndercoat && sheepUndercoatTexture) {
        layers.push({
          id: "sheep_undercoat",
          label: "Undercoat",
          kind: "cemModel",
          cemEntityTypeCandidates: [
            "sheep_wool_undercoat",
            "sheep_fur",
            "sheep_wool",
          ],
          textureAssetId: sheepUndercoatTexture,
          blend: "normal",
          zIndex: 120,
          opacity: 1,
          materialMode: { kind: "tint", color: rgb },
        });
      }

      if (wantOuterCoat && sheepWoolTexture) {
        layers.push({
          id: "sheep_wool",
          label: "Wool",
          kind: "cemModel",
          cemEntityTypeCandidates: ["sheep_wool", "sheep_fur"],
          textureAssetId: sheepWoolTexture,
          blend: "normal",
          zIndex: 130,
          opacity: 1,
          materialMode: { kind: "tint", color: rgb },
        });
      }
    }

    if (isVillagerFamily) {
      const type = getSelect(state, "villager.type", villagerTypeDefault);
      if (type !== "none") {
        const tex = `${ns}:entity/villager/type/${type}` as AssetId;
        if (all.has(tex)) {
          layers.push({
            id: "villager_type",
            label: "Villager Type",
            kind: "cloneTexture",
            textureAssetId: tex,
            blend: "normal",
            zIndex: 80,
            opacity: 1,
            materialMode: { kind: "default" },
          });
        }
      }

      const prof = getSelect(state, "villager.profession", villagerProfessionDefault);
      if (prof !== "none") {
        const tex = `${ns}:entity/villager/profession/${prof}` as AssetId;
        if (all.has(tex)) {
          layers.push({
            id: "villager_profession",
            label: "Profession",
            kind: "cloneTexture",
            textureAssetId: tex,
            blend: "normal",
            zIndex: 90,
            opacity: 1,
            materialMode: { kind: "default" },
          });
        }
      }

      const level = getSelect(state, "villager.level", villagerLevelDefault);
      if (level !== "none") {
        const tex = `${ns}:entity/villager/profession_level/${level}` as AssetId;
        if (all.has(tex)) {
          layers.push({
            id: "villager_level",
            label: "Level",
            kind: "cloneTexture",
            textureAssetId: tex,
            blend: "normal",
            zIndex: 95,
            opacity: 1,
            materialMode: { kind: "default" },
          });
        }
      }
    }

    if (isZombieVillagerFamily) {
      const type = getSelect(state, "zombie_villager.type", zombieVillagerTypeDefault);
      if (type !== "none") {
        const tex = `${ns}:entity/zombie_villager/type/${type}` as AssetId;
        if (all.has(tex)) {
          layers.push({
            id: "zombie_villager_type",
            label: "Villager Type",
            kind: "cloneTexture",
            textureAssetId: tex,
            blend: "normal",
            zIndex: 80,
            opacity: 1,
            materialMode: { kind: "default" },
          });
        }
      }

      const prof = getSelect(
        state,
        "zombie_villager.profession",
        zombieVillagerProfessionDefault,
      );
      if (prof !== "none") {
        const tex = `${ns}:entity/zombie_villager/profession/${prof}` as AssetId;
        if (all.has(tex)) {
          layers.push({
            id: "zombie_villager_profession",
            label: "Profession",
            kind: "cloneTexture",
            textureAssetId: tex,
            blend: "normal",
            zIndex: 90,
            opacity: 1,
            materialMode: { kind: "default" },
          });
        }
      }

      const level = getSelect(state, "zombie_villager.level", zombieVillagerLevelDefault);
      if (level !== "none") {
        const tex = `${ns}:entity/zombie_villager/profession_level/${level}` as AssetId;
        if (all.has(tex)) {
          layers.push({
            id: "zombie_villager_level",
            label: "Level",
            kind: "cloneTexture",
            textureAssetId: tex,
            blend: "normal",
            zIndex: 95,
            opacity: 1,
            materialMode: { kind: "default" },
          });
        }
      }
    }

    if (shouldOfferBannerPatterns) {
      const dyeId = getSelect(state, "banner.color", "black");
      const rgb = getDyeRgb(dyeId);
      let z = 60;
      for (const pat of stableUnique(bannerPatterns)) {
        const leafName = stripNamespace(pat).split("/").pop() ?? "";
        const enabled = getToggle(state, `banner.pattern.${leafName}`, false);
        if (!enabled) continue;
        layers.push({
          id: `banner_pattern_${leafName}`,
          label: `Pattern: ${leafName}`,
          kind: "cloneTexture",
          textureAssetId: pat,
          blend: "normal",
          zIndex: z++,
          opacity: 1,
          materialMode: { kind: "tint", color: rgb },
        });
      }
    }

    return layers.sort((a, b) => a.zIndex - b.zIndex);
  };

  return {
    baseAssetId,
    entityRoot: entityType,
    controls,
    getActiveLayers,
  };
}

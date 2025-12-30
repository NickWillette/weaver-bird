/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import * as THREE from "three";

import { useStore } from "@state/store";
import EntityModel from "./EntityModel";

const loadEntityModelMock = vi.fn();
const createAnimationEngineMock = vi.fn();

vi.mock("@react-three/fiber", async () => {
  return {
    useFrame: () => {},
  };
});

vi.mock("@state/selectors", async () => {
  return {
    useSelectWinner: vi.fn(() => "minecraft:vanilla"),
    useSelectPack: vi.fn((packId: string) => {
      if (!packId) return undefined;
      return {
        id: packId,
        name: packId,
        path: `/packs/${packId}`,
        size: 0,
        is_zip: false,
        pack_format: 48,
      };
    }),
    useSelectPacksDir: vi.fn(() => "/packs"),
    useSelectAllAssets: vi.fn(() => []),
  };
});

vi.mock("@lib/emf", async () => {
  return {
    getEntityInfoFromAssetId: vi.fn(() => ({ variant: "zombie", parent: null })),
    jemToThreeJS: vi.fn(() => new THREE.Group()),
    loadEntityModel: (...args: any[]) => loadEntityModelMock(...args),
    isEntityTexture: () => true,
  };
});

vi.mock("@lib/entityComposite", async () => {
  return {
    resolveEntityCompositeSchema: vi.fn(() => null),
  };
});

vi.mock("@lib/three/textureLoader", async () => {
  return {
    loadPackTexture: vi.fn(async () => new THREE.Texture()),
    loadVanillaTexture: vi.fn(async () => new THREE.Texture()),
  };
});

vi.mock("@lib/tauri", async () => {
  return {
    getEntityVersionVariants: vi.fn(async () => ({})),
  };
});

vi.mock("@lib/emf/animation/AnimationEngine", async () => {
  return {
    createAnimationEngine: (...args: any[]) => createAnimationEngineMock(...args),
  };
});

function makeParsedModel(animations?: any) {
  return {
    texturePath: "entity/zombie/zombie",
    textureSize: [64, 64],
    parts: [],
    animations,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useStore.getState().reset();
});

describe("EntityModel variant resolution", () => {
  it("does not leak non-vanilla pack animations into vanilla variant", async () => {
    loadEntityModelMock.mockResolvedValue(makeParsedModel([{ "body.rx": "0" }]));
    createAnimationEngineMock.mockReturnValue({
      setPreset: () => {},
      setSpeed: () => {},
      setHeadOrientation: () => {},
      setPoseToggles: () => {},
      tick: () => {},
      reset: () => {},
      playTrigger: () => {},
    });

    render(<EntityModel assetId="minecraft:entity/zombie/zombie" />);

    await waitFor(() => {
      expect(loadEntityModelMock).toHaveBeenCalled();
    });

    // Winner is vanilla, so the component should load the vanilla JEM and never
    // attempt to load from another pack path.
    const calls = loadEntityModelMock.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls[0]?.[1]).toBeUndefined();
  });

  it("respects animation variant selection (vanilla disables pack JPM layers)", async () => {
    // Switch winner pack to a non-vanilla pack for this test.
    const selectors = await import("@state/selectors");
    (selectors.useSelectWinner as any).mockReturnValue("fresh:animations");

    loadEntityModelMock.mockResolvedValue(makeParsedModel([{ "body.rx": "0" }]));
    createAnimationEngineMock.mockReturnValue({
      setPreset: () => {},
      setSpeed: () => {},
      setHeadOrientation: () => {},
      setPoseToggles: () => {},
      tick: () => {},
      reset: () => {},
      playTrigger: () => {},
    });

    useStore
      .getState()
      .setEntityAnimationVariant("minecraft:entity/zombie/zombie", "vanilla");

    render(<EntityModel assetId="minecraft:entity/zombie/zombie" />);

    await waitFor(() => {
      expect(createAnimationEngineMock).toHaveBeenCalled();
    });

    const [, passedLayers] = createAnimationEngineMock.mock.calls[0] ?? [];
    expect(passedLayers).toBeUndefined();
  });
});

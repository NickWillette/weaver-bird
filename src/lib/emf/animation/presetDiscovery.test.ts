import { describe, it, expect } from "vitest";
import { getAvailableAnimationPresetIdsForAnimationLayers } from "./presetDiscovery";

describe("preset discovery", () => {
  it("returns null when no CEM animation layers exist", () => {
    expect(getAvailableAnimationPresetIdsForAnimationLayers(undefined)).toBeNull();
    expect(getAvailableAnimationPresetIdsForAnimationLayers([])).toBeNull();
  });

  it("includes riding only when is_riding is referenced", () => {
    const layers = [
      {
        "body.rx": "if(is_riding, 1, 0)",
      },
    ];

    const ids = getAvailableAnimationPresetIdsForAnimationLayers(layers);
    expect(ids).not.toBeNull();
    expect(ids!).toContain("idle");
    expect(ids!).toContain("riding");
    expect(ids!).not.toContain("baby");
  });

  it("does not include baby just because limb_swing is used", () => {
    const layers = [
      {
        "leg1.rx": "sin(limb_swing)",
      },
    ];

    const ids = getAvailableAnimationPresetIdsForAnimationLayers(layers);
    expect(ids).not.toBeNull();
    expect(ids!).toContain("walking");
    expect(ids!).not.toContain("baby");
  });
});


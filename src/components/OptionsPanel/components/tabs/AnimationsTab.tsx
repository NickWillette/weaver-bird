/**
 * AnimationsTab Component
 *
 * Provides animation controls for entity models including:
 * - Animation preset selection (Walking, Attacking, etc.)
 * - Play/pause controls
 * - Speed adjustment
 * - Manual head orientation control
 */

import { TabsContent } from "@/ui/components/tabs";
import { Separator } from "@/ui/components/Separator/Separator";
import { useStore } from "@state/store";
import { ANIMATION_PRESETS } from "@lib/emf/animation/entityState";

export const AnimationsTab = () => {
  const animationPreset = useStore((state) => state.animationPreset);
  const animationPlaying = useStore((state) => state.animationPlaying);
  const animationSpeed = useStore((state) => state.animationSpeed);
  const entityHeadYaw = useStore((state) => state.entityHeadYaw);
  const entityHeadPitch = useStore((state) => state.entityHeadPitch);

  const setAnimationPreset = useStore((state) => state.setAnimationPreset);
  const setAnimationPlaying = useStore((state) => state.setAnimationPlaying);
  const setAnimationSpeed = useStore((state) => state.setAnimationSpeed);
  const setEntityHeadYaw = useStore((state) => state.setEntityHeadYaw);
  const setEntityHeadPitch = useStore((state) => state.setEntityHeadPitch);

  const handlePresetClick = (presetId: string) => {
    if (animationPreset === presetId) {
      // Toggle off if clicking the same preset
      setAnimationPreset(null);
    } else {
      setAnimationPreset(presetId);
    }
  };

  const handlePlayPause = () => {
    setAnimationPlaying(!animationPlaying);
  };

  const handleStop = () => {
    setAnimationPreset(null);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnimationSpeed(parseFloat(e.target.value));
  };

  const handleHeadYawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEntityHeadYaw(parseFloat(e.target.value));
  };

  const handleHeadPitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEntityHeadPitch(parseFloat(e.target.value));
  };

  const selectedPreset = ANIMATION_PRESETS.find((p) => p.id === animationPreset);

  return (
    <TabsContent value="animations">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Entity Animations</h3>
        <Separator className="mb-4" />

        {/* Animation Presets Grid */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Animation Presets
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ANIMATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
                className={`
                  p-2 rounded-md border text-left transition-colors
                  ${
                    animationPreset === preset.id
                      ? "bg-primary/20 border-primary"
                      : "bg-background border-border hover:bg-accent"
                  }
                `}
                title={preset.description}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{preset.icon}</span>
                  <span className="text-sm truncate">{preset.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls */}
        {selectedPreset && (
          <>
            <Separator className="mb-4" />
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Playback Controls
              </label>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={handlePlayPause}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {animationPlaying ? "Pause" : "Play"}
                </button>
                <button
                  onClick={handleStop}
                  className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Stop
                </button>
                <span className="text-sm text-muted-foreground ml-2">
                  {selectedPreset.name}
                  {selectedPreset.loop ? " (looping)" : ""}
                </span>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Speed</span>
                  <span>{animationSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={animationSpeed}
                  onChange={handleSpeedChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1x</span>
                  <span>1.0x</span>
                  <span>3.0x</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Head Control */}
        <Separator className="mb-4" />
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Head Orientation
          </label>

          {/* Yaw Control */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Yaw (Left/Right)</span>
              <span>{entityHeadYaw.toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={entityHeadYaw}
              onChange={handleHeadYawChange}
              className="w-full"
            />
          </div>

          {/* Pitch Control */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Pitch (Up/Down)</span>
              <span>{entityHeadPitch.toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min="-90"
              max="90"
              step="1"
              value={entityHeadPitch}
              onChange={handleHeadPitchChange}
              className="w-full"
            />
          </div>

          <button
            onClick={() => {
              setEntityHeadYaw(0);
              setEntityHeadPitch(0);
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Reset head orientation
          </button>
        </div>

        {/* Info */}
        <Separator className="my-4" />
        <div className="text-sm text-muted-foreground">
          <p>
            Select an animation preset to see the entity in motion.
            Custom animations from resource packs (EMF/ETF) are automatically applied.
          </p>
        </div>
      </div>
    </TabsContent>
  );
};

import { useStore } from "@state/store";
import { Separator } from "@/ui/components/Separator/Separator";
import { SettingCheckbox } from "../SettingCheckbox";

export const Canvas2DSettings = () => {
    const canvas2DShowPixelGrid = useStore(
        (state) => state.canvas2DShowPixelGrid,
    );
    const canvas2DShowUVWrap = useStore((state) => state.canvas2DShowUVWrap);
    const setCanvas2DShowPixelGrid = useStore(
        (state) => state.setCanvas2DShowPixelGrid,
    );
    const setCanvas2DShowUVWrap = useStore(
        (state) => state.setCanvas2DShowUVWrap,
    );

    return (
        <div>
            <h3>2D Canvas Settings</h3>
            <Separator style={{ margin: "0.75rem 0" }} />

            <SettingCheckbox
                label="Show Pixel Grid"
                description="Display a pixel grid overlay to help visualize individual pixels in the texture."
                checked={canvas2DShowPixelGrid}
                onChange={setCanvas2DShowPixelGrid}
            />

            <SettingCheckbox
                label="Show UV Wrap"
                description="Display colored boxes showing where entity model parts map to the texture (entities only)."
                checked={canvas2DShowUVWrap}
                onChange={setCanvas2DShowUVWrap}
            />
        </div>
    );
};

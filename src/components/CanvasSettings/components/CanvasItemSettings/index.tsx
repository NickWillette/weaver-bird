import { useStore } from "@state/store";
import { Separator } from "@/ui/components/Separator/Separator";
import { SettingCheckbox } from "../SettingCheckbox";

export const CanvasItemSettings = () => {
    const canvasItemShowGrid = useStore((state) => state.canvasItemShowGrid);
    const canvasItemRotate = useStore((state) => state.canvasItemRotate);
    const canvasItemHover = useStore((state) => state.canvasItemHover);
    const setCanvasItemShowGrid = useStore(
        (state) => state.setCanvasItemShowGrid,
    );
    const setCanvasItemRotate = useStore((state) => state.setCanvasItemRotate);
    const setCanvasItemHover = useStore((state) => state.setCanvasItemHover);

    return (
        <div>
            <h3>Item Canvas Settings</h3>
            <Separator style={{ margin: "0.75rem 0" }} />

            <SettingCheckbox
                label="Show Grid"
                checked={canvasItemShowGrid}
                onChange={setCanvasItemShowGrid}
            />

            <SettingCheckbox
                label="Rotate Animation"
                checked={canvasItemRotate}
                onChange={setCanvasItemRotate}
            />

            <SettingCheckbox
                label="Hover Animation"
                description="Control the display and animation settings for dropped items in the preview canvas."
                checked={canvasItemHover}
                onChange={setCanvasItemHover}
            />
        </div>
    );
};

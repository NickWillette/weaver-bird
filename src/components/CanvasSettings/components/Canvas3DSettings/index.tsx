import { useStore } from "@state/store";
import { Separator } from "@/ui/components/Separator/Separator";
import { SettingCheckbox } from "../SettingCheckbox";

export const Canvas3DSettings = () => {
    const canvas3DShowGrid = useStore((state) => state.canvas3DShowGrid);
    const setCanvas3DShowGrid = useStore((state) => state.setCanvas3DShowGrid);

    return (
        <div>
            <h3>3D Canvas Settings</h3>
            <Separator style={{ margin: "0.75rem 0" }} />

            <SettingCheckbox
                label="Show Floor Grid"
                description="Display a floor grid beneath blocks for spatial reference in the 3D preview."
                checked={canvas3DShowGrid}
                onChange={setCanvas3DShowGrid}
            />
        </div>
    );
};

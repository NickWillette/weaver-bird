import { TabsContent } from "@/ui/components/tabs";
import { Separator } from "@/ui/components/Separator/Separator";
import type { ItemDisplayMode } from "@lib/itemDisplayModes";
import { getDisplayModeName } from "@lib/itemDisplayModes";

interface ItemDisplayTabProps {
    itemDisplayMode: ItemDisplayMode;
}

export const ItemDisplayTab = ({ itemDisplayMode }: ItemDisplayTabProps) => {
    return (
        <TabsContent value="item">
            <div>
                <h3>Item Display</h3>
                <Separator style={{ margin: "0.75rem 0" }} />

                <p style={{ fontSize: "0.85rem", color: "#666" }}>
                    <strong>Display Mode:</strong> {getDisplayModeName(itemDisplayMode)}
                </p>
                <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "#888" }}>
                    Items are rendered as 3D dropped items with 1px thickness, just like
                    in Minecraft.
                </p>

                <Separator style={{ margin: "1rem 0" }} />

                <p style={{ fontSize: "0.85rem", color: "#888" }}>
                    To configure item animations and display options, open the{" "}
                    <strong>Canvas Settings</strong> tab on the right side.
                </p>
            </div>
        </TabsContent>
    );
};

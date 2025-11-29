import { useMemo } from "react";
import { TabsContent } from "@/ui/components/tabs";
import { Combobox, type ComboboxOption } from "@/ui/components/Combobox/Combobox";

interface PaintingTabProps {
    assetId: string;
    allAssets: Array<{ id: string; name: string }>;
    onSelectVariant: (variantId: string) => void;
}

export const PaintingTab = ({
    assetId,
    allAssets,
    onSelectVariant,
}: PaintingTabProps) => {
    // Filter all assets to only paintings and create options
    const paintingOptions: ComboboxOption[] = useMemo(() => {
        return allAssets
            .filter((asset) => {
                const path = asset.id.includes(":") ? asset.id.split(":")[1] : asset.id;
                return path.startsWith("painting/");
            })
            .map((asset) => {
                const path = asset.id.includes(":") ? asset.id.split(":")[1] : asset.id;
                const paintingName = path.replace("painting/", "");

                // Capitalize and format the name
                const formattedName = paintingName
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                return {
                    value: asset.id,
                    label: formattedName,
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [allAssets]);

    if (paintingOptions.length === 0) {
        return null;
    }

    return (
        <TabsContent value="painting">
            <div>
                <label
                    style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                    }}
                >
                    Painting Variant
                </label>
                <Combobox
                    options={paintingOptions}
                    value={assetId}
                    onValueChange={onSelectVariant}
                    placeholder="Select a painting..."
                    searchPlaceholder="Search paintings..."
                    emptyMessage="No paintings found"
                />
                <div style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "#888" }}>
                    {paintingOptions.length} painting{paintingOptions.length !== 1 ? "s" : ""} available
                </div>
            </div>
        </TabsContent>
    );
};

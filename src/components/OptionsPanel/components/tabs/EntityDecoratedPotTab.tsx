import { useMemo } from "react";
import { TabsContent } from "@/ui/components/tabs";
import { Combobox, type ComboboxOption } from "@/ui/components/Combobox/Combobox";

interface EntityDecoratedPotTabProps {
    assetId: string;
    allAssets: Array<{ id: string; name: string }>;
    onSelectVariant?: (variantId: string) => void;
}

export const EntityDecoratedPotTab = ({
    assetId,
    allAssets,
    onSelectVariant,
}: EntityDecoratedPotTabProps) => {
    // Filter all assets to entity decorated pot textures
    const patternOptions: ComboboxOption[] = useMemo(() => {
        const options = allAssets
            .filter((asset) => {
                const path = asset.id.includes(":") ? asset.id.split(":")[1] : asset.id;
                // Include entity decorated pot textures
                return path.startsWith("entity/decorated_pot/");
            })
            .map((asset) => {
                const path = asset.id.includes(":") ? asset.id.split(":")[1] : asset.id;
                const shardName = path.replace("entity/decorated_pot/", "").replace(/\.png$/, "");

                // Capitalize and format the name
                const formattedName = shardName
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                return {
                    value: asset.id,
                    label: `Pattern: ${formattedName}`,
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label));

        return options;
    }, [allAssets]);

    return (
        <TabsContent value="entity-pot">
            <div>
                {onSelectVariant && allAssets.length > 0 && patternOptions.length > 0 && (
                    <div>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                            }}
                        >
                            Decorated Pot Pattern
                        </label>
                        <Combobox
                            options={patternOptions}
                            value={assetId}
                            onValueChange={onSelectVariant}
                            placeholder="Select a pattern..."
                            searchPlaceholder="Search patterns..."
                            emptyMessage="No patterns found"
                        />
                        <div style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "#888" }}>
                            {patternOptions.length} pattern{patternOptions.length !== 1 ? "s" : ""} available
                        </div>
                    </div>
                )}
            </div>
        </TabsContent>
    );
};

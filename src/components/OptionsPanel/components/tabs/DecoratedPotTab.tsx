import { useState, useMemo, useEffect } from "react";
import { TabsContent } from "@/ui/components/tabs";
import { Combobox, type ComboboxOption } from "@/ui/components/Combobox/Combobox";

interface DecoratedPotTabProps {
    assetId: string;
    allAssets: Array<{ id: string; name: string }>;
}

interface DecoratedPotConfig {
    north: string;
    south: string;
    east: string;
    west: string;
}

const DEFAULT_SHARD = "minecraft:item/brick"; // Default to brick texture

export const DecoratedPotTab = ({
    assetId,
    allAssets,
}: DecoratedPotTabProps) => {
    // State for each side of the pot
    const [sides, setSides] = useState<DecoratedPotConfig>({
        north: DEFAULT_SHARD,
        south: DEFAULT_SHARD,
        east: DEFAULT_SHARD,
        west: DEFAULT_SHARD,
    });

    // Filter all assets to only pottery shards and create options
    const shardOptions: ComboboxOption[] = useMemo(() => {
        const shards = allAssets
            .filter((asset) => {
                const path = asset.id.includes(":") ? asset.id.split(":")[1] : asset.id;
                return path.startsWith("item/pottery_shard_");
            })
            .map((asset) => {
                const path = asset.id.includes(":") ? asset.id.split(":")[1] : asset.id;
                const shardType = path.replace("item/pottery_shard_", "");

                // Capitalize and format the name
                const formattedName = shardType
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                return {
                    value: asset.id,
                    label: formattedName,
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label));

        // Add "Blank (Brick)" option at the beginning
        return [{ value: DEFAULT_SHARD, label: "Blank (Brick)" }, ...shards];
    }, [allAssets]);

    // Reset sides when asset changes
    useEffect(() => {
        setSides({
            north: DEFAULT_SHARD,
            south: DEFAULT_SHARD,
            east: DEFAULT_SHARD,
            west: DEFAULT_SHARD,
        });
    }, [assetId]);

    const handleSideChange = (side: keyof DecoratedPotConfig, value: string) => {
        setSides((prev) => ({ ...prev, [side]: value }));
    };

    if (shardOptions.length <= 1) {
        return (
            <TabsContent value="decorated-pot">
                <div>
                    <p style={{ fontSize: "0.85rem", color: "#888" }}>
                        No pottery shards found in the loaded resource packs.
                    </p>
                </div>
            </TabsContent>
        );
    }

    return (
        <TabsContent value="decorated-pot">
            <div>
                <div style={{ marginBottom: "1rem" }}>
                    <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
                        Decorated Pot Configuration
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#888" }}>
                        Select pottery shards for each side of the decorated pot
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {(["north", "south", "east", "west"] as const).map((side) => (
                        <div key={side}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                }}
                            >
                                {side.charAt(0).toUpperCase() + side.slice(1)} Side
                            </label>
                            <Combobox
                                options={shardOptions}
                                value={sides[side]}
                                onValueChange={(value) => handleSideChange(side, value)}
                                placeholder="Select a shard..."
                                searchPlaceholder="Search shards..."
                                emptyMessage="No shards found"
                            />
                        </div>
                    ))}
                </div>

                <div style={{ fontSize: "0.85rem", marginTop: "1rem", color: "#888" }}>
                    {shardOptions.length - 1} pottery shard
                    {shardOptions.length - 1 !== 1 ? "s" : ""} available
                </div>
            </div>
        </TabsContent>
    );
};

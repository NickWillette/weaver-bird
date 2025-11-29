import { useMemo } from "react";
import { TabsContent } from "@/ui/components/tabs";
import { Separator } from "@/ui/components/Separator/Separator";
import { Combobox, type ComboboxOption } from "@/ui/components/Combobox/Combobox";
import Preview3D from "@components/Preview3D";

interface PotteryShardTabProps {
    assetId: string;
    allAssets: Array<{ id: string; name: string }>;
    onSelectVariant?: (variantId: string) => void;
}

export const PotteryShardTab = ({
    assetId,
    allAssets,
    onSelectVariant,
}: PotteryShardTabProps) => {
    // Filter all assets to pottery shards and entity decorated pot textures
    const shardOptions: ComboboxOption[] = useMemo(() => {
        const options = allAssets
            .filter((asset) => {
                const path = asset.id.includes(":") ? asset.id.split(":")[1] : asset.id;
                // Include pottery shard items
                return path.startsWith("item/pottery_shard_");
            })
            .map((asset) => {
                const path = asset.id.includes(":") ? asset.id.split(":")[1] : asset.id;
                const shardName = path.replace("item/pottery_shard_", "");

                // Capitalize and format the name
                const formattedName = shardName
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                return {
                    value: asset.id,
                    label: `Item: ${formattedName}`,
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label));

        return options;
    }, [allAssets]);

    return (
        <TabsContent value="pottery-shard">
            <div>
                {onSelectVariant && allAssets.length > 0 && shardOptions.length > 0 && (
                    <>
                        <div style={{ marginBottom: "1rem" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                }}
                            >
                                Pottery Shard Type
                            </label>
                            <Combobox
                                options={shardOptions}
                                value={assetId}
                                onValueChange={onSelectVariant}
                                placeholder="Select a pottery shard..."
                                searchPlaceholder="Search pottery shards..."
                                emptyMessage="No pottery shards found"
                            />
                            <div style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "#888" }}>
                                {shardOptions.length} pottery shard{shardOptions.length !== 1 ? "s" : ""} available
                            </div>
                        </div>
                        <Separator style={{ margin: "1rem 0" }} />
                    </>
                )}
                {/* Convert pottery shard item to entity texture for preview */}
                <Preview3D
                    assetId={
                        assetId
                            ?.replace("item/", "entity/decorated_pot/")
                            .replace("_pottery_shard", "_pottery_pattern") || assetId
                    }
                    showPot={false}
                    blockProps={{}}
                    seed={0}
                    allAssetIds={[]}
                />
            </div>
        </TabsContent>
    );
};

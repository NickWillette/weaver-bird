import { TabsContent } from "@/ui/components/tabs";
import type { BlockStateSchema } from "@lib/tauri/blockModels";

interface AdvancedTabProps {
    assetId: string;
    seed: number;
    blockProps: Record<string, string>;
    schema: BlockStateSchema | null;
}

export const AdvancedTab = ({
    assetId,
    seed,
    blockProps,
    schema,
}: AdvancedTabProps) => {
    return (
        <TabsContent value="advanced">
            <div>
                <h3>Advanced Options</h3>
                <p>Additional configuration options for advanced users.</p>
                <div style={{ fontSize: "0.85rem" }}>
                    <p>
                        <strong>Asset ID:</strong> {assetId}
                    </p>
                    <p>
                        <strong>Current Seed:</strong> {seed}
                    </p>
                    <p>
                        <strong>Block Props:</strong> {Object.keys(blockProps).length}{" "}
                        configured
                    </p>
                    <p>
                        <strong>Has Schema:</strong> {schema ? "Yes" : "No"}
                    </p>
                </div>
            </div>
        </TabsContent>
    );
};

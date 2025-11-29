import { TabsContent } from "@/ui/components/tabs";
import BlockStatePanel from "@components/Preview3D/BlockStatePanel";

interface BlockStateTabProps {
    assetId: string;
    blockProps: Record<string, string>;
    seed: number;
    onBlockPropsChange: (props: Record<string, string>) => void;
    onSeedChange: (seed: number) => void;
}

export const BlockStateTab = ({
    assetId,
    blockProps,
    seed,
    onBlockPropsChange,
    onSeedChange,
}: BlockStateTabProps) => {
    return (
        <TabsContent value="block-state">
            <BlockStatePanel
                assetId={assetId}
                blockProps={blockProps}
                onBlockPropsChange={onBlockPropsChange}
                seed={seed}
                onSeedChange={onSeedChange}
            />
        </TabsContent>
    );
};

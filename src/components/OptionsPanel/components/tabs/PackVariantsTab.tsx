import { TabsContent } from "@/ui/components/tabs";
import { Separator } from "@/ui/components/Separator/Separator";
import { VariantChooser } from "@components/VariantChooser";
import type { ProviderOption } from "../../types";

interface PackVariantsTabProps {
    assetId: string;
    providers: ProviderOption[];
    onSelectProvider: (packId: string) => void;
}

export const PackVariantsTab = ({
    assetId,
    providers,
    onSelectProvider,
}: PackVariantsTabProps) => {
    return (
        <TabsContent value="variants">
            <div>
                <h3>Resource Pack Variants</h3>
                <Separator style={{ margin: "0.75rem 0" }} />
                <p style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
                    This texture has variants from {providers.length} different resource
                    packs. Click on a variant below to switch between different visual
                    styles.
                </p>
                <VariantChooser
                    providers={providers}
                    onSelectProvider={onSelectProvider}
                    assetId={assetId}
                />
            </div>
        </TabsContent>
    );
};

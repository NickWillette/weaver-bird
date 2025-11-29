import { TabsContent } from "@/ui/components/tabs";
import { Separator } from "@/ui/components/Separator/Separator";

interface PotTabProps {
    showPot: boolean;
    onShowPotChange: (show: boolean) => void;
}

export const PotTab = ({ showPot, onShowPotChange }: PotTabProps) => {
    return (
        <TabsContent value="pot">
            <div>
                <h3>Pot Display</h3>
                <Separator style={{ margin: "0.75rem 0" }} />
                <label
                    style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={showPot}
                        onChange={(e) => onShowPotChange(e.target.checked)}
                        style={{
                            cursor: "pointer",
                            width: "18px",
                            height: "18px",
                        }}
                    />
                    <span
                        style={{
                            textTransform: "uppercase",
                            fontWeight: "600",
                        }}
                    >
                        Show Pot
                    </span>
                </label>
                <p style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
                    This is a potted plant. Toggle the pot display on or off.
                </p>
            </div>
        </TabsContent>
    );
};

/**
 * Represents a pack variant option with UI state
 * (distinct from the domain model Provider type)
 */
export interface ProviderOption {
    packId: string;
    packName: string;
    isPenciled?: boolean;
    isWinner?: boolean;
}

export interface VariantChooserProps {
    providers: ProviderOption[];
    onSelectProvider: (packId: string) => void;
    assetId?: string;
}

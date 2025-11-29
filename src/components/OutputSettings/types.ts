export interface OutputSettingsProps {
    outputDir?: string;
    packFormat?: number;
    onOutputDirChange: (path: string) => void;
    onPackFormatChange: (format: number) => void;
}

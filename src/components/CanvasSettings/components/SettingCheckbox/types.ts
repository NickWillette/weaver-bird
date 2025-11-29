export interface SettingCheckboxProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

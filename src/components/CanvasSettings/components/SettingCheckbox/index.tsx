import type { SettingCheckboxProps } from "./types";
import s from "./styles.module.scss";

export const SettingCheckbox = ({
    label,
    description,
    checked,
    onChange,
}: SettingCheckboxProps) => {
    return (
        <>
            <label className={s.checkboxLabel}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className={s.checkbox}
                />
                <span className={s.labelText}>{label}</span>
            </label>
            {description && <p className={s.description}>{description}</p>}
        </>
    );
};

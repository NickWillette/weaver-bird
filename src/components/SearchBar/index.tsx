import s from "./styles.module.scss";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search assets...",
}: Props) {
  return (
    <div className={s.root}>
      <div className={s.inputWrapper}>
        <span className={s.searchIcon}>🔍</span>
        <input
          type="text"
          className={s.input}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import s from "./styles.module.scss";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search assets...",
  debounceMs = 300,
}: Props) {
  // Local state for immediate input display
  const [inputValue, setInputValue] = useState(value);

  // Sync local state when external value changes (e.g., cleared programmatically)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounce the onChange callback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs, onChange, value]);

  return (
    <div className={s.root}>
      <div className={s.inputWrapper}>
        <span className={s.searchIcon}>🔍</span>
        <input
          type="text"
          className={s.input}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
    </div>
  );
}

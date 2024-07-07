import { useState } from "react";

export default function useLocalStorage(key: string, initialValue: string): [string, (value: string) => void] {
  const [storedValue, setStoredValue] = useState(
    typeof window !== 'undefined' ? window.localStorage.getItem(key) ?? initialValue : initialValue
  );
  const setValue = (value: string) => {
    setStoredValue(value);
    window.localStorage.setItem(key, value);
  };
  return [storedValue, setValue];
}

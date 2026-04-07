"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(initialValue);
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStored(JSON.parse(item));
      }
    } catch {
      // ignore
    }
    initialized.current = true;
  }, [key]);

  // Save to localStorage on change (after init)
  useEffect(() => {
    if (!initialized.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(stored));
    } catch {
      // quota exceeded or similar
    }
  }, [key, stored]);

  const setValue = useCallback((val: T | ((prev: T) => T)) => {
    setStored((prev) => {
      const next = val instanceof Function ? val(prev) : val;
      return next;
    });
  }, []);

  return [stored, setValue];
}

// src/ThemeModeContext.ts
import { createContext } from 'react';

export interface ThemeModeContextType {
  toggleThemeMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType>({
  toggleThemeMode: () => {
    // Default no-op function.
    // You could add a console.warn here if it's called without a Provider.
    // console.warn("ThemeModeContext: toggleThemeMode called on default context value");
  },
});
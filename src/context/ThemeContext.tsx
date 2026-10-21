// mörkt läge m mörk statisk bild vs ljust läge med ljus pastellig bild

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './theme-context';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Sätt 'light' som standardtema
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Funktion för att byta tema
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Denna useEffect lyssnar på om 'theme' ändras, och lägger i så fall
  // till rätt data-attribut på själva hemsidans <body>-tagg.
  useEffect(() => {
    document.body.dataset.theme = theme;

    return () => {
      delete document.body.dataset.theme;
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
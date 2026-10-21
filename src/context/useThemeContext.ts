import { useContext } from 'react';
import { ThemeContext } from './theme-context';

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext måste användas inuti en ThemeProvider');
  }
  return context;
}

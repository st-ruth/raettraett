// Logga och menysymbol. Alltid synliga.

import { Moon, Sun } from 'lucide-react';
import Navbar from './Navbar';
import { useThemeContext } from '../context/useThemeContext';
import '../styles/header.css';

export default function Header() {
  const { theme, toggleTheme } = useThemeContext();
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <header className="header-container">
      <div className="header-left">
        <p>rättRätt</p>
      </div>
      <Navbar />
      <button
        type="button"
        className="mode-button"
        onClick={toggleTheme}
        aria-label={`Byt till ${nextTheme === 'dark' ? 'mörkt' : 'ljust'} läge`}
        title={`Byt till ${nextTheme === 'dark' ? 'mörkt' : 'ljust'} läge`}
      >
        {theme === 'dark'
          ? <Sun className="mode-icon" aria-hidden="true" />
          : <Moon className="mode-icon" aria-hidden="true" />}
      </button>
    </header>
  );
}
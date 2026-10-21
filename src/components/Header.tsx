import { useState } from 'react';
import { Moon, Sun, LogIn, LogOut } from 'lucide-react'; // Importerar LogIn istället för User
import Navbar from './Navbar';
import { useThemeContext } from '../context/useThemeContext';
import { useAuth } from '../context/useAuth';
import AuthModal from './AuthModal';
import '../styles/header.css';

export default function Header() {
  const { theme, toggleTheme } = useThemeContext();
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  // Hämta user (inloggad användare) och signOut (utloggningsfunktion)
  const { user, signOut, authPrompt, clearAuthPrompt } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const isAuthModalOpen = isLoginModalOpen || authPrompt !== null;

  const closeAuthModal = () => {
    setIsLoginModalOpen(false);
    clearAuthPrompt();
  };

  return (
    <header className="header-container">
      <div className="header-brand-control">
        <div className="header-left">
          <p>rättRätt</p>
        </div>
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
      </div>
      <Navbar />

      <div className="header-actions">
        {user ? (
          <div className="header-user">
            <span className="user-email-display">
              <span className="user-email-label">Inloggad som</span>
              <span>{user.email}</span>
            </span>
            <button
              type="button"
              className="mode-button"
              onClick={signOut}
              aria-label="Logga ut"
              title="Logga ut"
            >
              <LogOut className="mode-icon" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="mode-button"
            aria-label="Logga in"
            title="Logga in"
            onClick={() => setIsLoginModalOpen(true)}
          >
            <LogIn className="mode-icon" aria-hidden="true" />
          </button>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        notice={authPrompt ?? undefined}
      />
    </header>
  );
}
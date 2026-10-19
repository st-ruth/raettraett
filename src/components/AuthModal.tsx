import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import '../styles/modal.css';
import '../styles/authModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice?: string;
}

export default function AuthModal({ isOpen, onClose, notice }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true); // Togglar mellan inloggning/registrering

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Laddar...');

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage('Fel vid inloggning: ' + error.message);
      else {
        setMessage('Inloggad!');
        setTimeout(onClose, 1500); // Stäng modalen automatiskt efter en kort stund
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage('Fel: ' + error.message);
      else setMessage('Konto skapat! Du är nu inloggad.');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content auth-modal-content">
        <div className="modal-header">
          <h2>{isLoginMode ? 'Logga in' : 'Skapa konto'}</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Stäng">
            <X size={24} />
          </button>
        </div>

        <form className="auth-form" onSubmit={handleAuth}>
          <div className="form-group">
            <label htmlFor="auth-email">E-post</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Din e-post"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Lösenord</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ditt lösenord"
              required
            />
          </div>

          <button
            type="submit"
            className={`btn-primary auth-submit${isLoginMode ? ' auth-submit-login' : ''}`}
          >
            {isLoginMode ? 'Logga in' : 'Registrera dig'}
          </button>

          <p className="auth-mode-toggle" onClick={() => setIsLoginMode(!isLoginMode)}>
            {isLoginMode ? 'Har du inget konto? Skapa ett här.' : 'Har du redan ett konto? Logga in.'}
          </p>

          {notice && <p className="auth-message" role="status" aria-live="polite">{notice}</p>}
          {message && <p className="auth-message" role="status" aria-live="polite">{message}</p>}
        </form>
      </div>
    </div>
  );
}
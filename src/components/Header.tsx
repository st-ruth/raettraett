// Logga och menysymbol. Alltid synliga.

import { Menu } from 'lucide-react';
import '../styles/header.css';

export default function Header() {
  return (
    <header className="header-container">
      <div className="header-left">
        <h2>rättRätt</h2>
      </div>
      <button className="menu-button" aria-label="Meny">
        <Menu className="header-icon" />
      </button>
    </header>
  );
}
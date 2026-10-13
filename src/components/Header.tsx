// Logga och menysymbol. Alltid synliga.

import { Moon } from 'lucide-react';
import Navbar from './Navbar';
import '../styles/header.css';

export default function Header() {
  return (
    <header className="header-container">
      <div className="header-left">
        <p>rättRätt</p>
      </div>
      <Navbar />
      <button className="mode-button" aria-label="Byt läge" title="Byt till mörkt läge">
        <Moon className="mode-icon" />
      </button>
    </header>
  );
}
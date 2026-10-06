// Dagsfokus "ska lagas idag"
// Ska jag ha semantik med h1 på korten?
// Lägg till knappar för ny mat samt ta till kalender

import { useNavigate } from 'react-router-dom';
import DishCard from '../components/DishCard';
import { useDishContext } from '../context/DishContext'; // Din egna globala hook!
import '../styles/home.css'; // Samma CSS som jag skickade tidigare för knapparna

export default function Home() {
  // 1. Hämta datan och funktionen från ditt globala state
  const { currentDish, randomizeDish } = useDishContext();
  
  // 2. Hook för att byta sida i vår SPA
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h2>Idag</h2>
      
      {/* 3. Vi skickar in den globalt valda rätten */}
      <DishCard dish={currentDish} />

      {/* 4. Våra action-knappar under kortet */}
      <div className="home-actions">
        {/* Anropar randomizeDish från din Context */}
        <button className="action-button secondary" onClick={randomizeDish}>
          🎲 Ge mig något annat
        </button>
        
        <button className="action-button primary" onClick={() => navigate('/kalender')}>
          📅 Visa morgondagen
        </button>
      </div>
    </div>
  );
}
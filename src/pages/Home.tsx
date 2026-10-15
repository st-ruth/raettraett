// Dagsfokus "ska lagas idag"
// Ska jag ha semantik med h1 på korten?
// Lägg till knappar för ny mat samt ta till kalender

import { useNavigate } from 'react-router-dom';
import { Dices } from 'lucide-react';
import DishCard from '../components/DishCard';
import { useDishContext } from '../context/useDishContext';
import '../styles/actionButtons.css';
import '../styles/randomizer.css';

export default function Home() {
  // 1. Hämta datan och funktionen från ditt globala state
  const { currentDish, randomizeDish } = useDishContext();
  
  // 2. Hook för att byta sida i vår SPA
  const navigate = useNavigate();

  return (
    <div className="randomizer-container">
      <div className="randomizer-header">
        <h2>Ät detta idag</h2>
      </div>
      
      {/* 3. Vi skickar in den globalt valda rätten */}
      <DishCard dish={currentDish ?? undefined} variant="hero">
        <div className="home-actions">
          <button
            className="action-btn"
            onClick={randomizeDish}
            aria-label="Slumpa fram en ny rätt"
            title="Slumpa fram en ny rätt"
          >
            <Dices size={20} aria-hidden="true" />
          </button>

          <button
            className="home-weekly-btn"
            onClick={() => navigate('/kalender')}
          >
            VECKANS MATSEDEL
          </button>
        </div>
      </DishCard>
    </div>
  
  );
}
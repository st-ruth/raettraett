import { Smile, Meh, Angry } from 'lucide-react';
import DishCard from '../components/DishCard';
import { useDishContext } from '../context/useDishContext'; 
import '../styles/actionButtons.css'; // Din styling bevarad!
import '../styles/randomizer.css'; 

export default function Randomizer() {
  const { currentDish, randomizeDish, updateDishStatus } = useDishContext();

  // Tar nu emot engelska statusar för att matcha databasen
  const handleAction = (newStatus: 'yes' | 'maybe' | 'blocked') => {
    if (currentDish) {
      updateDishStatus(currentDish.id, newStatus);
      randomizeDish();
    }
  };

  // Säkerhetsnät om man swipat bort alla kort
  if (!currentDish) {
    return (
      <div className="randomizer-container">
        <div className="randomizer-header">
          <h2>Slut på inspo! 🌪️</h2>
          <p>Du har gått igenom alla tillgängliga rätter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="randomizer-container">
      <div className="randomizer-header">
        <h2>SÖK INSPO</h2>
      </div>
      
      <DishCard dish={currentDish} variant="hero">
        <div className="randomizer-actions">
          
          {/* Vänster: Nej (skickar 'blocked') */}
          <button className="action-btn no" onClick={() => handleAction('blocked')} aria-label="nej">
            <Angry size={28} />
          </button>
          
          {/* Mitten: Kanske (skickar 'maybe') */}
          <button className="action-btn maybe" onClick={() => handleAction('maybe')} aria-label="kanske">
            <Meh size={28} />
          </button>

          {/* Höger: Ja (skickar 'yes') */}
          <button className="action-btn yes" onClick={() => handleAction('yes')} aria-label="ja">
            <Smile size={28} />
          </button>
          
        </div>
      </DishCard>
    </div>
  );
}
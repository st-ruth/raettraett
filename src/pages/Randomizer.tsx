import { Smile, Meh, Angry } from 'lucide-react';
import DishCard from '../components/DishCard';
import { useDishContext } from '../context/useDishContext'; 
import { useAuth } from '../context/useAuth';
import type { DishStatus } from '../types/dish';
import '../styles/actionButtons.css'; // Din styling bevarad!
import '../styles/randomizer.css'; 

export default function Randomizer() {
  const {
    dishes,
    currentDish,
    randomizeDish,
    updateDishStatus,
    clearDishActionNotice,
    dishesLoading,
    dishesError,
  } = useDishContext();
  const { requireAuth } = useAuth();

  // Tar nu emot engelska statusar för att matcha databasen
  const handleAction = (newStatus: DishStatus) => {
    clearDishActionNotice();
    if (!requireAuth('Du måste logga in för att testa slumpgeneratorn!')) return;

    if (currentDish) {
      void updateDishStatus(currentDish.id, newStatus).then(succeeded => {
        if (succeeded) randomizeDish();
      });
    }
  };

  if (dishesLoading) {
    return (
      <div className="randomizer-container">
        <p role="status" aria-live="polite">Hämtar recept...</p>
      </div>
    );
  }

  if (dishesError) {
    return (
      <div className="randomizer-container">
        <p role="alert">{dishesError}</p>
      </div>
    );
  }

  // Säkerhetsnät om man swipat bort alla kort
  if (!currentDish) {
    return (
      <div className="randomizer-container">
        <div className="randomizer-header">
          <h1>Slut på inspo! 🌪️</h1>
          <p>{dishes.length === 0
            ? 'Det finns inga recept att visa ännu.'
            : 'Du har gått igenom alla tillgängliga rätter.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="randomizer-container">
      <div className="randomizer-header">
        <h1>SÖK INSPO</h1>
      </div>
      
      <DishCard dish={currentDish} variant="hero">
        <div className="randomizer-actions">
          
          {/* Vänster: Nej */}
          <button type="button" className="action-btn no" onClick={() => handleAction('no')} aria-label="Nej, visa inte den här rätten">
            <Angry size={28} aria-hidden="true" />
          </button>
          
          {/* Mitten: Kanske (skickar 'maybe') */}
          <button type="button" className="action-btn maybe" onClick={() => handleAction('maybe')} aria-label="Kanske, spara rätten som kanske">
            <Meh size={28} aria-hidden="true" />
          </button>

          {/* Höger: Ja (skickar 'yes') */}
          <button type="button" className="action-btn yes" onClick={() => handleAction('yes')} aria-label="Ja, spara rätten som ja">
            <Smile size={28} aria-hidden="true" />
          </button>
          
        </div>
      </DishCard>
    </div>
  );
}
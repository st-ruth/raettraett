import { useState } from 'react';
import { X, Trash2, LockKeyhole, Dices, Dice5 } from 'lucide-react'; 
import '../styles/modal.css';
import type { MealPlanDay } from '../types/mealPlan';
import { useDishContext } from '../context/useDishContext';

interface EditDayModalProps {
  day: MealPlanDay;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDay: MealPlanDay) => void;
}

export default function EditDayModal({ day, isOpen, onClose, onSave }: EditDayModalProps) {
  const { dishes, userDishStatuses } = useDishContext();
  const [currentRecipes, setCurrentRecipes] = useState(day.recipes);

  if (!isOpen) return null;

  // Lägg till en slumpad rätt
  const handleAddRandomDish = () => {
    const yesDishes = dishes.filter(dish => userDishStatuses[dish.id] === 'yes');

    if (yesDishes.length === 0) {
      alert('Du har inga rätter i Ja-listan att slumpa fram!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * yesDishes.length);
    const randomDish = yesDishes[randomIndex];

    setCurrentRecipes([...currentRecipes, randomDish]);
  };

  // Byt ut en specifik rätt mot en ny slumpad
  const handleSwapDish = (indexToSwap: number) => {
    const yesDishes = dishes.filter(dish =>
      userDishStatuses[dish.id] === 'yes' && dish.id !== currentRecipes[indexToSwap]?.id
    );

    if (yesDishes.length === 0) {
      alert('Det finns ingen annan rätt i Ja-listan att byta till!');
      return;
    }

    // eslint-disable-next-line react-hooks/purity
    const randomDish = yesDishes[Math.floor(Math.random() * yesDishes.length)];
    
    // Kopiera arrayen och byt ut just den rätten
    const newRecipes = [...currentRecipes];
    newRecipes[indexToSwap] = randomDish;
    
    setCurrentRecipes(newRecipes);
  };

  // Ta bort en rätt
  const handleRemoveDish = (indexToRemove: number) => {
    setCurrentRecipes(currentRecipes.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const customNote = formData.get('customNote') as string;
    const isLocked = formData.get('isLocked') === 'on';

    const updatedDay: MealPlanDay = {
      ...day,
      customNote,
      recipes: currentRecipes, 
      status: isLocked 
        ? 'locked' 
        : (day.status === 'locked' ? 'generated' : day.status), 
    };

    onSave(updatedDay);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h1>{day.date} | {day.dayOfWeek}</h1>
          <button className="close-btn" onClick={onClose} aria-label="Stäng">
            <X size={24} />
          </button>
        </div>

        <form className="edit-day-form" onSubmit={handleSubmit}>
          {/* Dagens rätter */}
          <div className="form-group">
            <label>Dagens rätter</label>

            {currentRecipes.length > 0 ? (
              <div className="planned-dishes">
                {currentRecipes.map((dish, index) => (
                  <div className="planned-dish" key={`${dish.id}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ flex: 1 }}>{dish.title}</span>

                    <button
                      type="button"
                      className="swap-dish-btn"
                      onClick={() => handleSwapDish(index)}
                      aria-label={`Byt ut ${dish.title}`}
                      title={`Byt ut ${dish.title}`}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff', display: 'flex' }}
                    >
                      <Dice5 size={18} />
                    </button>

                    <button
                      type="button"
                      className="remove-dish-btn"
                      onClick={() => handleRemoveDish(index)}
                      aria-label={`Ta bort ${dish.title}`}
                      title={`Ta bort ${dish.title}`}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-dishes">Inga rätter planerade ännu.</p>
            )}

            <button 
              type="button" 
              className="add-dish-btn" 
              onClick={handleAddRandomDish}
            >
              <Dices size={18} />
              Slumpa in extra rätt
            </button>
          </div>

          {/* Kommentar */}
          <div className="form-group">
            <label htmlFor="day-note">Kommentar</label>

            <textarea
              id="day-note"
              name="customNote"
              defaultValue={day.customNote ?? ''}
              placeholder="Skriv en kommentar om dagen..."
              rows={3}
            />
          </div>

          {/* Lås dag */}
          <div className="edit-day-lock">
            <div className="edit-day-lock-label">
              <LockKeyhole size={20} />

              <div>
                <span>Lås denna dag</span>
                <small>
                  En låst dag ska inte ändras när du slumpar fram nya rätter.
                </small>
              </div>
            </div>

            <input
              type="checkbox"
              name="isLocked"
              defaultChecked={day.status === 'locked'}
              aria-label="Lås denna dag"
            />
          </div>

          {/* Knappar */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Avbryt
            </button>

            <button type="submit" className="btn-primary">
              Spara
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
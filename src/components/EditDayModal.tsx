import { X, Plus, Trash2, Lock, Unlock } from 'lucide-react';
import '../styles/editdaymodal.css';
import type { MealPlanDay } from '../types/mealPlan';

interface EditDayModalProps {
    day: MealPlanDay;
    isOpen: boolean;
    onClose: () => void;
}

export default function EditDayModal({day, isOpen, onClose}: EditDayModalProps){
    if(!isOpen) return null; 

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
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

            {day.recipes.length > 0 ? (
              <div className="planned-dishes">
                {day.recipes.map((dish) => (
                  <div className="planned-dish" key={dish.id}>
                    <span>{dish.title}</span>

                    <button
                      type="button"
                      className="remove-dish-btn"
                      aria-label={`Ta bort ${dish.title}`}
                      title={`Ta bort ${dish.title}`}
                      disabled
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-dishes">
                Inga rätter planerade ännu.
              </p>
            )}

            <button
              type="button"
              className="add-dish-btn"
              disabled
            >
              <Plus size={18} />
              Lägg till rätt
            </button>

            <small>
              Möjlighet att lägga till och ta bort rätter kopplas in senare.
            </small>
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
              {day.status === 'locked' ? (
                <Lock size={20} />
              ) : (
                <Unlock size={20} />
              )}

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
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
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
import { X, Clock, Hourglass } from 'lucide-react';
import '../styles/dishFormModal.css'; 

interface DishFormModalProps {
  isOpen: boolean;       
  onClose: () => void;   
}

export default function DishFormModal({ isOpen, onClose }: DishFormModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  // Förhindra att sidan i bakgrunden scrollas när modalen är öppen
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        
        <div className="modal-header">
          <h2>Skapa ny maträtt</h2>
          <button className="close-btn" onClick={onClose} aria-label="Stäng">
            <X size={24} />
          </button>
        </div>
        
        <form className="dish-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dish-title">Titel på rätten *</label>
            <input id="dish-title" type="text" name="title" placeholder="t.ex. Tacos" required />
          </div>

          <div className="form-group">
            <p className="form-group-label">När passar rätten bäst? *</p>
            <div className="form-checkboxes preferred-days-options">
              <label className="checkbox-label">
                <input type="radio" name="preferredDays" value="weekdays" required />
                <span>Vardagar</span>
              </label>
              <label className="checkbox-label">
                <input type="radio" name="preferredDays" value="weekends" />
                <span>Helger</span>
              </label>
              <label className="checkbox-label">
                <input type="radio" name="preferredDays" value="both" />
                <span>Båda</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="protein-type">Huvudprotein *</label>
            <select id="protein-type" name="proteinType" defaultValue="" required>
              <option value="" disabled>Välj protein...</option>
              <option value="mince">Färs</option>
              <option value="chicken">Kyckling</option>
              <option value="sausage">Korv</option>
              <option value="meat">Kött</option>
              <option value="pork">Fläsk/Gris</option>
              <option value="fish">Fisk</option>
              <option value="stew">Gryta</option>
              <option value="soup">Soppa</option>
              <option value="cheese">Ost</option>
              <option value="egg">Ägg</option>
              <option value="mushroom">Svamp</option>
              <option value="pulled">Pulled</option>
              <option value="legumes">Baljväxter</option>
              <option value="other">Övrigt</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dish-category">Kategori</label>
            <input id="dish-category" type="text" name="category" placeholder="t.ex. Husman" />
          </div>

          <div className="form-group">
            <label htmlFor="carb-type">Kolhydratkälla</label>
            <select id="carb-type" name="carbType" defaultValue="">
              <option value="" disabled>Välj tillbehör...</option>
              <option value="pasta">Pasta</option>
              <option value="rice">Ris</option>
              <option value="potatoes">Potatis</option>
              <option value="salad">Sallad</option>
              <option value="bulgur_couscous">Bulgur/Couscous</option>
              <option value="noodles">Nudlar</option>
              <option value="bread">Bröd</option>
              <option value="other">Övrigt</option>
            </select>
          </div>

        <div className="form-checkboxes">
            <label className="checkbox-label">
              {/* Radioknappar med samma 'name' gör att bara en kan väljas */}
              <input type="radio" name="cookingTime" value="quick" />
              <span><Clock size={16} aria-hidden="true" /> Snabbmat (&lt; 30 min)</span>
            </label>
            
            <label className="checkbox-label">
              <input type="radio" name="cookingTime" value="slow" />
              <span><Hourglass size={16} aria-hidden="true" /> Långkok / Tar extra tid</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn-primary">Spara</button>
          </div>
          <p className="required-fields-note">*Obligatoriska fält</p>
        </form>

      </div>
    </div>
  );
}
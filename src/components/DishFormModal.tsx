import { useId, useState } from 'react';
import { X, Clock, Hourglass } from 'lucide-react';
import { useDishContext } from '../context/useDishContext';
import type { CarbType, Dish, PreferredDays, ProteinType } from '../types/dish';
import '../styles/modal.css';
import '../styles/dishFormModal.css'; 
import { useAccessibleModal } from '../hooks/useAccessibleModal';

const preferredDayOptions: readonly PreferredDays[] = ['weekdays', 'weekends', 'both'];
const proteinOptions: readonly ProteinType[] = [
  'mince', 'chicken', 'sausage', 'meat', 'pork', 'fish', 'stew',
  'soup', 'cheese', 'egg', 'mushroom', 'pulled', 'legumes', 'other',
];
const carbOptions: readonly CarbType[] = [
  'pasta', 'rice', 'potatoes', 'salad', 'bulgur_couscous', 'noodles', 'bread', 'other',
];

const isChoice = <T extends string>(
  options: readonly T[],
  value: FormDataEntryValue | null
): value is T => typeof value === 'string' && options.some(option => option === value);

interface DishFormModalProps {
  isOpen: boolean;       
  onClose: () => void;   
}

export default function DishFormModal({ isOpen, onClose }: DishFormModalProps) {
  const { addDish } = useDishContext();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const titleId = useId();
  const handleClose = () => {
    if (!isSaving) onClose();
  };
  const dialogRef = useAccessibleModal(isOpen, handleClose);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title');
    const preferredDays = formData.get('preferredDays');
    const proteinType = formData.get('proteinType');
    const carbType = formData.get('carbType');
    const cookingTime = formData.get('cookingTime');

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      !isChoice(preferredDayOptions, preferredDays) ||
      !isChoice(proteinOptions, proteinType)
    ) {
      window.alert('Fyll i rättens namn, passande dagar och huvudprotein.');
      return;
    }

    const dish: Omit<Dish, 'id'> = {
      title: title.trim(),
      preferredDays,
      proteinType,
    };

    const category = formData.get('category');
    if (typeof category === 'string' && category.trim()) {
      dish.category = category.trim();
    }

    if (isChoice(carbOptions, carbType)) {
      dish.carbType = carbType;
    }

    if (cookingTime === 'quick') {
      dish.isQuick = true;
    } else if (cookingTime === 'slow') {
      dish.isSlowCooked = true;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const savedDish = await addDish(dish);
      if (!savedDish) {
        setSaveError('Maträtten kunde inte sparas. Försök igen.');
        return;
      }
      onClose();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Det gick inte att spara maträtten. Försök igen.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Stäng modalen vid klick på bakgrunden
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSaving) {
      handleClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={dialogRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-a11y-dialog="true"
        tabIndex={-1}
      >
        
        <div className="modal-header">
          <h2 id={titleId}>Skapa ny maträtt</h2>
          <button type="button" className="close-btn" onClick={handleClose} aria-label="Stäng" disabled={isSaving}>
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        
        <form className="dish-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dish-title">Titel på rätten *</label>
            <input id="dish-title" type="text" name="title" placeholder="t.ex. Tacos" required />
          </div>

          <div className="form-group">
            <fieldset className="radio-group">
              <legend className="form-group-label">När passar rätten bäst? *</legend>
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
            </fieldset>
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

        <fieldset className="radio-group form-group">
          <legend className="form-group-label">Tillagningstid</legend>
          <div className="form-checkboxes">
            <label className="checkbox-label">
            
              <input type="radio" name="cookingTime" value="quick" />
              <span><Clock size={16} aria-hidden="true" /> Snabbmat (&lt; 30 min)</span>
            </label>
            
            <label className="checkbox-label">
              <input type="radio" name="cookingTime" value="slow" />
              <span><Hourglass size={16} aria-hidden="true" /> Långkok / Tar extra tid</span>
            </label>
          </div>
        </fieldset>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleClose} disabled={isSaving}>Avbryt</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Sparar...' : 'Spara'}
            </button>
          </div>
          {saveError && <p role="alert">{saveError}</p>}
          <p className="required-fields-note">*Obligatoriska fält</p>
        </form>

      </div>
    </div>
  );
}
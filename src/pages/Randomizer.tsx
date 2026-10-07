import { Smile, Meh, Angry } from 'lucide-react';
import DishCard from '../components/DishCard';
import { useDishContext } from '../context/useDishContext'; 
import '../styles/randomizer.css'; 

export default function Randomizer() {
  const { currentDish, randomizeDish } = useDishContext();

  const handleAction = (actionType: string) => {
    console.log(`Du klickade: ${actionType}`);
    randomizeDish();
  };

  return (
    <div className="randomizer-container">
      <div className="randomizer-header">
        <h2>SÖK INSPO</h2>
      </div>
      
      <DishCard dish={currentDish} variant="hero">
        <div className="randomizer-actions">
          {/* Ikoner med aria-labels för skärmläsare */}

          <button className="action-btn no" onClick={() => handleAction('nej')} aria-label="nej">
            <Angry size={28} />
          </button>
          
          <button className="action-btn maybe" onClick={() => handleAction('kanske')} aria-label="kanske">
            <Meh size={28} />
          </button>

          <button className="action-btn yes" onClick={() => handleAction('ja')} aria-label="ja">
            <Smile size={28} />
          </button>
          
          
        </div>
      </DishCard>
    </div>
  );
}
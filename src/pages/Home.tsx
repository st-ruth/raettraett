import { useNavigate } from 'react-router-dom';
import { Dices, MessageSquareMore } from 'lucide-react';
import DishCard from '../components/DishCard';
import { useDishContext } from '../context/useDishContext';
import '../styles/actionButtons.css';
import '../styles/randomizer.css';

export default function Home() {
  const { mealPlan, randomizeMealPlanDay } = useDishContext();
  
  const navigate = useNavigate();
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  const todayString = new Date(today.getTime() - offset).toISOString().slice(0, 10);
  const todayPlan = mealPlan.find(day => day.date === todayString);
  const dateLabel = today.toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });
  const homeActions = (
    <HomeActions
      onRandomize={() => randomizeMealPlanDay(todayString)}
      onShowWeeklyPlan={() => navigate('/kalender')}
      isLocked={todayPlan?.status === 'locked'}
    />
  );

  return (
    <div className="randomizer-container">
      <div className="randomizer-header">
        <h1>ÄT DETTA IDAG</h1>
      </div>
      
      <div className="home-day-content">
        {todayPlan?.status === 'eating_out' ? (
          <DishCard title="Äter borta" dateLabel={dateLabel} variant="hero">
            {homeActions}
          </DishCard>
        ) : todayPlan?.recipes.length ? (
          <DishCard
            dish={todayPlan.recipes.length === 1 ? todayPlan.recipes[0] : undefined}
            recipes={todayPlan.recipes}
            dateLabel={dateLabel}
            variant="hero"
          >
            {homeActions}
          </DishCard>
        ) : todayPlan?.customNote ? (
          <div className="home-day-card">
            <HomeDayNote note={todayPlan.customNote} />
            {homeActions}
          </div>
        ) : (
          <DishCard title="Inget planerat" dateLabel={dateLabel} variant="hero">
            {homeActions}
          </DishCard>
        )}
        {todayPlan?.customNote && (todayPlan.recipes.length > 0 || todayPlan.status === 'eating_out') && (
          <HomeDayNote note={todayPlan.customNote} />
        )}
      </div>
    </div>
  );
}

interface HomeActionsProps {
  onRandomize: () => void;
  onShowWeeklyPlan: () => void;
  isLocked: boolean;
}

function HomeActions({ onRandomize, onShowWeeklyPlan, isLocked }: HomeActionsProps) {
  return (
    <div className="home-actions">
      <button
        type="button"
        className="action-btn"
        onClick={onRandomize}
        aria-label="Slumpa om dagens rätt"
        title={isLocked ? 'Dagen är låst' : 'Slumpa om dagens rätt'}
        disabled={isLocked}
      >
        <Dices size={20} aria-hidden="true" />
      </button>

      <button
        type="button"
        className="home-weekly-btn"
        onClick={onShowWeeklyPlan}
      >
        VECKANS MATSEDEL
      </button>
    </div>
  );
}

function HomeDayNote({ note }: { note: string }) {
  return (
    <div className="home-day-note">
      <MessageSquareMore size={20} aria-hidden="true" />
      <p>{note}</p>
    </div>
  );
}
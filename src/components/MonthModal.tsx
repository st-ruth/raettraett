import { useState } from 'react';
import { LockKeyhole, X, MessageSquareMore } from 'lucide-react';
import '../styles/modal.css';
import EditDayModal from '../components/EditDayModal';
import { useDishContext } from '../context/useDishContext';
import type { MealPlanDay } from '../types/mealPlan';

interface MonthModalProps {
  onClose: () => void;
}

export default function MonthModal({ onClose }: MonthModalProps) {
  const today = new Date();

  const { mealPlan, updateMealPlanDay, randomizeMealPlan } = useDishContext(); 

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const formatDate = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 10);
  };

  const generateDays = () => {
    const days = [];
    const startDate = new Date(today);

    const dayOfWeek = startDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diffToMonday);

    for (let i = 0; i < 35; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push(currentDate);
    }

    return days;
  };

  const calendarDays = generateDays();
  const weekDays = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

  const selectedDateString = selectedDate ? formatDate(selectedDate) : null;
  const dayToEdit: MealPlanDay | null = selectedDateString
    ? mealPlan.find((plan) => plan.date === selectedDateString) || {
        id: selectedDateString,
        date: selectedDateString,
        dayOfWeek: selectedDate!.toLocaleDateString('sv-SE', {
          weekday: 'long',
        }),
        status: 'generated',
        recipes: [],
      }
    : null;

  return (
    <div className="month-modal-overlay">
      <div className="month-modal-content">

        {/* Header */}
        <div className="month-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ cursor: 'pointer' }}>&lt;</span>
            <h2>v.39-v43</h2>
          </div>

          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Stäng"
          >
            <X size={24} />
          </button>
        </div>

        <div className="calendar-grid">
          {weekDays.map((day, i) => (
            <div key={`header-${i}`} className="grid-header-cell">
              {day}
            </div>
          ))}

          {calendarDays.map((date, i) => {
            const isPast =
              date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            const isToday = date.toDateString() === new Date().toDateString();
            const currentDateString = formatDate(date);

            const plannedDay = mealPlan.find(
              plan => plan.date === currentDateString
            );

            return (
              <div
                key={i}
                className={`grid-cell ${isPast ? 'past-day' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => setSelectedDate(date)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                {/* Datum */}
                <span className="date-number">{date.getDate()}</span>

                {/* Visa dagens planerade mat */}
                {!isPast && plannedDay && (
                  <>
                    {plannedDay.status === 'eating_out' ? (
                      <span className="cell-dish-title cell-day-status" style={{ color: '#aaa' }}>
                        BORTA
                      </span>
                    ) : plannedDay.recipes.length > 0 ? (
                      <>
                        <div className="cell-dishes-desktop">
                          {plannedDay.recipes.map((recipe, recipeIndex) => (
                            <span
                              className="cell-dish-title"
                              key={`${recipe.id}-${recipeIndex}`}
                            >
                              {recipe.title}
                            </span>
                          ))}
                        </div>
                        <span className="cell-dish-title cell-dish-mobile">
                          {plannedDay.recipes[0].title}
                          {plannedDay.recipes.length > 1 && ` (+${plannedDay.recipes.length - 1})`}
                        </span>
                      </>
                    ) : plannedDay.customNote ? (
                      <span className="cell-dish-title cell-day-status" style={{ color: '#aaa' }}>
                        {/* Visa bara en ikon om det inte finns mat men en notering */}
                        <MessageSquareMore size={16} />
                      </span>
                    ) : null}

                    {/* Låsmarkering uppe i hörnet */}
                    {plannedDay.status === 'locked' && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                        }}
                      >
                        <LockKeyhole size={12} aria-label="Låst" />
                      </span>
                    )}

                    {/* Kommentar-ikon nere i hörnet (om det finns både mat och kommentar) */}
                    {plannedDay.customNote && plannedDay.recipes.length > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '4px',
                        }}
                      >
                        <MessageSquareMore size={12} />
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottenknapp */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '24px',
          }}
        >
          <button
            onClick={randomizeMealPlan}
            style={{
              backgroundColor: '#111',
              color: '#fff',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '4px',
              letterSpacing: '1px',
              cursor: 'pointer'
            }}
          >
            SLUMPA NY
          </button>
        </div>

      </div>

      {selectedDate && dayToEdit && (
        <EditDayModal
          day={dayToEdit}
          isOpen={true}
          onClose={() => setSelectedDate(null)}
          onSave={(updatedDay) => {
            updateMealPlanDay(updatedDay);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}
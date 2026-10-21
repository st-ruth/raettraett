import { useId, useState } from 'react';
import { LockKeyhole, X, MessageSquareMore } from 'lucide-react';
import '../styles/modal.css';
import EditDayModal from '../components/EditDayModal';
import { useDishContext } from '../context/useDishContext';
import { useAuth } from '../context/useAuth';
import { AUTH_REQUIRED_MESSAGE } from '../context/AuthContext';
import type { MealPlanDay } from '../types/mealPlan';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

interface MonthModalProps {
  onClose: () => void;
}

export default function MonthModal({ onClose }: MonthModalProps) {
  const today = new Date();
  const titleId = useId();
  const dialogRef = useAccessibleModal(true, onClose);

  const { mealPlan, updateMealPlanDay, randomizeMealPlan } = useDishContext(); 
  const { requireAuth } = useAuth();

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
      <div
        ref={dialogRef}
        className="month-modal-content"
        role={selectedDate ? undefined : 'dialog'}
        aria-modal={selectedDate ? undefined : true}
        aria-hidden={Boolean(selectedDate)}
        inert={Boolean(selectedDate)}
        aria-labelledby={titleId}
        data-a11y-dialog="true"
        tabIndex={-1}
      >

        {/* Header */}
        <div className="month-modal-header">
          <div className="month-modal-heading">
            <h2 id={titleId}>Matsedel</h2>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Stäng"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        <div className="calendar-grid">
          {weekDays.map((day, i) => (
            <div key={`header-${i}`} className="grid-header-cell" aria-hidden="true">
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
              <button
                type="button"
                key={i}
                className={`grid-cell ${isPast ? 'past-day' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => {
                  if (requireAuth(AUTH_REQUIRED_MESSAGE)) setSelectedDate(date);
                  else onClose();
                }}
                aria-label={`${date.toLocaleDateString('sv-SE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}${plannedDay?.recipes.length ? `: ${plannedDay.recipes.map(recipe => recipe.title).join(', ')}` : ''}${plannedDay?.status === 'eating_out' ? ': äter borta' : ''}${(!plannedDay || (!plannedDay.recipes.length && plannedDay.status !== 'eating_out' && !plannedDay.customNote)) ? ': ingen planerad måltid' : ''}${plannedDay?.status === 'locked' ? ', låst dag' : ''}${plannedDay?.customNote ? `, personlig notis: ${plannedDay.customNote}` : ''}. Öppna planeringen för dagen.`}
              >
                {/* Datum */}
                <span className="date-number">{date.getDate()}</span>

                {/* Visa dagens planerade mat */}
                {plannedDay && (
                  <>
                    {plannedDay.status === 'eating_out' ? (
                      <span className="cell-dish-title cell-day-status">
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
                      <span className="cell-dish-title cell-day-status">
                        {/* Visa bara en ikon om det inte finns mat men en notering */}
                        <MessageSquareMore size={16} />
                      </span>
                    ) : null}

                    {/* Låsmarkering uppe i hörnet */}
                    {plannedDay.status === 'locked' && (
                      <span
                        className="month-cell-lock"
                      >
                        <LockKeyhole size={12} aria-hidden="true" />
                      </span>
                    )}

                    {/* Kommentar-ikon nere i hörnet (om det finns både mat och kommentar) */}
                    {plannedDay.customNote && plannedDay.recipes.length > 0 && (
                      <span
                        className="month-cell-note"
                      >
                        <MessageSquareMore size={12} aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottenknapp */}
        <div className="month-modal-actions">
          <button
            type="button"
            className="month-randomize-btn"
            onClick={() => {
              if (requireAuth(AUTH_REQUIRED_MESSAGE)) randomizeMealPlan();
              else onClose();
            }}
          >
            SLUMPA
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
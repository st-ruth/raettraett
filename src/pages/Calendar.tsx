import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Ghost, MessageSquareMore } from 'lucide-react';
import MonthModal from '../components/MonthModal';
import DishCard from '../components/DishCard';
import { useDishContext } from '../context/useDishContext'; 
import { useAuth } from '../context/useAuth';
import '../styles/calendar.css';

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
};

export default function CalendarPage() {
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState(getMonday(new Date()));
  const [activeDate, setActiveDate] = useState(new Date());
  const hasCheckedAuthOnEntry = useRef(false);

  const { mealPlan } = useDishContext();
  const { user, loading, requireAuth } = useAuth();

  useEffect(() => {
    if (loading || hasCheckedAuthOnEntry.current) return;
    hasCheckedAuthOnEntry.current = true;
    if (!user) requireAuth('Logga in för att spara ändringar och använda personliga funktioner.');
  }, [loading, user, requireAuth]);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const handlePrevWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStartDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStartDate(newDate);
  };

  const formatDate = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 10);
  };

  const dynamicMealPlan = weekDays.map((date) => {
    const dateStr = formatDate(date);
    const plannedDay = mealPlan.find(plan => plan.date === dateStr);

    return {
      id: date.toISOString(),
      date: date,
      plannedDay: plannedDay 
    };
  });

  const cardsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = cardsContainerRef.current;
    if (!container) return;

    let animationFrameId = 0;

    const updateCenteredCard = () => {
      animationFrameId = 0;
      const viewportCenter = window.innerHeight / 2;
      const cards = Array.from(container.querySelectorAll<HTMLElement>('.calendar-day-card'));
      const centeredCard = cards.reduce<HTMLElement | null>((closest, card) => {
        if (!closest) return card;
        const cardCenter = card.getBoundingClientRect().top + card.offsetHeight / 2;
        const closestCenter =
          closest.getBoundingClientRect().top + closest.offsetHeight / 2;
        return Math.abs(cardCenter - viewportCenter) < Math.abs(closestCenter - viewportCenter)
          ? card
          : closest;
      }, null);

      const dateString = centeredCard?.getAttribute('data-date');
      if (!dateString) return;

      const newDate = new Date(dateString);
      setActiveDate(prevDate =>
        prevDate.toDateString() === newDate.toDateString() ? prevDate : newDate
      );
    };

    const scheduleUpdate = () => {
      if (animationFrameId === 0) {
        animationFrameId = window.requestAnimationFrame(updateCenteredCard);
      }
    };

    container.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();

    return () => {
      container.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [weekStartDate]);

  const scrollToCard = (date: Date) => {
    const element = document.querySelector(`[data-date="${date.toISOString()}"]`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Scrolla till dagens kort vid laddning
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const timeoutId = window.setTimeout(() => {
      const cards = document.querySelectorAll('.calendar-day-card');
      const todayCard = Array.from(cards).find((card) => {
        const cardDate = new Date(card.getAttribute('data-date') || '').toDateString();
        return cardDate === todayStr;
      });

      // Centrera dagens kort så att det inte hamnar under toppmenyn
      todayCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="calendar-page">
      <h1 className="visually-hidden">Kalender</h1>

      {/* Veckoremsan */}
      <div className="calendar-top-strip">
        <div className="strip-header">
           <button
             type="button"
             onClick={handlePrevWeek}
             className="strip-arrow"
             aria-label="Visa föregående vecka"
           >
             <ChevronLeft size={20} aria-hidden="true" />
           </button>
           <h2>Vecka {getWeekNumber(weekStartDate)}</h2>
           <button
             type="button"
             onClick={handleNextWeek}
             className="strip-arrow"
             aria-label="Visa nästa vecka"
           >
             <ChevronRight size={20} aria-hidden="true" />
           </button>
        </div>
        
       <div className="strip-boxes">
          {dynamicMealPlan.map((plan, i) => {
            const isToday = plan.date.toDateString() === new Date().toDateString();
            const isScrolledInFocus = plan.date.toDateString() === activeDate.toDateString();
            const dayLetters = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

            return (
              <button
                type="button"
                key={plan.id} 
                className={`strip-box ${isScrolledInFocus ? 'scrolled-active' : ''}`}
                onClick={() => scrollToCard(plan.date)} 
                aria-current={isToday ? 'date' : undefined}
                aria-label={`Visa ${plan.date.toLocaleDateString('sv-SE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}${plan.plannedDay?.recipes.length ? `: ${plan.plannedDay.recipes.map(recipe => recipe.title).join(', ')}` : ''}${plan.plannedDay?.status === 'eating_out' ? ': äter borta' : ''}${(!plan.plannedDay || (!plan.plannedDay.recipes.length && plan.plannedDay.status !== 'eating_out' && !plan.plannedDay.customNote)) ? ': ingen planerad måltid' : ''}${plan.plannedDay?.customNote ? ', personlig notis' : ''}`}
              >
                <div className={`day-letter ${isToday ? 'is-today' : ''}`} aria-hidden="true">
                  {dayLetters[i]}
                </div>
                <span className="strip-dish-title strip-dish-title-mobile">
                  {!plan.plannedDay ||
                  (!plan.plannedDay.recipes.length &&
                    plan.plannedDay.status !== 'eating_out' &&
                    !plan.plannedDay.customNote) ? (
                    <Ghost
                      className="strip-status-ghost"
                      size={20}
                      aria-hidden="true"
                    />
                  ) : plan.plannedDay.status === 'eating_out' ? (
                    'BORTA'
                  ) : plan.plannedDay?.recipes.length ? (
                    <>
                      <span className="strip-dish-mobile-name">
                        {plan.plannedDay.recipes[0].title}
                      </span>
                      {plan.plannedDay.recipes.length > 1 && (
                        <span className="strip-dish-mobile-count">
                          (+{plan.plannedDay.recipes.length - 1})
                        </span>
                      )}
                    </>
                  ) : (
                    plan.plannedDay?.customNote ? 'NOTERING' : null
                  )}
                  {plan.plannedDay?.customNote && (
                    <MessageSquareMore
                      className="strip-note-icon"
                      size={14}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <div className="strip-dishes-desktop">
                  {plan.plannedDay?.status === 'eating_out' ? (
                    <span className="strip-dish-title">BORTA</span>
                  ) : plan.plannedDay?.recipes.length ? (
                    plan.plannedDay.recipes.map((recipe, index) => (
                      <span className="strip-dish-title" key={`${recipe.id}-${index}`}>
                        {recipe.title}
                      </span>
                    ))
                  ) : (
                    plan.plannedDay?.customNote ? (
                      <span className="strip-dish-title">NOTERING</span>
                    ) : (
                      <Ghost
                        className="strip-status-ghost"
                        size={24}
                        aria-hidden="true"
                      />
                    )
                  )}
                  {plan.plannedDay?.customNote && (
                    <MessageSquareMore
                      className="strip-note-icon"
                      size={16}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kortvyn med scrollning */}
      <div className="calendar-cards-container" ref={cardsContainerRef}>
        {dynamicMealPlan.map((day) => {
          const dateLabel = day.date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'numeric' });
          
          return (
            <div 
              key={day.id} 
              className="calendar-day-card"
              data-date={day.date.toISOString()}
            >
              {!day.plannedDay ? (
                <DishCard
                  title="Inget planerat"
                  dateLabel={dateLabel}
                  variant="calendar"
                  showGhostBadge
                />
              ) : (
                <div className="calendar-day-content">
                  {day.plannedDay.status === 'eating_out' ? (
                    <DishCard title="Äter borta" dateLabel={dateLabel} variant="calendar" />
                  ) : day.plannedDay.recipes.length > 0 ? (
                    day.plannedDay.recipes.length > 1 ? (
                      <DishCard
                        recipes={day.plannedDay.recipes}
                        dateLabel={dateLabel}
                        variant="calendar"
                      />
                    ) : (
                      <DishCard
                        dish={day.plannedDay.recipes[0]}
                        dateLabel={dateLabel}
                        variant="calendar"
                      />
                    )
                  ) : (
                    !day.plannedDay.customNote && (
                      <DishCard
                        title="Inget planerat"
                        dateLabel={dateLabel}
                        variant="calendar"
                        showGhostBadge
                      />
                    )
                  )}

                  {day.plannedDay.customNote && (
                    <div
                      className={`calendar-day-note ${
                        day.plannedDay.status === 'eating_out' || day.plannedDay.recipes.length > 0
                          ? 'calendar-day-note-after-card'
                          : ''
                      }`}
                    >
                      <MessageSquareMore size={20} aria-hidden="true" />
                      <p>{day.plannedDay.customNote}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky-btn-container">
        <button type="button" className="sticky-month-btn" onClick={() => setIsMonthModalOpen(true)}>
          Matsedel
        </button>
      </div>

      {isMonthModalOpen && <MonthModal onClose={() => setIsMonthModalOpen(false)} />}
    </div>
  );
}
import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MonthModal from '../components/MonthModal';
import DishCard from '../components/DishCard';
import { useDishContext } from '../context/useDishContext'; 
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

  const { dishes } = useDishContext();
  const calendarDishes = dishes.filter(dish => dish.status === 'yes' || dish.status === 'repo');

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

  const dynamicMealPlan = weekDays.map((date, index) => {
    const dishForDay = calendarDishes[index % calendarDishes.length]; 
    return {
      id: date.toISOString(),
      date: date,
      title: dishForDay ? dishForDay.title : 'LEDIGT',
      dish: dishForDay 
    };
  });

  // 1. Vi använder Intersection Observer istället!
  // Detta ref håller koll på själva containern
  const observer = useRef<IntersectionObserver | null>(null);

  // 2. Denna callback-funktion körs på VARJE dagskort när det ritas ut.
  // Den kopplar webbläsarens "ögat" (observer) till kortet.
  const cardRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (!node) return; // Om kortet försvinner, bry dig inte

    // Skapa bara observern EN gång
    if (!observer.current) {
      observer.current = new IntersectionObserver(
        (entries) => {
          // Gå igenom alla kort som webbläsaren kollade på nu
          entries.forEach(entry => {
            // Om kortet är synligt (intersecting) till mer än 50%
            if (entry.isIntersecting) {
               // Fiska upp vilket datum kortet har (vi sparade det i data-date på div:en)
               const dateString = entry.target.getAttribute('data-date');
               if (dateString) {
                  const newDate = new Date(dateString);
                  // Uppdatera bara om det är en ny dag!
                  setActiveDate(prevDate => {
                    if (prevDate.toDateString() !== newDate.toDateString()) {
                       return newDate;
                    }
                    return prevDate;
                  });
               }
            }
          });
        },
        { 
          // Roten är själva fönstret
          root: null, 
          // Kortet måste synas till 50% för att räknas som "aktivt"
          threshold: 0.5 
        }
      );
    }
    
    // Tala om för webbläsaren att bevaka detta specifika kort
    observer.current.observe(node);
  }, []); // Tom array betyder "skapa denna funktion bara en gång"


  // En funktion för att klicka och rulla (som vi behåller)
  const scrollToCard = (date: Date) => {
    setActiveDate(date);
    // Leta upp kortet i webbläsaren (eftersom vi satte data-date på det)
    const element = document.querySelector(`[data-date="${date.toISOString()}"]`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  return (
    <div className="calendar-page">
      
      {/* --- TOP STRIP --- */}
      <div className="calendar-top-strip">
        <div className="strip-header">
           <button onClick={handlePrevWeek} className="strip-arrow"><ChevronLeft size={20} /></button>
           <h3>v. {getWeekNumber(weekStartDate)}</h3>
           <button onClick={handleNextWeek} className="strip-arrow"><ChevronRight size={20} /></button>
        </div>
        
       <div className="strip-boxes">
          {dynamicMealPlan.map((plan, i) => {
            // 1. Är det här kortet samma datum som IDAG (den 14/10)?
            const isToday = plan.date.toDateString() === new Date().toDateString();
            
            // 2. Är det här kortet i fokus i vår infinity scroll just nu?
            const isScrolledInFocus = plan.date.toDateString() === activeDate.toDateString();
            
            const dayLetters = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

            return (
              <div 
                key={plan.id} 
                // Om vi tittar på detta kort i listan, ge det klassen "scrolled-active"
                className={`strip-box ${isScrolledInFocus ? 'scrolled-active' : ''}`}
                onClick={() => scrollToCard(plan.date)} 
              >
                {/* Den lilla bokstaven. Om dagen är IDAG, får den klassen 'is-today' (svart boll) */}
                <div className={`day-letter ${isToday ? 'is-today' : ''}`}>
                  {dayLetters[i]}
                </div>
                <span className="strip-dish-title">{plan.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- KORT-VYN (Infinity scroll) --- */}
      <div className="calendar-cards-container">
        {dynamicMealPlan.map((day) => {
          return (
            <div 
              key={day.id} 
              className="calendar-day-card"
              // 3. Vi fäster vår "ögon-funktion" på kortet här
              ref={cardRefCallback}
              // 4. Vi sparar datumet som text direkt på div:en, så att observern kan läsa av det!
              data-date={day.date.toISOString()}
            >
              <DishCard
                dish={day.dish}
                title={day.title}
                dateLabel={day.date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                variant="calendar"
              />
            </div>
          );
        })}
      </div>

      <div className="sticky-btn-container">
        <button className="sticky-month-btn" onClick={() => setIsMonthModalOpen(true)}>
          30 DAGAR
        </button>
      </div>

      {isMonthModalOpen && <MonthModal onClose={() => setIsMonthModalOpen(false)} />}
    </div>
  );
}
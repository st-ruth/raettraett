import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MonthModal from '../components/MonthModal';
import DishCard from '../components/DishCard'; // Glöm inte importera komponenten!
import { mockMealPlan } from '../data/dummyData';
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

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

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
          {weekDays.map((date, i) => {
            const dateStr = formatDate(date);
            const plannedDay = mockMealPlan.find(plan => plan.date === dateStr);
            const isToday = date.toDateString() === new Date().toDateString();
            const isActive = date.toDateString() === activeDate.toDateString();
            const dayLetters = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

            return (
              <div 
                key={dateStr} 
                className={`strip-box ${isActive ? 'active' : ''}`}
                onClick={() => setActiveDate(date)} 
              >
                <div className={`day-letter ${isToday ? 'is-today' : ''}`}>
                  {dayLetters[i]}
                </div>
                
                {/* 1. Använd DishCard med variant="strip" */}
                {plannedDay && plannedDay.status !== 'eating_out' && plannedDay.recipes.length > 0 && (
                  <DishCard dish={plannedDay.recipes[0]} variant="strip" />
                )}

                {plannedDay?.status === 'eating_out' && (
                  <span className="strip-dish-title text-muted">BORTA</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 3-DAGARSVYN (Huvudinnehåll) --- */}
      <div className="calendar-cards-container">
        {mockMealPlan.map((day) => {
          
          // Visa egna anteckningar i samma kalenderkort som maträtter.
          if (day.status === 'eating_out') {
            return (
              <DishCard
                key={day.id}
                title={day.customNote ?? 'BORTA'}
                dateLabel={day.date}
                variant="calendar"
              />
            );
          }

          // Säkerhetskontroll: om dagen saknar recept, visa ingenting
          if (!day.recipes || day.recipes.length === 0) return null;

          // 2. Använd DishCard med variant="calendar" för de stora korten!
          return (
            <DishCard 
              key={day.id} 
              dish={day.recipes[0]} 
              dateLabel={day.date} 
              variant="calendar"
            >
              <button className="swap-btn">SLUMPA NY</button>
            </DishCard>
          );
        })}
      </div>

      <div className="sticky-btn-container">
        <button className="sticky-month-btn" onClick={() => setIsMonthModalOpen(true)}>
          MÅNADSVY
        </button>
      </div>

      {isMonthModalOpen && <MonthModal onClose={() => setIsMonthModalOpen(false)} />}
    </div>
  );
}
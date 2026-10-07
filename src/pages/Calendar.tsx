import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DishCard from '../components/DishCard';
import MonthModal from '../components/MonthModal';
import type { Dish } from '../types/dish';
import '../styles/calendarPage.css';

// Tillfällig dummy-data för att exakt återskapa din skiss
const mockDays = [
  { id: '1', date: 'Tisdag 22/9', title: 'KORVSTROGANOFF', hasTime: true },
  { id: '2', date: 'Onsdag 23/9', title: 'SOPPA', hasTime: true },
  { id: '3', date: 'Torsdag 24/9', title: 'FLÄSKPANNKAKA', hasTime: false }
];

export default function CalendarPage() {
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  return (
    <div className="calendar-page">
      
      {/* 1. Den låsta 7-dagarsstrippen i toppen */}
      <div className="calendar-top-strip">
        <div className="strip-header">
          <h3>MATSEDEL</h3>
          <div className="strip-divider"></div>
          <div className="strip-arrows">
            <ChevronLeft size={20} />
            <ChevronRight size={20} />
          </div>
        </div>
        <div className="strip-boxes">
          {/* 7 rutor för veckans dagar */}
          {[...Array(7)].map((_, i) => (
            <div key={i} className="strip-box"></div>
          ))}
        </div>
      </div>

      {/* 2. De stora rullande dagskorten (3-dagarsvyn) */}
      <div className="calendar-cards-container">
        {mockDays.map((day) => (
          <DishCard
            key={day.id}
            dish={{
              id: day.id,
              title: day.title,
              status: 'repo',
              category: '',
            } satisfies Dish}
            variant="calendar"
            dateLabel={day.date}
            showClockBadge={day.hasTime}
          />
        ))}
      </div>

      {/* 3. Den flytande svarta knappen "MÅNADSVY" */}
      <button 
        className="sticky-month-btn"
        onClick={() => setIsMonthModalOpen(true)}
      >
        MÅNADSVY
      </button>

      {/* 4. Månadsöversikten vi byggde tidigare fälls upp här */}
      {isMonthModalOpen && <MonthModal onClose={() => setIsMonthModalOpen(false)} />}
    </div>
  );
}
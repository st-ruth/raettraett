// här byggs mitt 30 dagars vy 

import { X } from 'lucide-react';
import '../styles/monthModal.css';

interface MonthModalProps {
  onClose: () => void;
}

export default function MonthModal({ onClose }: MonthModalProps) {
  // För tillfället hårdkodar vi dagens datum för att testa layouten
  const today = new Date();
  
  // Genererar en array med 35 dagar (5 veckor) för rutnätet
  const generateDays = () => {
    const days = [];
    // Skapa en kopia av dagens datum för att manipulera
    const startDate = new Date(today);
    
    // Backa till senaste måndagen (veckans första dag)
    const dayOfWeek = startDate.getDay(); // 0 = Söndag, 1 = Måndag...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diffToMonday);

    // Generera 35 dagar framåt (5 rader * 7 kolumner)[cite: 3]
    for (let i = 0; i < 35; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push(currentDate);
    }
    return days;
  };

  const calendarDays = generateDays();
  const weekDays = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

  return (
    <div className="month-modal-overlay">
      <div className="month-modal-content">
        
        <div className="month-modal-header">
          <h2>Rullande Matsedel</h2>
          <button className="close-btn" onClick={onClose} aria-label="Stäng">
            <X size={24} />
          </button>
        </div>

        {/* Kalenderns rutnät */}
        <div className="calendar-grid">
          {/* Veckodagarna i toppen */}
          {weekDays.map((day, i) => (
            <div key={`header-${i}`} className="grid-header-cell">
              {day}
            </div>
          ))}

          {/* Själva datumrutorna */}
          {calendarDays.map((date, i) => {
            // Kontrollera om dagen har passerat (för att göra den grå)[cite: 3]
            const isPast = date < new Date(today.setHours(0, 0, 0, 0));
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div 
                key={i} 
                className={`grid-cell ${isPast ? 'past-day' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => console.log(`Du klickade på ${date.toLocaleDateString()}`)}
              >
                <span className="date-number">{date.getDate()}</span>
                {/* Här kan vi senare lägga in lås-ikon eller emojis om dagen har ett recept[cite: 3] */}
                {!isPast && i % 4 === 0 && <span className="cell-emoji">🍝</span>} {/* Dummy-data för test */}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
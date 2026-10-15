// här byggs mitt 30 dagars vy

import { useState } from 'react';
import { X } from 'lucide-react';
import '../styles/monthModal.css';
import { mockMealPlan } from '../data/dummyData';
import EditDayModal from '../components/EditDayModal';

interface MonthModalProps {
  onClose: () => void;
}

export default function MonthModal({ onClose }: MonthModalProps) {
  const today = new Date();

  // Håller reda på vilken dag som har klickats på
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Enkel formateringshjälp
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

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

  return (
    <div className="month-modal-overlay">
      <div className="month-modal-content">

        {/* Header */}
        <div className="month-modal-header">
          <span title="Låst matsedel" style={{ cursor: 'pointer' }}>
            🔒
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ cursor: 'pointer' }}>&lt;</span>
            <h2>v.39-v43</h2>
            <span style={{ cursor: 'pointer' }}>&gt;</span>
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

            const plannedDay = mockMealPlan.find(
              plan => plan.date === currentDateString
            );

            return (
              <div
                key={i}
                className={`grid-cell ${isPast ? 'past-day' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => setSelectedDate(date)}
                style={{ cursor: 'pointer' }}
              >
                {/* Datum */}
                <span className="date-number">{date.getDate()}</span>

                {/* Visa dagens planerade mat */}
                {!isPast && plannedDay && (
                  <>
                    {plannedDay.status === 'eating_out' ? (
                      <span
                        className="cell-dish-title"
                        style={{ color: '#aaa' }}
                      >
                        BORTA
                      </span>
                    ) : (
                      <span className="cell-dish-title">
                        {plannedDay.recipes[0]?.title}
                      </span>
                    )}

                    {/* Låsmarkering */}
                    {plannedDay.status === 'locked' && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                        }}
                      >
                        📌
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
            style={{
              backgroundColor: '#111',
              color: '#fff',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '4px',
              letterSpacing: '1px',
            }}
          >
            SLUMPA NY
          </button>
        </div>

      </div>

      {/* Redigeringsmodalen visas när en dag klickas */}
      {selectedDate && (
  <EditDayModal
    day={{
      id: selectedDate.toISOString(),
      date: formatDate(selectedDate),
      dayOfWeek: selectedDate.toLocaleDateString('sv-SE', {
        weekday: 'long',
      }),
      status: 'generated',
      recipes: [],
    }}
    isOpen={true}
    onClose={() => setSelectedDate(null)}
  />
)}
    </div>
  );
}
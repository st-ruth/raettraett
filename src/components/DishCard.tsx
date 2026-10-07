import '../styles/dishCard.css';
import {ReactNode} from 'react';
import {Clock, Hourglass} from 'lucide-react';
import type {Dish} from '../types/dish';

interface DishCardProps {
  dish: Dish;
  dateLabel?: string;
  showClockBadge?: boolean;
  variant?: 'hero' | 'calendar' | 'compact'; 
  children?: ReactNode;
}

export default function DishCard({
  dish,
  dateLabel,
  showClockBadge = false,
  variant = 'calendar', children
}: DishCardProps) {
  return (
    
    <div className={`dish-card ${variant}`}>
      {dateLabel && <span className="dish-card-date">{dateLabel}</span>}
      <div className="dish-card-content">
        <h3>{dish.title}</h3>
        
        <div className="dish-card-icons">
          {(dish.isQuick || showClockBadge) && (
            <span className="dish-icon-badge" title={dish.isQuick ? 'Snabblagat (<30 min)' : 'Tillagningstid'} aria-label={dish.isQuick ? 'Snabblagat, under 30 minuter' : 'Tillagningstid'} role="img">
              <Clock size={18} className="dish-icon" />
            </span>
          )}
          {dish.isSlowCooked && (
            <span className="dish-icon-badge" title="Långkok" aria-label="Långkok" role="img">
              <Hourglass size={18} className="dish-icon" />
            </span>
          )}
        </div>
      </div>

        {children && (
        <div className="dish-card-actions">
          {children}
        </div>
      )}

    </div>
  );
}
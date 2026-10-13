import '../styles/dishCard.css';
import type { ReactNode } from 'react';
import { Clock, Hourglass } from 'lucide-react';
import type { Dish } from '../types/dish';

interface DishCardProps {
  dish?: Dish;
  title?: string;
  dateLabel?: string;
  showClockBadge?: boolean;
  variant?: 'hero' | 'calendar' | 'compact' | 'strip'; // 'strip' tillagd här!
  children?: ReactNode;
}

export default function DishCard({
  dish,
  title,
  dateLabel,
  showClockBadge = false,
  variant = 'calendar', 
  children
}: DishCardProps) {
  
  // 1. Om komponenten används uppe i den lilla kalender-strippen
  if (variant === 'strip' && dish) {
    return (
      <span className="dish-card-strip" title={dish.title}>
        {dish.title}
      </span>
    );
  }

  // 2. Standard-rendering för stora kort (calendar, hero, compact)
  return (
    <div className={`dish-card ${variant}`}>
      {dateLabel && <span className="dish-card-date">{dateLabel}</span>}
      
      <div className="dish-card-content">
        <h3>{title ?? dish?.title}</h3>
        
        <div className="dish-card-icons">
          {(dish?.isQuick || showClockBadge) && (
            <span className="dish-icon-badge" title={dish?.isQuick ? 'Snabblagat (<30 min)' : 'Tillagningstid'}>
              <Clock size={18} className="dish-icon" />
            </span>
          )}
          {dish?.isSlowCooked && (
            <span className="dish-icon-badge" title="Långkok">
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
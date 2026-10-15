import '../styles/dishCard.css';
import type { ReactNode } from 'react';
import { Clock, Hourglass } from 'lucide-react';
import type { Dish } from '../types/dish';

interface DishCardProps {
  dish?: Dish;
  recipes?: Dish[];
  title?: string;
  dateLabel?: string;
  showClockBadge?: boolean;
  variant?: 'hero' | 'calendar' | 'compact' | 'strip'; // 'strip' tillagd här!
  children?: ReactNode;
}

export default function DishCard({
  dish,
  recipes,
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
    <div className={`dish-card ${variant} ${recipes && recipes.length > 1 ? 'dish-card-with-recipes' : ''}`}>
      {dateLabel && <span className="dish-card-date">{dateLabel}</span>}

      {recipes && recipes.length > 1 ? (
        <div className="dish-card-recipe-list">
          {recipes.map((recipe) => (
            <div className="dish-card-recipe-row" key={recipe.id}>
              <div className="dish-card-icons">
                {recipe.isQuick && (
                  <span className="dish-icon-badge" title="Snabblagat (<30 min)">
                    <Clock size={18} className="dish-icon" />
                  </span>
                )}
                {recipe.isSlowCooked && (
                  <span className="dish-icon-badge" title="Långkok">
                    <Hourglass size={18} className="dish-icon" />
                  </span>
                )}
              </div>
              <h3>{recipe.title}</h3>
            </div>
          ))}
        </div>
      ) : (
        <div className="dish-card-content">
          <h3>{title ?? dish?.title ?? recipes?.[0]?.title}</h3>

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
      )}

      {children && (
        <div className="dish-card-actions">
          {children}
        </div>
      )}
    </div>
  );
}
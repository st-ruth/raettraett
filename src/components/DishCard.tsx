import '../styles/dishCard.css';
import type { ReactNode } from 'react';
import { Clock, Ghost, Hourglass } from 'lucide-react';
import type { Dish } from '../types/dish';

interface DishCardProps {
  dish?: Dish;
  recipes?: Dish[];
  title?: string;
  dateLabel?: string;
  showClockBadge?: boolean;
  showGhostBadge?: boolean;
  variant?: 'hero' | 'calendar' | 'compact' | 'strip'; // 'strip' tillagd här!
  children?: ReactNode;
}

export default function DishCard({
  dish,
  recipes,
  title,
  dateLabel,
  showClockBadge = false,
  showGhostBadge = false,
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
                  <span className="dish-icon-badge" role="img" aria-label="Snabblagat, under 30 minuter" title="Snabblagat (<30 min)">
                    <Clock size={18} className="dish-icon" aria-hidden="true" />
                  </span>
                )}
                {recipe.isSlowCooked && (
                  <span className="dish-icon-badge" role="img" aria-label="Långkok" title="Långkok">
                    <Hourglass size={18} className="dish-icon" aria-hidden="true" />
                  </span>
                )}
              </div>
              <h2>{recipe.title}</h2>
            </div>
          ))}
        </div>
      ) : (
        <div className="dish-card-content">
          <h2>{title ?? dish?.title ?? recipes?.[0]?.title}</h2>

          <div className="dish-card-icons">
            {showGhostBadge && (
              <span className="dish-icon-badge" role="img" aria-label="Inget planerat" title="Inget planerat">
                <Ghost size={18} className="dish-icon dish-icon-ghost" aria-hidden="true" />
              </span>
            )}
            {(dish?.isQuick || showClockBadge) && (
              <span className="dish-icon-badge" role="img" aria-label={dish?.isQuick ? 'Snabblagat, under 30 minuter' : 'Tillagningstid'} title={dish?.isQuick ? 'Snabblagat (<30 min)' : 'Tillagningstid'}>
                <Clock size={18} className="dish-icon" aria-hidden="true" />
              </span>
            )}
            {dish?.isSlowCooked && (
              <span className="dish-icon-badge" role="img" aria-label="Långkok" title="Långkok">
                <Hourglass size={18} className="dish-icon" aria-hidden="true" />
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
import type {Dish} from '../types/dish';

interface DishCardProps {
  dish: Dish;
}

export default function DishCard({dish}: DishCardProps) {
  return (
    <div className="dish-card">
      <h3>{dish.title}</h3>
      <p>Kategori: {dish.category}</p>
      {dish.isQuick && <span>⏰ Snabblagat (&lt;30 min)</span>}
      {dish.isSlowCooked && <span>⏳ Långkok</span>}
    </div>
  );
}
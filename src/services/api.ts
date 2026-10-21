import type { Dish } from '../types/dish';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export async function fetchDishes(): Promise<unknown> {
  const response = await fetch(`${API_URL}/api/dishes`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}

export async function createDish(
  dish: Omit<Dish, 'id'>,
  accessToken: string,
): Promise<unknown> {
  const response = await fetch(`${API_URL}/api/dishes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(dish),
  });

  const result: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof result === 'object' &&
      result !== null &&
      'error' in result &&
      typeof result.error === 'string'
        ? result.error
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return result;
}

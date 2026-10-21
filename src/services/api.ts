const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export async function fetchDishes(): Promise<unknown> {
  const response = await fetch(`${API_URL}/api/dishes`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}

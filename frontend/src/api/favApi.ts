const API = import.meta.env.VITE_API_URL;

export const getFavorites = async (userId: number) => {
  const response = await fetch(`${API}/favorites/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch favorites");
  return await response.json();
};

export const addFavorite = async (userId: number, recipeId: number) => {
  const response = await fetch(`${API}/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, recipeId }),
  });
  if (!response.ok) throw new Error("Failed to add favorite");
  return await response.json();
};

export const removeFavorite = async (userId: number, recipeId: number) => {
  const response = await fetch(`${API}/favorites`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, recipeId }),
  });
  if (!response.ok) throw new Error("Failed to remove favorite");
  return await response.json();
};
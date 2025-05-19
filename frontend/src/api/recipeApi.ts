const API = import.meta.env.VITE_API_URL;

// export const getRecipesByID = async (id: number) => {
//   const response = await fetch(`${API}/recipes/${id}`);
//   if (!response.ok) throw new Error("Failed to fetch recipes");
//   return await response.json();
// };

export const getRecipesByID = async (id: number) => {
  const response = await fetch(`${API}/recipes/${id}`);
  const data = await response.json();
  return {
    status: response.status,
    data,
  };
};

export const getAllRecipes = async () => {
  const response = await fetch(`${API}/recipes/`);
  if (!response.ok) throw new Error("Failed to fetch recipes");
  return await response.json();
};
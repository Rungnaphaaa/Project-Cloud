import type { RatingInterface } from "../pages/RecipeDetailPage/RecipeDetailPage";

const API = import.meta.env.VITE_API_URL;

// export const ListRatings = async () => {
//   const response = await fetch(`${API}/ratings`);
//   if (!response.ok) throw new Error("Failed to fetch ratings");
//   return await response.json();
// };

export const ListRatings = async () => {
  const response = await fetch(`${API}/ratings`);
  const data = await response.json();
  return {
    status: response.status,
    data,
  };
};


// export const CreateRating = async (data: RatingInterface) => {
//   const response = await fetch(`${API}/ratings`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify( data ),
//   });
//   if (!response.ok) throw new Error("Failed to create rating");
//   return await response.json();
// };

export const CreateRating = async (data: RatingInterface) => {
  const response = await fetch(`${API}/ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const responseData = await response.json();
  return {
    status: response.status,
    data: responseData,
  };
};

// export const getRatingsByRecipeID = async (recipeId: number) => {
//   const response = await fetch(`${API}/rating/${recipeId}`);
//   if (!response.ok) throw new Error("Failed to fetch ratings");
//   return await response.json();
// };

export const getRatingsByRecipeID = async (recipeId: number | string) => {
  const response = await fetch(`${API}/ratings/${recipeId}`);
  const data = await response.json();
  return {
    status: response.status,
    data,
  };
};


// export const removeFavorite = async (userId: number, recipeId: number) => {
//   const response = await fetch(`${API}/favorites/${userId}/${recipeId}`, {
//     method: "DELETE",
//   });
//   if (!response.ok) throw new Error("Failed to remove favorite");
//   return await response.json();
// };
import type { Recipe } from "./IRecipes";

export interface Favorite {
  favorite_id: number;
  user_id: number;
  recipe_id: number;
  recipe: Recipe;
}


export interface AddFavoriteRequest {
  userId: number;
  recipeId: number;
}

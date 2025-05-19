export interface Recipe {
  recipe_id: number;
  recipe_name: string;
  description: string;
  image_url: string;
  cooking_time: number;
  difficulty: string;
  isFavorite?:  boolean;
}
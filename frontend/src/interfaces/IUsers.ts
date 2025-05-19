export interface User {
  user_id: number;
  name: string;
  email: string;
  password: string;
  bio?: string;
  profile_image_url?: string;
  recipe_count: number;
  favorite_count: number;
  join_date: string; 
  role_id: number;
  role_name?: string; 
}

export interface LoginRequest {
  email: string;
  password: string;
}


export interface LoginResponse {
  message: string;
  user: User;
}

import type { RouteObject } from "react-router-dom";
import Home from "../pages/Home/Home";
import RecipeDetailPage from "../pages/RecipeDetailPage/RecipeDetailPage";
import UserProfile from "../pages/Profile/Profile";
import Login from "../pages/Login/Login";
import MinimalLayout from "../layout/MinimalLayOut";
import AllFavoriteRecipes from "../pages/ShowFav/AllFavoriteRecipes";
import AllRecipes from "../pages/AllRecipes/AllRecipes";
import EditProfile from "../pages/User/EditProfile";
import AdminRecipeForm from "../pages/Admin/AdminRecipeForm";


const UserRoutes = (): RouteObject => {
	return {
		path: "/",
		element: <MinimalLayout />,
		children: [
			{
				path: "/",
				element: <Home />
			},

			{
				path: "/home",
				element: <Home />
			},

			{
				path: "profile/:userID",
				element: <UserProfile />
			},

			{
				path: "/recipes/:recipeID",
				element: <RecipeDetailPage />
			},

			{
				path: "/login",
				element: <Login />
			},

			{
				path: "/favorites",
				element: <AllFavoriteRecipes />
			},

			{
				path: "/recipes",
				element: <AllRecipes />
			},


			{
				path: "/edit/profile/:userID",
				element: <EditProfile />
			},
			
			{
				path: "create/recipe",
				element: <AdminRecipeForm />
			}

		]
	}
}
export default UserRoutes;
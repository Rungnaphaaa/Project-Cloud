import type { RouteObject } from "react-router-dom";
import Home from "../pages/Home/Home";
import UserProfile from "../pages/Profile/Profile";
import AdminRecipeForm from "../pages/Admin/AdminRecipeForm";
import MinimalLayout from "../layout/MinimalLayOut";
import AllFavoriteRecipes from "../pages/ShowFav/AllFavoriteRecipes";
import RecipeDetailPage from "../pages/RecipeDetailPage/RecipeDetailPage";
import AllRecipes from "../pages/AllRecipes/AllRecipes";
import EditProfile from "../pages/User/EditProfile";
import EditRecipeForm from "../pages/Admin/editRecipes";

const AdminRoutes = (): RouteObject => {
	return {
		path: "/",
		element: <MinimalLayout />,
		children: [
			{
				path: "",
				element: <Home />
			},
			{
				path: "home",
				element: <Home />
			},
			{
				path: "profile/:userID",
				element: <UserProfile />
			},
			{
				path: "create/recipe",
				element: <AdminRecipeForm />
			},

			{
				path: "/favorites",
				element: <AllFavoriteRecipes />
			},
			{
				path: "/recipes/:recipeID",
				element: <RecipeDetailPage />
			},
			{
				path: "/recipes",
				element: <AllRecipes/>
			},
			{
				path: "/edit/profile/:userID",
				element: <EditProfile />
			},
			{
				path: "/edit/recipe/:recipeID",
				
				element: <EditRecipeForm />
				
			},

		]
	}
}
export default AdminRoutes;
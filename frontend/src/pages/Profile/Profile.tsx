import { fetchUserById } from "../../api/userApi";
import type { User } from "../../interfaces/IUsers";
import dayjs from "dayjs";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Heart,
  BookOpen,
  Clock,
  ChevronRight,
  Menu,
  X,
  Star,
  User as UserIcon,
} from "lucide-react";
import LogoutButton from "../../components/Logout";
import { Link } from "react-router-dom";
import MyRecipes from "../../components/MyRecipes";
import EditProfileButton from "../../components/EditProfile";
import type { Favorite } from "../../interfaces/IFavorites";
import { getFavorites, removeFavorite } from "../../api/favApi";
import { getRecipesByID } from "../../api/recipeApi";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Button } from "@mui/material";
import type { Recipe } from "../../interfaces/IRecipes";

const API = import.meta.env.VITE_API_URL;

export default function UserProfile() {
  const { userID } = useParams();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [recipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState<"favorites" | "recipes">(
    "favorites"
  );
  const [user, setUser] = useState<User | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>();

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const GetFavorites = async () => {
    try {
      const id = Number(userID);
      const favorites = await getFavorites(id);

      // ดึง recipe data พร้อมกันทีละอัน
      const recipes = await Promise.all(
        favorites.map((fav: Favorite) => getRecipesByID(fav.recipe_id))
      );

      console.log(recipes);

      // รวม favorite กับ recipe data
      const favoritesWithRecipes = favorites.map(
        (fav: Favorite, index: number) => ({
          ...fav,
          recipe: recipes[index].data,
        })
      );

      setFavorites(favoritesWithRecipes);
    } catch (err) {
      console.error("Failed to get favorite", err);
    }
  };

  const handleRemoveFavorite = async () => {
    try {
      const userId = Number(userID);
      const res = await removeFavorite(userId, selectedRecipe?.recipe_id || 0);
      if (res) {
        console.log("remove completed");
        GetFavorites();
        handleClose();
      }
    } catch (err) {
      console.error("Failed to get favorite", err);
    }
  };

  useEffect(() => {
    const loginAdminStatus = localStorage.getItem("role");
    setIsAdminLoggedIn(loginAdminStatus === "admin");
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = Number(userID);
        const data = await fetchUserById(id);
        setUser(data);
      } catch (err) {
        console.error("Failed to load user", err);
      }
    };

    if (userID) {
      loadUser();
    }

    GetFavorites();
  }, [userID]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "hard":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Remove from favorites list?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Remove this recipe from your favorites list
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button sx={{ color: "text.primary" }} onClick={handleClose}>
            No
          </Button>
          <Button
            sx={{ color: "text.primary" }}
            onClick={handleRemoveFavorite}
            autoFocus
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Navigation Bar */}
      <nav className="bg-black text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center gap-2 text-xl font-bold hover:text-red-500 transition"
              >
                <span className="text-red-600 text-2xl">🍗</span>
                <span>Frytopia</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <a
                href="/frontend/home"
                className="px-3 py-2 rounded-md hover:bg-red-600 transition"
              >
                Home
              </a>
              <button
                onClick={() =>
                  footerRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-3 py-2 rounded-md hover:bg-red-600 transition"
              >
                About
              </button>
              <a
                href="/frontend/favorites"
                className="px-3 py-2 rounded-md hover:bg-red-600 transition"
              >
                Favorites
              </a>
              <a
                href={`/frontend/profile/${userID}`}
                className="px-3 py-2 rounded-md bg-red-600 transition"
              >
                Profile
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="text-white focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-900">
              <a
                href="/frontend/home"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition"
              >
                Home
              </a>
              <button
                onClick={() => {
                  footerRef.current?.scrollIntoView({ behavior: "smooth" });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition"
              >
                About
              </button>
              <a
                href="/frontend/favorites"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition"
              >
                Favorites
              </a>
              <a
                href={`/frontend/profile/${userID}`}
                className="block px-3 py-2 rounded-md text-base font-medium bg-red-600 transition"
              >
                Profile
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Featured Banner */}
      <div className="bg-black text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center gap-2">
            <Star size={16} className="text-yellow-400" />
            <p className="text-sm font-medium">
              Welcome to your personal Frytopia profile!
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Profile Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="bg-red-600 h-32 relative">
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end mb-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                {user?.profile_image_url ? (
                  <img
                    src={
                      user?.profile_image_url
                        ? `${API}/${user.profile_image_url}`
                        : "https://media.tenor.com/37Fg9LDryfwAAAAe/kfc-perro.png"
                    }
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <UserIcon size={48} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 md:mb-3">
                <h1 className="text-2xl font-bold text-gray-800">
                  {user?.name || "Loading..."}
                </h1>
                <p className="text-gray-600">
                  Member since{" "}
                  {user?.join_date
                    ? dayjs(user.join_date).format("DD MMMM YYYY")
                    : "Loading..."}
                </p>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0 md:ml-auto md:mb-3">
                <LogoutButton />
                <EditProfileButton
                  userID={localStorage.getItem("userID") || ""}
                />
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              {user?.bio || "No bio available"}
            </p>

            <div className="flex flex-wrap gap-8">
              {isAdminLoggedIn && (
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg text-black">
                  <BookOpen size={20} className="text-red-600" />
                  <div>
                    <p className="text-xs text-gray-500">Recipes</p>
                    <p className="font-medium">{user?.recipe_count || 0}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg text-black">
                <Heart size={20} className="text-red-600" />
                <div>
                  <p className="text-xs text-gray-500">Favorites</p>
                  <p className="font-medium">{favorites.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 py-4 px-4 font-medium text-center ${
                activeTab === "favorites"
                  ? "bg-red-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              } transition`}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart size={18} />
                <span>My Favorites</span>
              </div>
            </button>
            {isAdminLoggedIn && (
              <button
                onClick={() => setActiveTab("recipes")}
                className={`flex-1 py-4 px-4 font-medium text-center ${
                  activeTab === "recipes"
                    ? "bg-red-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                } transition`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BookOpen size={18} />
                  <span>My Recipes</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Favorites Tab */}
        {activeTab === "favorites" && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Favorite Recipes
              </h2>
              <a
                href="/frontend/favorites"
                className="text-red-600 flex items-center hover:text-red-700 transition font-medium"
              >
                View All <ChevronRight size={16} />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav) => {
                const recipe = fav.recipe;
                return (
                  <div
                    key={recipe.recipe_id}
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-200"
                  >
                    <div className="h-48 relative">
                      <img
                        src={`${API}/${recipe.image_url}`}
                        alt={recipe.recipe_name}
                        className="w-full h-full object-cover max-w-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <button
                        className="absolute top-3 right-3 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 transition"
                        onClick={() => {
                          handleClickOpen(), setSelectedRecipe(recipe);
                        }}
                      >
                        <Heart
                          size={18}
                          fill="#EF4444"
                          className="text-red-500"
                        />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
                        {recipe.recipe_name}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Clock size={16} className="mr-1" />
                          <span>{`${recipe.cooking_time} minute`}</span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}
                        >
                          {recipe.difficulty}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/recipes/${recipe.recipe_id}`}
                      className="block bg-red-600 text-white py-2 text-center hover:bg-red-700 transition"
                      onClick={() =>
                        localStorage.setItem(
                          "recipeID",
                          String(recipe?.recipe_id)
                        )
                      }
                    >
                      <span className="font-medium">View Recipe</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {favorites.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Heart size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  No favorite recipes yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Save your favorite recipes for quick access
                </p>
                <a
                  href="/frontend/recipes"
                  className="inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                >
                  Explore Recipes
                </a>
              </div>
            )}
          </div>
        )}

        {/* My Recipes Tab - ใช้คอมโพเนนต์แยก */}
        {activeTab === "recipes" && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <MyRecipes recipes={recipes} isAdminLoggedIn={isAdminLoggedIn} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer ref={footerRef} className="bg-black text-white pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
            <p>
              &copy; {new Date().getFullYear()} "Stay crispy, stay legendary.
              🍗" — Frytopia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

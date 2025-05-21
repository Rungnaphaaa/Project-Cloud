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
  ZoomIn,
} from "lucide-react";
import LogoutButton from "../../components/Logout";
import { Link } from "react-router-dom";
import MyRecipes, { getAverageRating } from "../../components/MyRecipes";
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
  const [averageRatings, setAverageRatings] = useState<Record<number, number>>({});
  const [_loadingRatings, setLoadingRatings] = useState(true);
  // Profile image preview state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    document.body.style.overflow = "auto";
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '';
      case 'medium': return '';
      case 'hard': return;
      default: return '⭐';
    }
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
      fetchRatingsForRecipes(favoritesWithRecipes);  // เพิ่มบรรทัดนี้

    } catch (err) {
      console.error("Failed to get favorite", err);
    }
  };

  const fetchRatingsForRecipes = async (favs: Favorite[]) => {
    setLoadingRatings(true);
    const map: Record<number, number> = {};
    await Promise.all(
      favs.map(async (fav) => {
        const avg = await getAverageRating(String(fav.recipe.recipe_id));

        map[fav.recipe.recipe_id] = avg;
      })
    );
    setAverageRatings(map);
    setLoadingRatings(false);
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
    window.scrollTo(0, 0);
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
      {/* Remove Favorite Dialog */}
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

      {/* Profile Image Preview Modal */}
      {isProfileModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md backdrop-saturate-150 transition-all"
          onClick={closeProfileModal}
        >

          <div
            className="max-w-4xl w-full mx-4 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-lg overflow-hidden relative">
              <button
                onClick={closeProfileModal}
                className="absolute top-4 right-4 z-10 bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
              >
                <X size={24} />
              </button>

              <div className="p-4 bg-red-600">
                <h3 className="text-white text-xl font-bold">{user?.name || "Profile"}</h3>
              </div>

              <div className="p-4 flex items-center justify-center">
                <img
                  src={
                    user?.profile_image_url
                      ? `${API}/${user.profile_image_url}`
                      : "https://media.tenor.com/37Fg9LDryfwAAAAe/kfc-perro.png"
                  }
                  alt={user?.name || "Profile"}
                  className="max-h-[70vh] w-auto max-w-full shadow-lg rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar - KFC Style */}
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

      {/* Featured Banner - KFC Style */}
      <div className="bg-red-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center gap-2">
            <Star size={16} className="text-yellow-400" />
            <p className="text-sm font-medium">
              Stay crispy, stay legendary! 🍗 Welcome to your personal Frytopia profile!
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Profile Header - KFC Style */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-700 to-red-500 h-32 relative">
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end mb-4">
              {/* Clickable Profile Image */}
              <div
                onClick={openProfileModal}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg cursor-pointer relative group"
              >
                {user?.profile_image_url ? (
                  <>
                    <img
                      src={`${API}/${user.profile_image_url}`}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                      <ZoomIn size={28} className="text-white" />
                    </div>
                  </>
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

        {/* Tabs - KFC Style */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 py-4 px-4 font-medium text-center ${activeTab === "favorites"
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
                className={`flex-1 py-4 px-4 font-medium text-center ${activeTab === "recipes"
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

        {/* Favorites Tab - KFC Style */}
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
            <p className="text-sm text-gray-500 mb-2">
              Showing {Math.min(favorites.length, 6)} of {favorites.length} favorites
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.slice(0, 6).map((fav) => {
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <button
                        className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition transform hover:scale-110"
                        onClick={() => { handleClickOpen(); setSelectedRecipe(recipe); }}
                      >
                        <Heart size={18} fill="#EF4444" className="text-red-500" />
                      </button>

                      {/* Star Rating Badge - Added from MyRecipes */}
                      <div className="absolute top-3 left-3">
                        <div className="flex items-center bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                          <Star size={12} className="text-yellow-400 mr-1" />
                          <span>{(averageRatings[recipe.recipe_id] ?? 0).toFixed(1)} / 5.0</span>
                        </div>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                          {typeof getDifficultyIcon(recipe.difficulty) === 'string'
                            ? getDifficultyIcon(recipe.difficulty)
                            : getDifficultyIcon(recipe.difficulty)}
                          <span className="ml-1 capitalize">{recipe.difficulty}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-grow">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{recipe.recipe_name}</h3>
                      <div className="flex items-center text-gray-500 mb-3">
                        <Clock size={16} className="mr-1" />
                        <span>{recipe.cooking_time} minutes</span>
                      </div>
                      <div className="h-12 overflow-hidden">
                        <p className="text-gray-600 text-sm line-clamp-2">{recipe.description || "A delicious fried chicken recipe that will make your taste buds dance!"}</p>
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

      {/* Footer - KFC Style */}
      <footer ref={footerRef} className="bg-black text-white pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-red-500">Frytopia</h3>
              <p className="text-gray-400">
                The ultimate destination for fried food enthusiasts. Experience legendary recipes that will make your taste buds dance.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-red-500">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/frontend/home" className="text-gray-400 hover:text-white transition">Home</a></li>
                <li><a href="/frontend/recipes" className="text-gray-400 hover:text-white transition">Recipes</a></li>
                <li><a href="/frontend/favorites" className="text-gray-400 hover:text-white transition">Favorites</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-red-500">Newsletter</h3>
              <p className="text-gray-400 mb-4">Subscribe for exclusive recipes and offers</p>
              <div className="flex">
                <input type="email" placeholder="Your email" className="px-4 py-2 rounded-l-md flex-grow" />
                <button className="bg-red-600 text-white px-4 py-2 rounded-r-md hover:bg-red-700 transition">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
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
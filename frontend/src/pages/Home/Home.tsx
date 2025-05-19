import { useEffect, useState, useRef } from 'react';
import { Search, Heart, ChevronRight, Menu, X, Star, Clock, Info } from 'lucide-react';
// import type { Recipee } from '../../interfaces/IRecipes';
import { Link } from 'react-router-dom';
import { getAllRecipes } from '../../api/recipeApi';
import type { Recipe } from '../../interfaces/IRecipes';
import { addFavorite, getFavorites, removeFavorite } from '../../api/favApi';
import type { Favorite } from '../../interfaces/IFavorites';

const API = import.meta.env.VITE_API_URL;

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState<string | null>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const GetRecipesAndFavorites = async () => {
    try {
      const storedUserID = localStorage.getItem('userID');
      const userId = Number(storedUserID);

      const [recipes, favorites] = await Promise.all([
        getAllRecipes(),
        getFavorites(userId),
      ]);

      const favoriteRecipeIds = favorites.map((fav: Favorite) => fav.recipe_id);

      const recipesWithFavorites = recipes.map((recipe: Recipe) => ({
        ...recipe,
        isFavorite: favoriteRecipeIds.includes(recipe.recipe_id),
      }));

      setRecipes(recipesWithFavorites);
    } catch (err) {
      console.error('Failed to load recipes and favorites', err);
    }
  };

  const handleCreateFavorite = async (recipeId: number) => {
    try {
      const userId = Number(userID);
      const res = await addFavorite(userId, recipeId);
      if (res) {
        console.log('Create favorite successful')
        GetRecipesAndFavorites()
      }
    } catch (err) {
      console.error('Failed to create favorite', err);
    }
  }

  const handleRemoveFavorite = async (recipeID: number) => {
    try {
      const userId = Number(userID);
      const res = await removeFavorite(userId, recipeID);
      if (res) {
        console.log("remove completed")
        GetRecipesAndFavorites()
      }
    } catch (err) {
      console.error('Failed to get favorite', err);
    }
  };

  useEffect(() => {
    const loginStatus = localStorage.getItem('isLogin');
    const storedUserID = localStorage.getItem('userID');
    setIsLoggedIn(loginStatus === 'true');
    setUserID(storedUserID);

    GetRecipesAndFavorites()
  }, []);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.recipe_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'hard': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  console.log(recipes)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-black text-white shadow-lg sticky top-0 z-999">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:text-red-500 transition">
                <span className="text-red-600 text-2xl">🍗</span>
                <span>Frytopia</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <a href="/frontend/home" className="px-3 py-2 rounded-md hover:bg-red-600 transition">Home</a>
              <button
                onClick={() => footerRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-2 rounded-md hover:bg-red-600 transition"
              >
                About
              </button>
              {isLoggedIn ? (
                <>
                  <a href="/frontend/favorites" className="px-3 py-2 rounded-md hover:bg-red-600 transition">Favorites</a>
                  <a href={`/frontend/profile/${userID}`} className="px-3 py-2 rounded-md hover:bg-red-600 transition">Profile</a>
                </>
              ) : (
                <a href="/frontend/login" className="px-3 py-2 rounded-md hover:bg-red-600 transition">Login</a>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
              <a href="/frontend/home" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Home</a>
              <button
                onClick={() => {
                  footerRef.current?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition"
              >
                About
              </button>
              {isLoggedIn ? (
                <>
                  <a href="/frontend/favorites" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Favorites</a>
                  <a href={`/frontend/profile/${userID}`} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Profile</a>
                </>
              ) : (
                <a href="/frontend/login" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Login</a>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="bg-red-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">Fried Chicken Perfection</h1>
            <p className="text-lg md:text-xl mb-8 drop-shadow-md">Warning: Our fried chicken may cause sudden dancing, happy tears, and uncontrollable finger-licking.</p>
            <div className="flex items-center bg-white rounded-lg p-1 shadow-lg">
              <input
                type="text"
                placeholder="Search for recipes..."
                className="w-full px-4 py-3 rounded-lg text-gray-800 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition">
                <Search size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Banner */}
      <div className="bg-black text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center gap-2">
            <Star size={16} className="text-yellow-400" />
            <p className="text-sm font-medium">NEW! Discover our collection of Chef-approved recipes</p>
          </div>
        </div>
      </div>

      {/* Featured Recipes */}
      <div className="max-w-7xl mx-auto px-4 py-12 bg-white shadow-sm rounded-xl my-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Recipes</h2>
          <a href="/frontend/recipes" className="text-red-600 flex items-center hover:text-red-700 transition font-medium">
            View All <ChevronRight size={16} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.slice(0, 4).map((recipe) => (
            <div
              key={recipe.recipe_id}
              className="flex flex-col justify-between h-full bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-200"
            >
              {/* Image & Favorite */}
              <div className="h-48 relative">
                <img
                  src={`${API}/${recipe.image_url}`}
                  alt={recipe.recipe_name}
                  className="w-full h-full object-cover max-w-full"
                />
                <button
                  disabled={!isLoggedIn}
                  className={`absolute top-2 right-2 p-2 bg-white rounded-full shadow-md 
          ${recipe.isFavorite ? 'text-red-500' : 'text-gray-400'}
          ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                  onClick={() => {
                    if (!isLoggedIn) return;
                    if (recipe.isFavorite) {
                      handleRemoveFavorite(recipe.recipe_id);
                    } else {
                      handleCreateFavorite(recipe.recipe_id);
                    }
                  }}
                >
                  <Heart
                    size={18}
                    fill={recipe.isFavorite ? "#EF4444" : "none"}
                    className={recipe.isFavorite ? "text-red-500" : "text-gray-400"}
                  />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">
                    {recipe.recipe_name}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                    {recipe.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm mt-auto">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock size={16} />
                    <span>{`${recipe.cooking_time} minute`}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>

              {/* View Recipe Button */}
              <Link
                to={`/recipes/${recipe.recipe_id}`}
                onClick={() => localStorage.setItem('recipeID', String(recipe.recipe_id))}
              >
                <div className="bg-red-600 text-white py-2 text-center cursor-pointer hover:bg-red-700 transition rounded-b-xl">
                  <span className="text-sm font-medium">View Recipe</span>
                </div>
              </Link>
            </div>
          ))}

        </div>

        {filteredRecipes.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Info size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No recipes found matching your search.</p>
            <p className="text-gray-400 mt-2">Try different keywords or browse our categories.</p>
          </div>
        )}
      </div>
      {/* Footer */}
      <footer ref={footerRef} className="bg-black text-white pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} "Great memories are made where the chicken's crispy." — Frytopia</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
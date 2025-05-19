import { useState, useRef, useLayoutEffect } from 'react';
import { Heart, Clock, ChevronDown, Menu, X, Search, Filter, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllRecipes } from '../../api/recipeApi';
import type { Recipe } from '../../interfaces/IRecipes';
import type { Favorite } from '../../interfaces/IFavorites';
import { addFavorite, getFavorites, removeFavorite } from '../../api/favApi';

const API = import.meta.env.VITE_API_URL;

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Recipes');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const footerRef = useRef<HTMLElement | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState<string | null>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleMobileFilter = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
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

  useLayoutEffect(() => {
    const loginStatus = localStorage.getItem('isLogin');
    const storedUserID = localStorage.getItem('userID');
    setIsLoggedIn(loginStatus === 'true');
    setUserID(storedUserID);

    GetRecipesAndFavorites();
  }, []);

  interface DifficultyColorMap {
    [key: string]: string;
  }

  const getDifficultyColor = (difficulty: string): string => {
    const colorMap: DifficultyColorMap = {
      easy: 'bg-green-600 text-white',
      medium: 'bg-yellow-600 text-white',
      hard: 'bg-red-600 text-white',
    };
    return colorMap[difficulty] || 'bg-gray-600 text-white';
  };

  interface SearchEvent extends React.ChangeEvent<HTMLInputElement> { }

  const handleSearch = (e: SearchEvent) => {
    setSearchQuery(e.target.value);
  };


  const handleSortChange = (option: string): void => {
    setSortBy(option);

    // // Sort logic
    let sortedRecipes: Recipe[] = [...recipes];
    if (option === 'newest') {
      const sortedRecipes = recipes.sort((a: { recipe_id: number; }, b: { recipe_id: number; }) => b.recipe_id - a.recipe_id);
      setRecipes(sortedRecipes);
    } else if (option === 'cookTime') {
      sortedRecipes.sort((a, b) => a.cooking_time - b.cooking_time);
    }

    setRecipes(sortedRecipes);
  };

  const filteredRecipes = recipes.filter(recipe => {
    const name = recipe.recipe_name?.toLowerCase() || "";
    const description = recipe.description?.toLowerCase() || "";
    const search = searchQuery.toLowerCase();

    const matchesSearch = name.includes(search) || description.includes(search);
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
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
              <a href="/frontend/recipes" className="px-3 py-2 rounded-md bg-red-600 transition">Recipes</a>
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
              <a href="/frontend/home" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Home</a>
              <a href="/frontend/recipes" className="block px-3 py-2 rounded-md text-base font-medium bg-red-600 transition">Recipes</a>
              <button
                onClick={() => {
                  footerRef.current?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition"
              >
                About
              </button>
              <a href="/frontend/favorites" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Favorites</a>
              <a href="/frontend/profile/1" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Profile</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Banner */}
      <div className="bg-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Amazing Fried Chicken Recipes</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">Made with love, fried with joy — welcome to chicken heaven.</p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="flex items-center bg-white rounded-full overflow-hidden shadow-lg">
                <div className="pl-4 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search for recipes..."
                  className="w-full py-4 px-3 text-gray-700 focus:outline-none"
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 transition">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-pattern-white"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter and Sort Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="w-full md:w-auto">
            <div className="md:hidden mb-4">
              <button
                onClick={toggleMobileFilter}
                className="flex items-center justify-between w-full bg-white p-4 rounded-lg shadow-md"
              >
                <div className="flex items-center">
                  <Filter size={20} className="text-red-600 mr-2" />
                  <span>Filter & Sort</span>
                </div>
                <ChevronDown size={20} className={`transition-transform ${isMobileFilterOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sort Controls (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-gray-600">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg py-2 px-4 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600 text-black"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="cookTime">Cooking Time</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ArrowUpDown size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters (expandable) */}
        {isMobileFilterOpen && (
          <div className="md:hidden bg-white p-4 rounded-lg shadow-md mb-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Sort by</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSortChange('popular')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition ${sortBy === 'popular'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Most Popular
                </button>
                <button
                  onClick={() => handleSortChange('newest')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition ${sortBy === 'newest'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => handleSortChange('cookTime')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition ${sortBy === 'cookTime'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Cooking Time
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Results */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedCategory === 'All Recipes' ? 'All Recipes' : selectedCategory + ' Recipes'}
              <span className="text-gray-500 ml-2 text-lg">({filteredRecipes.length})</span>
            </h2>
          </div>

          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <div key={recipe.recipe_id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-200">
                  <div className="h-48 relative">
                    <img
                      src={`${API}/${recipe.image_url}`}
                      alt={recipe.recipe_name}
                      className="w-full h-full object-cover max-w-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <button
                      disabled={!isLoggedIn}
                      className={`absolute top-2 right-2 p-2 bg-white rounded-full shadow-md 
                    ${recipe.isFavorite ? 'text-red-500' : 'text-gray-400'}
                    ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                      onClick={() => {
                        if (!isLoggedIn) return; // ป้องกันกดถ้ายังไม่ได้ login
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
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{recipe.recipe_name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center text-gray-500">
                        <Clock size={16} className="mr-1" />
                        <span>{`${recipe.cooking_time} minute`}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                        {recipe.difficulty}
                      </span>
                    </div>
                  </div>
                  <Link to={`/recipes/${recipe.recipe_id}`} onClick={() => localStorage.setItem('recipeID', String(recipe.recipe_id))}>
                    <div className="bg-red-600 text-white py-2 text-center cursor-pointer hover:bg-red-700 transition">
                      <span className="text-sm font-medium">View Recipe</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-md">
              <img src="/api/placeholder/200/200" alt="No recipes found" className="mx-auto mb-4 rounded-full" />
              <h3 className="text-xl font-medium text-gray-800 mb-2">No recipes found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find any recipes matching your criteria. Try adjusting your filters or search term.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All Recipes');
                  setSearchQuery('');
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

      </div>
      {/* Footer */}
      <footer ref={footerRef} className="bg-black mt-12  border-t border-gray-800 text-gray-500 text-center text-sm pt-12 pb-6">
        <p>"Fried to perfection, loved forever. ❤️🍗" — Frytopia</p>
      </footer>
    </div>
  );
}
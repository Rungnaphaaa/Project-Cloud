
import { useEffect, useRef, useState } from 'react';
import { 
  ChevronLeft, 
  Search, 
  SlidersHorizontal, 
  X, 
  ArrowUpDown, 
  Star, 
  Heart, 
  Clock, 
  Menu,
  Filter,
  AlertCircle,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFavorites, removeFavorite } from '../../api/favApi';
import type { Favorite } from '../../interfaces/IFavorites';
import { getRecipesByID } from '../../api/recipeApi';
import { getRatingsByRecipeID } from '../../api/ratingApi';
const API = import.meta.env.VITE_API_URL;
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Button } from '@mui/material';
import type { Recipe } from '../../interfaces/IRecipes';

const getAverageRating = async (recipeId: number): Promise<number> => {
  try {
    const response = await getRatingsByRecipeID(String(recipeId));
    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) return 0;

    const scores: number[] = data.map((entry) => entry.score);
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / scores.length;

    return parseFloat(avg.toFixed(2));
  } catch (error) {
    console.error("Error fetching average rating:", error);
    return 0;
  }
};

export default function AllFavoriteRecipes() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>();
  const [_selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState('name-asc');
  const [userID, setUserID] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [averageRatings, setAverageRatings] = useState<Record<number, number>>({});
  const [_loadingRatings, setLoadingRatings] = useState(true);
  const [promo, setPromo] = useState(true);
  const footerRef = useRef<HTMLDivElement>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 6;

  const [open, setOpen] = useState(false);

  const difficulties = ['easy', 'medium', 'hard'];

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedDifficulties([]);
    setSortOption('name-asc');
    setCurrentPage(1); 
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'hard': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '';
      case 'medium': return '';
      case 'hard': return ;
      default: return '⭐';
    }
  };

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

      // Fetch recipe data in parallel
      const recipes = await Promise.all(
        favorites.map((fav: Favorite) => getRecipesByID(fav.recipe_id))
      );

      // Combine favorite with recipe data
      const favoritesWithRecipes = favorites.map((fav: Favorite, index: number) => ({
        ...fav,
        recipe: recipes[index].data,
      }));

      setFavorites(favoritesWithRecipes);
      
      // Fetch ratings for all recipes
      fetchRatingsForRecipes(favoritesWithRecipes);
    } catch (err) {
      console.error('Failed to get favorite', err);
      setLoadingRatings(false);
    }
  };

  const fetchRatingsForRecipes = async (favoritesData: Favorite[]) => {
    try {
      setLoadingRatings(true);
      const ratingsMap: Record<number, number> = {};
      
      for (const fav of favoritesData) {
        if (fav.recipe && fav.recipe.recipe_id) {
          const avg = await getAverageRating(fav.recipe.recipe_id);
          ratingsMap[fav.recipe.recipe_id] = avg;
        }
      }
      
      setAverageRatings(ratingsMap);
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoadingRatings(false);
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
      console.error('Failed to remove favorite', err);
    }
  };

  useEffect(() => {
    if (userID) {
      GetFavorites();
    }
  }, [userID]);

  // Filter and sort recipes
  const filteredRecipes = favorites.filter(fav => {
    const matchesSearch = fav.recipe?.recipe_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulties.length === 0 || selectedDifficulties.includes(fav.recipe?.difficulty.toLowerCase() || '');
    return matchesSearch && matchesDifficulty;
  }).sort((a, b) => {
    if (sortOption === 'name-asc') return a.recipe.recipe_name.localeCompare(b.recipe.recipe_name);
    if (sortOption === 'name-desc') return b.recipe.recipe_name.localeCompare(a.recipe.recipe_name);
    if (sortOption === 'time-asc') return a.recipe.cooking_time - b.recipe.cooking_time;
    if (sortOption === 'time-desc') return b.recipe.cooking_time - a.recipe.cooking_time;
    if (sortOption === 'rating-desc') return (averageRatings[b.recipe.recipe_id] || 0) - (averageRatings[a.recipe.recipe_id] || 0);
    if (sortOption === 'rating-asc') return (averageRatings[a.recipe.recipe_id] || 0) - (averageRatings[b.recipe.recipe_id] || 0);
    return 0;
  });
    
  // Get current page recipes
  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = filteredRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);

  // Handle page navigation
  const paginate = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 3;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    if (currentPage === 1) {
      return [1, 2, 3];
    } else if (currentPage === totalPages) {
      return [totalPages - 2, totalPages - 1, totalPages];
    } else {
      return [currentPage - 1, currentPage, currentPage + 1];
    }
  };

  // Handle difficulty selection
  interface DifficultyToggleHandler {
    (difficulty: string): void;
  }

  const toggleDifficulty: DifficultyToggleHandler = (difficulty) => {
    if (selectedDifficulties.includes(difficulty)) {
      setSelectedDifficulties(selectedDifficulties.filter((d: string) => d !== difficulty));
    } else {
      setSelectedDifficulties([...selectedDifficulties, difficulty]);
    }
    setCurrentPage(1); // Reset to first page when filters change
  };

  useEffect(() => {
    const storedUserID = localStorage.getItem('userID');
    setUserID(storedUserID);
  }, []);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDifficulties, sortOption]);
  
  // Auto-hide promo banner after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setPromo(false);
    }, 15000);
    
    return () => clearTimeout(timer);
  }, []);

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
            Are you sure you want to remove "{selectedRecipe?.recipe_name}" from your favorites?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button sx={{ color: 'text.primary' }} onClick={handleClose}>Cancel</Button>
          <Button sx={{ color: 'red' }} onClick={handleRemoveFavorite} autoFocus>Remove</Button>
        </DialogActions>
      </Dialog>

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
                className="px-3 py-2 rounded-md bg-red-600 transition"
              >
                Favorites
              </a>
              <a
                href={`/frontend/profile/${userID}`}
                className="px-3 py-2 rounded-md hover:bg-red-600 transition"
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
                className="block px-3 py-2 rounded-md text-base font-medium bg-red-600 transition"
              >
                Favorites
              </a>
              <a
                href={`/frontend/profile/${userID}`}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition"
              >
                Profile
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Featured Banner - KFC Style with animation */}
      {promo && (
        <div className="bg-red-600 text-white py-3 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 animate-pulse">
                <Star size={18} className="text-yellow-400" />
                <p className="text-sm font-medium">
                  New! Try our "Finger Lickin' Good" Buffalo Chicken recipe 🔥
                </p>
              </div>
              <button 
                onClick={() => setPromo(false)}
                className="text-white hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with breadcrumb */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <a href="/frontend/home" className="hover:text-red-600 transition">Home</a>
                <ChevronRight size={14} />
                <a href={`/frontend/profile/${userID}`} className="hover:text-red-600 transition">Profile</a>
                <ChevronRight size={14} />
                <span className="text-red-600 font-medium">Favorites</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">My Favorite Recipes</h1>
            </div>
          </div>
          
          {/* Statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 border-l-4 border-red-600">
              <div className="bg-red-100 p-3 rounded-xl">
                <Heart size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Favorites</p>
                <p className="text-2xl font-bold">{favorites.length}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 border-l-4 border-yellow-600">
              <div className="bg-yellow-100 p-3 rounded-xl">
                <Filter size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Filtered Results</p>
                <p className="text-2xl font-bold">{filteredRecipes.length}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 border-l-4 border-green-600">
              <div className="bg-green-100 p-3 rounded-xl">
                <BookOpen size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Page</p>
                <p className="text-2xl font-bold">{currentPage} of {totalPages || 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search favorite recipes..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  <SlidersHorizontal size={18} />
                  <span>Filters</span>
                  {(selectedDifficulties.length > 0) && (
                    <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                      {selectedDifficulties.length}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <select
                    className="appearance-none bg-gray-100 rounded-lg px-4 py-3 pr-10 focus:outline-none"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="time-asc">Cook Time (Low to High)</option>
                    <option value="time-desc">Cook Time (High to Low)</option>
                    <option value="rating-desc">Rating (High to Low)</option>
                    <option value="rating-asc">Rating (Low to High)</option>
                  </select>
                  <ArrowUpDown size={16} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Filter Options Panel */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 animate-slideDown">
                <div className="flex flex-wrap justify-between items-start">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-800">Filter by Difficulty</h3>
                      {(selectedDifficulties.length > 0) && (
                        <button
                          onClick={() => setSelectedDifficulties([])}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Clear Difficulty Filters
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {difficulties.map(difficulty => (
                        <button
                          key={difficulty}
                          onClick={() => toggleDifficulty(difficulty)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all transform ${
                            selectedDifficulties.includes(difficulty)
                              ? difficulty === 'easy'
                                ? 'bg-green-600 text-white scale-105'
                                : difficulty === 'medium'
                                  ? 'bg-yellow-600 text-white scale-105'
                                  : 'bg-red-600 text-white scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{typeof getDifficultyIcon(difficulty) === 'string' 
                            ? getDifficultyIcon(difficulty) 
                            : getDifficultyIcon(difficulty)}</span>
                          <span className="capitalize">{difficulty}</span>
                          {selectedDifficulties.includes(difficulty) && (
                            <X size={14} className="ml-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                  >
                    <AlertCircle size={16} />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="mb-8">
          {filteredRecipes.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Showing {indexOfFirstRecipe + 1}-{Math.min(indexOfLastRecipe, filteredRecipes.length)} of {filteredRecipes.length} favorites
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentRecipes.map((fav) => {
                  const recipe = fav.recipe;
                  const rating = averageRatings[recipe.recipe_id] || 0;
                  return (
                    <div key={recipe.recipe_id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-200 flex flex-col">
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
                            <span>{rating.toFixed(1)} / 5.0</span>
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
                        className="block bg-red-600 text-white py-3 text-center hover:bg-red-700 transition group"
                        onClick={() => localStorage.setItem("recipeID", String(recipe?.recipe_id))}
                      >
                        <span className="font-medium flex items-center justify-center">
                          View Recipe
                          <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                        </span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-md">
              <div className="bg-red-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart size={36} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">No recipes found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery || selectedDifficulties.length > 0
                  ? "Try adjusting your search or filters to find more delicious recipes"
                  : "You haven't added any favorite recipes yet"}
              </p>
              {(searchQuery || selectedDifficulties.length > 0) ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition shadow-md"
                >
                  <X size={16} />
                  <span>Clear Filters</span>
                </button>
              ) : (
                <Link
                  to="/recipes"
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition shadow-md"
                >
                  <BookOpen size={16} />
                  <span>Explore Recipes</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredRecipes.length > 0 && filteredRecipes.length > recipesPerPage && (
          <div className="mt-8 flex justify-center">
            <nav className="inline-flex rounded-lg overflow-hidden shadow-md">
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-5 py-3 border-r border-gray-200 flex items-center gap-2 ${
                  currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              
              {getPageNumbers().map(number => (
                <button 
                  key={number} 
                  onClick={() => paginate(number)}
                  className={`px-5 py-3 border-r border-gray-200 font-medium ${
                    currentPage === number 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {number}
                </button>
              ))}
              
              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-5 py-3 flex items-center gap-2 ${
                  currentPage === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Footer - KFC Style */}
      <footer ref={footerRef} className="bg-black text-white pt-8 pb-6 mt-12">
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
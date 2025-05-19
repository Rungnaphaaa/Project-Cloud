import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Search, SlidersHorizontal, X, ArrowUpDown, Star, Heart, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFavorites, removeFavorite } from '../../api/favApi';
import type { Favorite } from '../../interfaces/IFavorites';
import { getRecipesByID } from '../../api/recipeApi';
const API = import.meta.env.VITE_API_URL;
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Button } from '@mui/material';
import type { Recipe } from '../../interfaces/IRecipes';

export default function AllFavoriteRecipes() {
	const [favorites, setFavorites] = useState<Favorite[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe>();
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
	const [sortOption, setSortOption] = useState('');
	const [userID, setUserID] = useState<string | null>(null);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const footerRef = useRef<HTMLDivElement>(null);

	const [open, setOpen] = useState(false);

	// Extract unique categories from data
	const difficulties = ['easy', 'medium', 'hard'];

	// Clear all filters
	const clearFilters = () => {
		setSearchQuery('');
		setSelectedCategories([]);
		setSelectedDifficulties([]);
		setSortOption('rating');
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'easy': return 'bg-green-600 text-white';
			case 'medium': return 'bg-yellow-600 text-white';
			case 'hard': return 'bg-red-600 text-white';
			default: return 'bg-gray-600 text-white';
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

			// ดึง recipe data พร้อมกันทีละอัน
			const recipes = await Promise.all(
				favorites.map((fav: Favorite) => getRecipesByID(fav.recipe_id))
			);

			// รวม favorite กับ recipe data
			const favoritesWithRecipes = favorites.map((fav: Favorite, index: number) => ({
				...fav,
				recipe: recipes[index].data,
			}));

			setFavorites(favoritesWithRecipes);
		} catch (err) {
			console.error('Failed to get favorite', err);
		}
	};

	const handleRemoveFavorite = async () => {
		try {
			const userId = Number(userID);
			const res = await removeFavorite(userId, selectedRecipe?.recipe_id || 0);
			if (res) {
				console.log("remove completed")
				GetFavorites()
				handleClose()
			}
		} catch (err) {
			console.error('Failed to get favorite', err);
		}
	};

	useEffect(() => {
		GetFavorites()
	}, [userID]);

	// Filter and sort recipes
	const filteredRecipes = favorites.filter(fav => {
		console.log(fav)

		const matchesSearch = fav.recipe?.recipe_name.toLowerCase().includes(searchQuery.toLowerCase());

		// Difficulty filter
		const matchesDifficulty = selectedDifficulties.length === 0 || selectedDifficulties.includes(fav.recipe?.difficulty || '');

		return matchesSearch && matchesDifficulty;
	})
		.sort((a, b) => {
			if (sortOption === 'name-asc') return a.recipe.recipe_name.localeCompare(b.recipe.recipe_name);
			if (sortOption === 'name-desc') return b.recipe.recipe_name.localeCompare(a.recipe.recipe_name);
			return 0;
		});

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
	};

	useEffect(() => {
		const storedUserID = localStorage.getItem('userID');
		setUserID(storedUserID);
	}, []);

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
				<DialogActions >
					<Button sx={{ color: 'text.primary' }} onClick={handleClose}>No</Button>
					<Button sx={{ color: 'text.primary' }} onClick={handleRemoveFavorite} autoFocus>Yes</Button>
				</DialogActions>
			</Dialog>

			{/* Navigation Bar */}
			<nav className="bg-black text-white shadow-lg sticky top-0 z-10">
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
							<a href="/frontend/favorites" className="px-3 py-2 rounded-md bg-red-600 transition">Favorites</a>
							<a href={`/frontend/profile/${userID}`} className="px-3 py-2 rounded-md hover:bg-red-600 transition">Profile</a>
						</div>

						{/* Mobile Menu Button */}
						<div className="md:hidden flex items-center">
							<button
								onClick={toggleMobileMenu}
								className="text-white focus:outline-none"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
								</svg>
							</button>
						</div>
					</div>
				</div>

				{/* Mobile Menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden">
						<div className="px-2 pt-2 pb-3 space-y-1 bg-gray-900">
							<a href="/frontend/home" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Home</a>
							<a href="#" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">About</a>
							<a href="/frontend/favorites" className="block px-3 py-2 rounded-md text-base font-medium bg-red-600 transition">Favorites</a>
							<a href={`/frontend/profile/${userID}`} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Profile</a>
						</div>
					</div>
				)}
			</nav>

			{/* Featured Banner */}
			<div className="bg-red-700 text-white py-3">
				<div className="max-w-7xl mx-auto px-4">
					<div className="flex justify-center items-center gap-2">
						<Star size={16} className="text-yellow-400" />
						<p className="text-sm font-medium">Your personal collection of favorite fried chicken recipes!</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="flex items-center mb-6">
					<a href={`/frontend/profile/${userID}`} className="flex items-center text-red-600 hover:text-red-700 mr-4">
						<ChevronLeft size={20} />
						<span className="font-medium">Back to Profile</span>
					</a>
					<h1 className="text-2xl font-bold text-gray-800">My Favorite Recipes</h1>
				</div>

				{/* Search and Filter Bar */}
				<div className="bg-white rounded-xl shadow-md p-4 mb-6 text-black">
					<div className="flex flex-col md:flex-row md:items-center gap-4">
						<div className="relative flex-grow">
							<input
								type="text"
								placeholder="Search favorite recipes..."
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							<Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
							{searchQuery && (
								<button
									onClick={() => setSearchQuery('')}
									className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
								>
									<X size={20} />
								</button>
							)}
						</div>

						<div className="flex gap-2">
							<button
								onClick={() => setShowFilters(!showFilters)}
								className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
									className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-red-500"
									value={sortOption}
									onChange={(e) => setSortOption(e.target.value)}
								>
									<option value="name-asc">Name (A-Z)</option>
									<option value="name-desc">Name (Z-A)</option>
								</select>
								<ArrowUpDown size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
							</div>
						</div>
					</div>

					{/* Filter Options Panel */}
					{showFilters && (
						<div className="mt-4 pt-4 border-t border-gray-200">
							<div className="flex flex-wrap justify-between items-start">
								<div className="w-full md:w-1/2">
									<h3 className="font-medium text-gray-800 mb-2">Difficulty</h3>
									<div className="flex flex-wrap gap-2">
										{difficulties.map(difficulty => (
											<button
												key={difficulty}
												onClick={() => toggleDifficulty(difficulty)}
												className={`px-3 py-1 rounded-full text-sm ${selectedDifficulties.includes(difficulty)
													? 'bg-red-600 text-white'
													: difficulty === 'easy'
														? 'bg-green-100 text-green-800 hover:bg-green-200'
														: difficulty === 'medium'
															? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
															: 'bg-red-100 text-red-800 hover:bg-red-200'
													}`}
											>
												{difficulty}
											</button>
										))}
									</div>
								</div>
							</div>

							<div className="flex justify-end mt-4">
								<button
									onClick={clearFilters}
									className="text-red-600 hover:text-red-700 font-medium"
								>
									Clear All Filters
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Recipe Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredRecipes.map((fav) => {
						const recipe = fav.recipe
						return (
							<div key={recipe.recipe_id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-200">
								<div className="h-48 relative">
									<img
										src={`${API}/${recipe.image_url}`}
										alt={recipe.recipe_name}
										className="w-full h-full object-cover max-w-full"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
									<button
										className="absolute top-3 right-3 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 transition"
										onClick={() => { handleClickOpen(), setSelectedRecipe(recipe) }}
									>
										<Heart size={18} fill="#EF4444" className="text-red-500" />
									</button>
								</div>
								<div className="p-4">
									<h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{recipe.recipe_name}</h3>
									<div className="flex items-center justify-between text-sm">
										<div className="flex items-center text-gray-500">
											<Clock size={16} className="mr-1" />
											<span>{`${recipe.cooking_time} minute`}</span>
										</div>
										<span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
											{recipe.difficulty}
										</span>
									</div>
								</div>
								<Link
									to={`/recipes/${recipe.recipe_id}`}
									className="block bg-red-600 text-white py-2 text-center hover:bg-red-700 transition"
								>
									<span className="font-medium">View Recipe</span>
								</Link>
							</div>
						)
					})}
				</div>

				{/* Empty State */}
				{filteredRecipes.length === 0 && (
					<div className="text-center py-12 bg-white rounded-xl shadow-md">
						<Heart size={48} className="mx-auto text-gray-400 mb-4" />
						<h3 className="text-lg font-medium text-gray-800 mb-2">No recipes found</h3>
						<p className="text-gray-600 mb-4">
							{searchQuery || selectedCategories.length > 0 || selectedDifficulties.length > 0
								? "Try adjusting your filters to see more recipes"
								: "You haven't added any favorite recipes yet"}
						</p>
						{(searchQuery || selectedCategories.length > 0 || selectedDifficulties.length > 0) && (
							<button
								onClick={clearFilters}
								className="inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
							>
								Clear Filters
							</button>
						)}
						{!(searchQuery || selectedCategories.length > 0 || selectedDifficulties.length > 0) && (
							<Link
								to="/recipes"
								className="inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
							>
								Explore Recipes
							</Link>
						)}
					</div>
				)}

				{/* Pagination */}
				{filteredRecipes.length > 0 && (
					<div className="mt-8 flex justify-center">
						<nav className="inline-flex rounded-xl overflow-hidden shadow">
							<button className="px-4 py-2 border-r border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
								Previous
							</button>
							<button className="px-4 py-2 border-r border-gray-300 bg-red-600 text-white">
								1
							</button>
							<button className="px-4 py-2 border-r border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
								2
							</button>
							<button className="px-4 py-2 border-r border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
								3
							</button>
							<button className="px-4 py-2 bg-white text-gray-500 hover:bg-gray-50">
								Next
							</button>
						</nav>
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
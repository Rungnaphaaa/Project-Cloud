import { useEffect, useRef, useState } from "react";
import {
  Clock,
  Star,
  Menu,
  X,
  Heart,
} from "lucide-react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Rating } from "@mui/material";
import { CreateRating, getRatingsByRecipeID } from "../../api/ratingApi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRecipesByID } from "../../api/recipeApi";
import { addFavorite, getFavorites, removeFavorite } from "../../api/favApi";
import type { Favorite } from "../../interfaces/IFavorites";

const API = import.meta.env.VITE_API_URL;

interface Ingredient {
  ingredient_id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
}

interface instructions {
  step_number: number;
  instruction: string;
}

interface RecipeInterface {
  recipe_id: number; // ตรงกับ recipe_id ใน DB
  recipe_name: string; // recipe_name
  description?: string;
  image_url?: string;
  cooking_time?: number;
  difficulty?: string;
  user_id?: number;
  ingredients: Ingredient[];
  steps: instructions[];
  isFavorite?: boolean;
}

export interface RatingInterface {
  ratingId?: number;
  recipeId: number;
  userId: number;
  score: number;
  comment: string;
}

// Helper function to render stars
const RatingStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={18}
          fill={star <= rating ? "#FFD700" : "none"}
          className={star <= rating ? "text-yellow-500" : "text-gray-300"}
        />
      ))}
    </div>
  );
};

export default function RecipeDetailPage() {
  // const [recipe, setRecipe] = useState<Recipe>(recipeData);
  const [activeTab, setActiveTab] = useState<"ingredients" | "instructions">(
    "ingredients"
  );
  // const [servings, setServings] = useState<number>(recipe.servings);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [ratings, setRatings] = useState<RatingInterface[]>([]);
  const [recipe, setRecipe] = useState<RecipeInterface>();
  const [relatedRecipes] = useState<RecipeInterface[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const footerRef = useRef<HTMLElement | null>(null);

  // const [recipe, setRecipe] = useState<RecipeInterface | null>(null);
  // const [relatedRecipes] = useState(relatedRecipesData);
  const [valueRating, setValueRating] = useState<number | null>(0);
  const [comment, setComment] = useState("");
  const userID = localStorage.getItem("userID");
  //const recipeID = localStorage.getItem('recipeID');
  // const { recipeID: recipeID } = useParams();
  const navigate = useNavigate();
  const { recipeID } = useParams(); // สมมติว่า URL คือ /recipe/:id

  useEffect(() => {
    window.scrollTo(0, 0);
    if (recipeID) {
      localStorage.setItem("recipeID", recipeID);
    }
  }, [recipeID]);

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  async function GetRatingsByRecipeID() {
    try {
      const res = await getRatingsByRecipeID(Number(recipeID)); // เรียกใช้ฟังก์ชันที่ดึงตาม recipeId
      console.log("Ratings fetched", res);
      console.log(recipeID);

      if (res && res.status === 200) {
        setRatings(res.data);
        console.log("Fetched recipe data:", res.data);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  }

  async function GetRecipeByID() {
    try {
      const storedUserID = Number(localStorage.getItem("userID"));

      const [recipeResponse, favorites] = await Promise.all([
        getRecipesByID(Number(recipeID)),
        getFavorites(storedUserID),
      ]);

      const favoriteRecipeIds = favorites.map((fav: Favorite) => fav.recipe_id);

      const recipeData = recipeResponse.data;

      // เพิ่ม isFavorite ลงใน recipe object
      const updatedRecipe = {
        ...recipeData,
        isFavorite: favoriteRecipeIds.includes(recipeData.recipe_id),
      };

      setRecipe(updatedRecipe);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  }

  const handleCreateFavorite = async (recipeId: number) => {
    try {
      const userId = Number(userID);
      const res = await addFavorite(userId, recipeId);
      if (res) {
        console.log("Create favorite successful");
        GetRecipeByID();
      }
    } catch (err) {
      console.error("Failed to create favorite", err);
    }
  };

  const handleRemoveFavorite = async (recipeID: number) => {
    try {
      const userId = Number(userID);
      const res = await removeFavorite(userId, recipeID);
      if (res) {
        console.log("remove completed");
        GetRecipeByID();
      }
    } catch (err) {
      console.error("Failed to get favorite", err);
    }
  };

  async function handleCreateRatings() {
    const data: RatingInterface = {
      comment: comment,
      score: valueRating || 0,
      userId: Number(userID) || 0,
      recipeId: Number(recipeID) || 0,
    };

    console.log("Creating rating with:", data);

    const res = await CreateRating(data);
    if (res && res.status === 201) {
      navigate(0);
      setRatings(res.data);
    }
  }

  useEffect(() => {
    const loginStatus = localStorage.getItem("isLogin");
    setIsLoggedIn(loginStatus === "true");

    // getRatings();
    GetRatingsByRecipeID();
    GetRecipeByID();
  }, []);

  console.log(ratings);

  // Calculate average rating
  const averageRating =
    ratings.reduce((acc, review) => acc + review.score, 0) / ratings.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              minHeight: 300, // กำหนดความสูงขั้นต่ำให้กล่องเท่ากันตลอด
              maxHeight: 500,
            },
            component: "form",
            onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const formJson = Object.fromEntries(formData.entries());
              // const email = formJson.email;
              const rating = formJson.rating;
              const comment = formJson.comment;
              // console.log(email);
              console.log("Rating:", rating);
              console.log("Comment:", comment);
              handleClose();
            },
          },
        }}
      >
        <DialogTitle>Submit Your Review</DialogTitle>
        <DialogContent>
          {/* Rating Input */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Rating
            </label>
            <Rating
              name="rating"
              value={valueRating}
              onChange={(_, newValue) => {
                setValueRating(newValue);
              }}
            />
          </div>

          {/* Comment */}
          <div className="mt-6">
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Comment
            </label>
            <TextField
              id="comment"
              name="comment"
              placeholder="Write your review here..."
              multiline
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              fullWidth
              variant="outlined"
              sx={{
                backgroundColor: "#fff",
                borderRadius: 2,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#cbd5e1", // gray-300
                  },
                  "&:hover fieldset": {
                    borderColor: "#94a3b8", // gray-400
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ef4444", // blue-500
                  },
                },
              }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleCreateRatings}
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: "#ef4444", // พื้นหลังปกติ
              "&:hover": {
                backgroundColor: "#dc2626", // พื้นหลังตอน hover
              },
              "&:focus-visible": {
                outline: "2px solid #ef4444",
                outlineOffset: "2px",
              },
            }}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Navigation Bar */}
      <nav className="bg-black text-white shadow-lg sticky top-0 z-999">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:text-red-500 transition">
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
              <a
                href="/frontend/recipes"
                className="px-3 py-2 rounded-md bg-red-600 transition"
              >
                Recipes
              </a>
              <button
                onClick={() =>
                  footerRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-3 py-2 rounded-md hover:bg-red-600 transition"
              >
                About
              </button>
              {isLoggedIn ? (
                <>
                  <a
                    href="/frontend/favorites"
                    className="px-3 py-2 rounded-md hover:bg-red-600 transition"
                  >
                    Favorites
                  </a>
                  <a
                    href={`/frontend/profile/${userID}`}
                    className="px-3 py-2 rounded-md hover:bg-red-600 transition"
                  >
                    Profile
                  </a>
                </>
              ) : (
                <a
                  href="/frontend/login"
                  className="px-3 py-2 rounded-md hover:bg-red-600 transition"
                >
                  Login
                </a>
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
            <div className="px-2 pt-2 pb-3 space-y-1 bg-red-700">
              <a
                href="#"
                className="block px-3 py-2 rounded text-base font-medium hover:bg-red-800 transition"
              >
                Home
              </a>
              <a
                href="#"
                className="block px-3 py-2 rounded text-base font-medium hover:bg-red-800 transition"
              >
                Recipes
              </a>
              <a
                href="#"
                className="block px-3 py-2 rounded text-base font-medium hover:bg-red-800 transition"
              >
                Favorites
              </a>
              <a
                href="#"
                className="block px-3 py-2 rounded text-base font-medium hover:bg-red-800 transition"
              >
                About
              </a>
              <a
                href="#"
                className="block px-3 py-2 rounded text-base font-medium hover:bg-red-800 transition"
              >
                Login
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Recipe Hero Section */}
      <div className="relative">
        <div className="h-64 md:h-96 bg-gray-300 relative">
          <img
            src={`${API}/${recipe?.image_url}`}
            alt={recipe?.recipe_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative -mt-16 md:-mt-24">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                  {recipe?.recipe_name}
                </h1>
                <div className="flex items-center space-x-4 mb-4 flex-wrap">
                  <div className="flex items-center">
                    <RatingStars rating={averageRating} />
                    <span className="ml-2 text-sm text-gray-600">
                      ({ratings.length} reviews)
                    </span>
                  </div>
                  <span className="hidden md:inline text-gray-300">|</span>
                  <span className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-1" />
                    {recipe?.cooking_time} mins
                  </span>
                  <span className="hidden md:inline text-gray-300">|</span>
                  <span
                    className={`text-sm px-2 py-1 rounded ${recipe?.difficulty?.toLowerCase() === "easy"
                      ? "bg-green-100 text-green-800"
                      : recipe?.difficulty?.toLowerCase() === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : recipe?.difficulty?.toLowerCase() === "hard"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {recipe?.difficulty}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{recipe?.description}</p>
              </div>

              <div className="flex md:flex-col justify-between items-center md:items-end mt-4 md:mt-0">
                <div className="flex mt-2 md:mt-4 space-x-2">
                  <button
                    className={` p-2 bg-white rounded-full shadow-md 
                    ${recipe?.isFavorite ? "text-red-500" : "text-gray-400"}
                    ${!isLoggedIn ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                    onClick={() => {
                      if (!isLoggedIn) return; // ป้องกันกดถ้ายังไม่ได้ login
                      if (recipe?.isFavorite) {
                        handleRemoveFavorite(recipe.recipe_id);
                      } else {
                        handleCreateFavorite(recipe?.recipe_id ?? 0);
                      }
                    }}
                  >
                    <Heart
                      size={18}
                      fill={recipe?.isFavorite ? "#EF4444" : "none"}
                      className={
                        recipe?.isFavorite ? "text-red-500" : "text-gray-400"
                      }
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Details */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Recipe Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("ingredients")}
                  className={`flex-1 py-3 font-medium text-center transition focus:outline-none ${activeTab === "ingredients"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-600 hover:text-red-600"
                    }`}
                >
                  Ingredients
                </button>
                <button
                  onClick={() => setActiveTab("instructions")}
                  className={`flex-1 py-3 font-medium text-center transition focus:outline-none ${activeTab === "instructions"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-600 hover:text-red-600"
                    }`}
                >
                  Instructions
                </button>
              </div>

              <div className="p-6">
                {activeTab === "ingredients" ? (
                  <div>
                    <ul>
                      {recipe?.ingredients.map((ing) => (
                        <li
                          key={ing.ingredient_id}
                          className="flex items-center space-x-2"
                        >
                          <div className="h-5 w-5 rounded-full flex-shrink-0 border-2 border-red-500"></div>
                          <span>
                            {ing.ingredient_name} {Math.floor(ing.quantity)}{" "}
                            {ing.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {recipe?.steps.map((instruction) => (
                      <div
                        key={instruction.step_number}
                        className="flex flex-col md:flex-row gap-4"
                      >
                        <div className="md:w-2/3">
                          <div className="flex items-center mb-2">
                            <div className="bg-red-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold">
                              {instruction.step_number}
                            </div>
                            <h3 className="ml-2 font-semibold text-lg">
                              Step {instruction.step_number}
                            </h3>
                          </div>
                          <p className="text-gray-700">
                            {instruction.instruction}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Reviews</h2>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-gray-800 mr-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div>
                    <RatingStars rating={Math.round(averageRating)} />
                    <div className="text-sm text-gray-500">
                      {ratings.length} reviews
                    </div>
                  </div>
                </div>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                  onClick={handleClickOpen}
                >
                  Write a Review
                </button>
              </div>

              <div className="space-y-6">
                {ratings.map((review) => (
                  <div
                    key={review.ratingId}
                    className="border-b border-gray-200 pb-6 last:border-0"
                  >
                    <div className="flex items-start">
                      <div className="ml-3 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center mt-1 md:mt-0">
                            <RatingStars rating={review.score} />
                          </div>
                        </div>
                        <p className="text-gray-600 mt-2">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div>
            {/* Related Recipes */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                You Might Also Like
              </h2>
              <div className="space-y-4">
                {relatedRecipes.map((related) => (
                  <div key={related.recipe_id} className="flex items-start">
                    <div className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-800 hover:text-red-600 transition">
                        <a href="#">{related.recipe_name}</a>
                      </h3>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        {related.cooking_time}
                        <span className="mx-2">•</span>
                        <span
                          className={`px-1.5 py-0.5 rounded ${related.difficulty === "Easy"
                            ? "bg-green-100 text-green-800"
                            : related.difficulty === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {related.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {[
                  "Fried Chicken",
                  "Southern",
                  "Crispy",
                  "American",
                  "Dinner",
                  "Comfort Food",
                ].map((tag, index) => (
                  <a
                    key={index}
                    href="#"
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-red-100 hover:text-red-600 transition"
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-red-50 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Get Weekly Recipes
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Subscribe to our newsletter for new recipes and cooking tips.
              </p>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
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

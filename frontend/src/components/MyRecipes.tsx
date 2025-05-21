import { Link, useParams } from 'react-router-dom';
import { BookOpen, Clock, ChevronRight, Edit, Trash2, Star, PlusCircle, AlertTriangle } from 'lucide-react';
import { API } from '../api/userApi';
import { useEffect, useState } from 'react';
import { getRatingsByRecipeID } from '../api/ratingApi';

interface RecipePreview {
  recipe_id: number;
  recipe_name: string;
  description: string;
  image_url: string;
  cooking_time: number;
  difficulty: string;
  isFavorite?: boolean;
}

interface MyRecipesProps {
  recipes: RecipePreview[];
  isAdminLoggedIn: boolean;
}

interface DeleteConfirmationProps {
  isOpen: boolean;
  recipeName: string;
  onClose: () => void;
  onConfirm: () => void;
}

// utils/getAverageRating.ts
export async function getAverageRating(recipeId: string): Promise<number> {
  try {
    const response = await getRatingsByRecipeID(recipeId);
    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) return 0;  // return 0 แทน null

    const scores: number[] = data.map((entry) => entry.score);
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / scores.length;

    return parseFloat(avg.toFixed(2));
  } catch (error) {
    console.error("Error fetching average rating:", error);
    return 0;  // return 0 ในกรณี error ด้วย
  }
}



// Delete Confirmation Popup Component
const DeleteConfirmation = ({ isOpen, recipeName, onClose, onConfirm }: DeleteConfirmationProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay with blur effect */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Popup Content */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-10 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4 text-red-600">
            <AlertTriangle size={48} />
          </div>
          
          <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
            ยืนยันการลบสูตรอาหาร
          </h3>
          
          <p className="text-gray-600 text-center mb-6">
            คุณต้องการลบสูตร <span className="font-semibold">{recipeName}</span> หรือไม่? การดำเนินการนี้ไม่สามารถเรียกคืนได้
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
            >
              ลบสูตรอาหาร
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyRecipes({ recipes, isAdminLoggedIn }: MyRecipesProps) {
  const [recipesUser, setRecipesUser] = useState<RecipePreview[]>([]);
  const { userID } = useParams();
  const [averageRatings, setAverageRatings] = useState<Record<number, number>>({});

  async function fetchRecipesAndRatings() {
  const data = await getRecipes();
  setRecipesUser(data);

  const ratingsMap: Record<number, number> = {};
  for (const recipe of data) {
    const avg = await getAverageRating(recipe.recipe_id);
    if (avg !== null) {
      ratingsMap[recipe.recipe_id] = avg;
    }
  }
  setAverageRatings(ratingsMap);
}
  // State for delete confirmation popup
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    recipeId: 0,
    recipeName: ''
  });

  const getRecipes = async () => {
    try {
      const response = await fetch(`${API}/recipes/user/${(userID)}`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error("Failed to fetch recipes");
      return await response.json();
    } catch (error) {
      console.error("Error fetching recipes:", error);
      return [];
    }
  };

  async function fetchRecipes() {
    const data = await getRecipes();
    setRecipesUser(data);
  }
  
  useEffect(() => {
    console.log("recipesuser is :", recipesUser);
  }, [recipesUser]);

  useEffect(() => {
    fetchRecipes();
    fetchRecipesAndRatings();
  }, []);

  // Open delete confirmation popup
  const openDeleteConfirmation = (id: number, name: string) => {
    setDeleteConfirmation({
      isOpen: true,
      recipeId: id,
      recipeName: name
    });
  };

  // Close delete confirmation popup
  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      recipeId: 0,
      recipeName: ''
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API}/recipes/${deleteConfirmation.recipeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error("Failed to delete recipe");
      
      // Remove the deleted recipe from state
      setRecipesUser(recipesUser.filter(recipe => recipe.recipe_id !== deleteConfirmation.recipeId));
      
      // Close the popup
      closeDeleteConfirmation();
    } catch (error) {
      console.error("Error deleting recipe:", error);
    }
  };

  // ถ้าไม่ใช่ admin ไม่แสดงส่วนนี้เลย
  if (!isAdminLoggedIn) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          คุณไม่มีสิทธิ์เข้าถึงส่วนนี้
        </h3>
        <p className="text-gray-600 mb-4">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถสร้างและจัดการสูตรอาหารได้</p>
        <Link
          to="/frontend/home"
          className="inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
        >
          กลับไปหน้าหลัก
        </Link>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-600 text-white';
      case 'Medium': return 'bg-yellow-600 text-white';
      case 'Hard': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div>
      {/* Delete Confirmation Popup */}
      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        recipeName={deleteConfirmation.recipeName}
        onClose={closeDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            My Recipes
            <span className="ml-2 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
              {recipesUser.length}
            </span>
          </h2>
          <p className="text-gray-500 mt-1">Create and manage your delicious fried chicken recipes</p>
        </div>
        <Link
          to="/create/recipe"
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <PlusCircle size={18} />
          <span>Create New Recipe</span>
        </Link>
      </div>

      {recipesUser.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipesUser.map((recipe) => (
            <div key={recipe.recipe_id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-200">
              <div className="h-48 relative">
                <img
                  src={`${API}/${recipe.image_url}`}
                  alt={recipe.recipe_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-3 right-3">
                  <div className="flex items-center bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                    <Star size={12} className="text-yellow-400 mr-1" />
                    <span>{averageRatings[recipe.recipe_id]?.toFixed(1) || '0.0'} / 5.0</span>

                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{recipe.recipe_name}</h3>
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center text-gray-500">
                    <Clock size={16} className="mr-1" />
                    <span>{recipe.cooking_time} นาที</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link 
                    to={`/edit/recipe/${recipe.recipe_id}`}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm font-medium text-gray-700"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </Link>
                  <button 
                    onClick={() => openDeleteConfirmation(recipe.recipe_id, recipe.recipe_name)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition text-sm font-medium text-red-600"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
              <Link 
                to={`/recipes/${recipe.recipe_id}`}
                className="bg-red-600 text-white py-2 text-center cursor-pointer hover:bg-red-700 transition block"
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm font-medium">View Recipe</span>
                  <ChevronRight size={16} />
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No recipes created yet</h3>
          <p className="text-gray-600 mb-4">Share your own fried chicken recipes with the Frytopia community</p>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Link
            to="/manage/recipes"
            className="text-red-600 flex items-center hover:text-red-700 transition font-medium"
          >
            Manage All Recipes <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
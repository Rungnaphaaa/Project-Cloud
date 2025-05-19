import { useEffect, useRef, useState } from 'react';
import { Save, ArrowLeft, UploadCloud, X, Plus, Trash2, Star, Clock, Check, AlertCircle } from 'lucide-react';
import { API } from '../../api/userApi';

// Interfaces matching the SQL database structure
export interface Ingredient {
  ingredient_id: number;
  name: string;
  unit: string;
}

export interface RecipeIngredient {
  recipe_id?: number;
  ingredient_id: number;
  quantity: string;
  ingredient_name?: string; // For display purposes
  unit?: string; // For display purposes
}

export interface Step {
  step_id?: number;
  recipe_id?: number;
  step_number: number;
  instruction: string;
}

export interface Recipe {
  recipe_id?: number;
  recipe_name: string;
  image_url: string | null;
  cooking_time: string;
  description: string;
  difficulty: string;
  user_id?: number;
  ingredients: RecipeIngredient[];
  steps: Step[];
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  isVisible: boolean;
}

const Toast = ({ message, type, onClose, isVisible }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-100',
          border: 'border-green-500',
          iconColor: 'text-green-500',
          icon: <Check size={20} />,
        };
      case 'error':
        return {
          bg: 'bg-red-100',
          border: 'border-red-500',
          iconColor: 'text-red-500',
          icon: <AlertCircle size={20} />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-500',
          iconColor: 'text-yellow-500',
          icon: <AlertCircle size={20} />,
        };
      default:
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          iconColor: 'text-blue-500',
          icon: <AlertCircle size={20} />,
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`${styles.bg} border-l-4 ${styles.border} p-4 rounded shadow-lg max-w-md flex items-start`}>
        <div className={`${styles.iconColor} flex-shrink-0 mr-3`}>
          {styles.icon}
        </div>
        <div className="flex-grow">
          <p className="text-sm text-gray-800">{message}</p>
        </div>
        <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};



// Interface for the new ingredient modal
interface NewIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ingredient: Omit<Ingredient, 'ingredient_id'>) => void;
}

// New Ingredient Modal Component
// New Ingredient Modal Component
const NewIngredientModal = ({ isOpen, onClose, onSave }: NewIngredientModalProps) => {

  const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, 'ingredient_id'>>({
    name: '',
    unit: '',
  });


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewIngredient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(newIngredient);
    setNewIngredient({ name: '', unit: '' }); // Reset form
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Add New Ingredient</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Ingredient Name</label>
              <input
                type="text"
                name="name"
                value={newIngredient.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Chicken Breast"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Unit</label>
              <input
                type="text"
                name="unit"
                value={newIngredient.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., kg, pcs, tbsp"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Add Ingredient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminRecipeForm() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [_isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const userID = localStorage.getItem('userID'); // Hardcoded for demo, would come from auth context in real app
  // Initialize recipe state with the structure that matches your SQL tables
  const [recipe, setRecipe] = useState<Recipe>({
    recipe_name: '',
    description: '',
    image_url: '',
    cooking_time: '',
    difficulty: '',
    ingredients: [],
    steps: []
  });

  const difficultyOptions = ['Easy', 'Medium', 'Hard'];

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  interface ShowToastFn {
    (message: string, type?: 'success' | 'error' | 'warning' | 'info'): void;
  }

  const showToast: ShowToastFn = (message, type = 'info') => {
    setToast({
      message,
      type,
      isVisible: true
    });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setSelectedFile(file);
      // Save image to recipe object (optional)
      setRecipe(prev => ({
        ...prev,
        image_url: previewUrl, // or store file separately if you'll upload later
      }));
    }
  };

  function cancleBack() {
    setTimeout(() => {
      window.location.href = `/frontend/profile/${userID}`;
    }, 1000);
  }

  function handleToRecipes() {
    setTimeout(() => {
      window.location.href = "/frontend/profile/" + userID;
    }, 1000);
  }

  const handleRemoveImage = () => {
    setRecipe(prev => ({ ...prev, image_url: null }));
    setImagePreview(null);
  };

  const fetchIngredients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API}/ingredients/`);
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }
      const data = await response.json();
      setIngredients(data);

      // Initialize with first ingredient if available
      if (data.length > 0) {
        setRecipe(prev => ({
          ...prev,
          ingredients: [{
            ingredient_id: data[0].ingredient_id,
            quantity: '',
            ingredient_name: data[0].name,
            unit: data[0].unit
          }]
        }));
      }

      console.log('Ingredients loaded:', data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRecipe(prev => ({
      ...prev,
      difficulty: e.target.value,
    }));
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const { name, value, type } = target;

    let fieldValue: string | boolean;
    if (target instanceof HTMLInputElement && type === 'checkbox') {
      fieldValue = target.checked;
    } else {
      fieldValue = value;
    }

    setRecipe({
      ...recipe,
      [name]: fieldValue
    });
  };

  const handleIngredientChange = (index: number, field: string, value: string) => {
    const updatedIngredients = [...recipe.ingredients];

    if (field === 'ingredient_id') {
      // When ingredient changes, update the ingredient_id and also get its name and unit
      const selectedIngredient = ingredients.find(ing => ing.ingredient_id === parseInt(value));
      if (selectedIngredient) {
        updatedIngredients[index] = {
          ...updatedIngredients[index],
          ingredient_id: parseInt(value),
          ingredient_name: selectedIngredient.name,
          unit: selectedIngredient.unit
        };
      }
    } else {
      updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    }

    setRecipe({ ...recipe, ingredients: updatedIngredients });
  };

  const addIngredient = () => {
    // Default to first ingredient in the list if available
    const defaultIngredient = ingredients.length > 0 ? {
      ingredient_id: ingredients[0].ingredient_id,
      quantity: '',
      ingredient_name: ingredients[0].name,
      unit: ingredients[0].unit
    } : {
      ingredient_id: 0,
      quantity: '',
      ingredient_name: '',
      unit: ''
    };

    setRecipe({
      ...recipe,
      ingredients: [...recipe.ingredients, defaultIngredient]
    });
  };

  const removeIngredient = (index: number) => {
    const updatedIngredients = recipe.ingredients.filter((_, i) => i !== index);
    setRecipe({ ...recipe, ingredients: updatedIngredients });
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    const updatedSteps = [...recipe.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setRecipe({ ...recipe, steps: updatedSteps });
  };

  const addStep = () => {
    const newStepNumber = recipe.steps.length > 0
      ? Math.max(...recipe.steps.map(s => s.step_number)) + 1
      : 1;

    setRecipe({
      ...recipe,
      steps: [...recipe.steps, { step_number: newStepNumber, instruction: '' }]
    });
  };

  const removeStep = (index: number) => {
    const updatedSteps = recipe.steps.filter((_, i) => i !== index);
    setRecipe({ ...recipe, steps: updatedSteps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Format the recipe data to match backend expectations
    const formattedRecipe = {
      recipe_name: recipe.recipe_name,
      image_url: recipe.image_url,
      cooking_time: parseInt(recipe.cooking_time) || 0,
      description: recipe.description,
      difficulty: recipe.difficulty || 'Easy',
      user_id: userID, // Hardcoded for demo, would come from auth context in real app
      ingredients: recipe.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        quantity: parseFloat(ing.quantity) || 0
      })),
      steps: recipe.steps.map(step => ({
        step_number: step.step_number,
        instruction: step.instruction
      }))
    };

    console.log('Submitting recipe:', formattedRecipe);

    // In a real application, you would submit this to your backend
    try {
      const response = await fetch(`${API}/recipes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedRecipe),
      });

      if (!response.ok) {
        throw new Error('Failed to save recipe');
      }
      const responseData = await response.json(); // << ดึงข้อมูลจาก response body

      console.log('Recipe saved successfully!: ', responseData.recipe_id);
      showToast('Recipe saved successfully!', 'success');

      if (selectedFile && responseData.recipe_id) {
        const formData = new FormData();
        formData.append('image', selectedFile); // selectedFile ต้องมาจาก state เช่น useState<File>

        const uploadResponse = await fetch(`${API}/recipes/${responseData.recipe_id}/upload-image/`, {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || 'Image upload failed');
        }

        console.log('Image uploaded successfully:', uploadResult);
      }

      showToast('Recipe saved and image uploaded successfully!', 'success');
      handleToRecipes();
    } catch (error) {
      console.error('Error saving recipe:', error);
      showToast('Failed to save recipe. Please try again.', 'error');
    }
  };

  // Function to handle saving a new ingredient
  const handleSaveNewIngredient = async (ingredientData: Omit<Ingredient, 'ingredient_id'>) => {
    try {
      const response = await fetch(`${API}/ingredients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredientData),
      });

      if (!response.ok) {
        throw new Error('Failed to save ingredient');
      }

      const savedIngredient = await response.json();

      // Update the ingredients list with the new ingredient
      setIngredients(prev => [...prev, savedIngredient]);

      // Add the new ingredient to the recipe's ingredients list
      const newRecipeIngredient: RecipeIngredient = {
        ingredient_id: savedIngredient.ingredient_id,
        quantity: '',
        ingredient_name: savedIngredient.name,
        unit: savedIngredient.unit
      };

      setRecipe(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newRecipeIngredient]
      }));

      setIsModalOpen(false);

      // Show success message
      showToast("ingridient saved successfully.", "success");
    } catch (error) {
      console.error('Error saving ingredient:', error);
      showToast('Failed to save ingredient. Please try again.', 'error');
    }
  };

  // Function to open the ingredient modal
  const openIngredientModal = () => {
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading ingredients...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
      {/* Navigation Bar */}
      <nav className="bg-black text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2 text-xl font-bold">
                <span className="text-red-600 text-2xl">🍗</span>
                <span>Frytopia Admin</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
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
              <a href="/frontend/favorites" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Favorites</a>
              <a href="/frontend/create/recipe" className="px-3 py-2 rounded bg-red-600 transition">Recipes</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Featured Banner */}
      <div className="bg-red-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center gap-2">
            <Star size={16} className="text-yellow-400" />
            <p className="text-sm font-medium">Create amazing recipes for our food lovers!</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center">
          <a href={`/frontend/profile/${userID}`} className="text-red-600 hover:text-red-700 mr-4 flex items-center font-medium">
            <ArrowLeft size={20} className="mr-1" />
            Back to Recipes
          </a>
          <h1 className="text-2xl font-bold text-gray-800">Create New Recipe</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Basic Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Recipe Title</label>
                  <input
                    type="text"
                    name="recipe_name"
                    value={recipe.recipe_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter recipe title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <textarea
                    name="description"
                    value={recipe.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Brief description of the recipe"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Cooking Time (mins)</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="cooking_time"
                        value={recipe.cooking_time}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="30"
                        min="0"
                        required
                      />
                      <Clock size={18} className="absolute left-3 top-2.5 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Difficulty</label>
                    <select
                      name="difficulty"
                      value={recipe.difficulty}
                      onChange={handleDifficultyChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      {difficultyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column - Recipe Image */}
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Recipe Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {recipe.image_url ? (
                      <div className="relative">
                        <img
                          src={imagePreview ? imagePreview : recipe.image_url}
                          alt="Recipe preview"
                          className="mx-auto h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-1 rounded-full hover:bg-red-600 transition"
                          onClick={handleRemoveImage}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="py-8">
                        <UploadCloud size={36} className="mx-auto text-red-500 mb-2" />
                        <p className="text-gray-600 mb-2">Click or drag image to upload</p>
                        <p className="text-gray-400 text-sm">JPG, PNG or GIF (Max. 2MB)</p>
                        <input
                          type="file"
                          className="hidden"
                          id="recipe-image"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('recipe-image');
                            if (input) input.click();
                          }}
                          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                        >
                          Browse Files
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-black p-4 rounded-lg">
                  <h3 className="font-medium text-white mb-2 flex items-center">
                    <Star size={16} className="text-yellow-400 mr-2" />
                    Recipe Tips
                  </h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Use high-quality images for better engagement</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Be specific with measurements in ingredients</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Break down complex steps</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Add special notes where necessary</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-red-600 w-2 h-6 mr-2 rounded"></span>
                Ingredients
              </h2>

              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">Add ingredients for your recipe</p>
                <button
                  type="button"
                  onClick={openIngredientModal}
                  className="flex items-center text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition"
                >
                  <Plus size={16} className="mr-1" />
                  New Ingredient
                </button>
              </div>

              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-2 mb-4">
                  <div className="flex-grow grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-700 text-sm mb-1">Ingredient</label>
                      <select
                        value={ingredient.ingredient_id}
                        onChange={(e) => handleIngredientChange(index, 'ingredient_id', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      >
                        {ingredients.map((option) => (
                          <option key={option.ingredient_id} value={option.ingredient_id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm mb-1">Quantity</label>
                      <input
                        type="text"
                        value={ingredient.quantity}
                        onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Amount (e.g., 2, 0.5)"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm mb-1">Unit</label>
                      <input
                        type="text"
                        value={ingredient.unit || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Unit from ingredient"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-600 hover:text-red-700"
                      aria-label="Remove ingredient"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addIngredient}
                className="mt-2 flex items-center text-red-600 hover:text-red-700"
              >
                <Plus size={18} className="mr-1" />
                Add Ingredient
              </button>
            </div>

            {/* Cooking Steps */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-red-600 w-2 h-6 mr-2 rounded"></span>
                Cooking Steps
              </h2>

              {recipe.steps.map((step, index) => (
                <div key={index} className="mb-4 bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Step {step.step_number}</h3>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2">
                      <label className="block text-gray-700 text-sm mb-1">Step Number</label>
                      <input
                        type="number"
                        value={step.step_number}
                        onChange={(e) => handleStepChange(index, 'step_number', `${parseInt(e.target.value) || 1}`)}
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="col-span-10">
                      <label className="block text-gray-700 text-sm mb-1">Step Description</label>
                      <textarea
                        value={step.instruction}
                        onChange={(e) => handleStepChange(index, 'instruction', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={`Describe step ${step.step_number}`}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addStep}
                className="mt-2 flex items-center text-red-600 hover:text-red-700"
              >
                <Plus size={18} className="mr-1" />
                Add Step
              </button>
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                onClick={() => {
                  cancleBack();
                  setIsMobileMenuOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
              >
                <Save size={18} className="mr-2" />
                Save Recipe
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer ref={footerRef} className="bg-black text-white pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} "In a world full of flavors, be the crunch. 🔥" — Frytopia</p>
          </div>
        </div>
      </footer>

      {/* New Ingredient Modal */}
      <NewIngredientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewIngredient}
      />
    </div>
  );
}

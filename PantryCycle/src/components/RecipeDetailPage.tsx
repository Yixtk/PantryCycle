import { ChevronLeft, Clock, Users, Flame, Minus, Plus, Star } from 'lucide-react';
import { Recipe } from '../types';
import { Button } from './ui/button';
import { useState } from 'react';

// Phase colors and icons
const PHASE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  menstrual: { bg: '#f4c2c2', text: '#9b6b6b', icon: '🩸' },
  follicular: { bg: '#c8d5c0', text: '#5a6b54', icon: '🌱' },
  ovulation: { bg: '#b8d4d1', text: '#4a7370', icon: '✨' },
  luteal: { bg: '#d4c5d8', text: '#7a6b7e', icon: '🌙' },
};

interface RecipeDetailPageProps {
  recipe: Recipe;
  onBack: () => void;
  onSaveRecipe?: (recipe: Recipe) => void;
}

export function RecipeDetailPage({ recipe, onBack, onSaveRecipe }: RecipeDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [servings, setServings] = useState(recipe.servings);
  const [rating, setRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);

  const servingMultiplier = servings / recipe.servings;

  const adjustServings = (change: number) => {
    const newServings = Math.max(1, servings + change);
    setServings(newServings);
  };

  const handleRating = (stars: number) => {
    setRating(stars);
    setHasRated(true);
    // Save the recipe when user rates it
    if (onSaveRecipe) {
      onSaveRecipe(recipe);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col hide-scrollbar">
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Header Image */}
        <div className="relative h-64">
          <img
            src={recipe.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onBack}
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full"
          >
            <ChevronLeft className="h-6 w-6 text-slate-900" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-white flex-1">{recipe.name}</h1>
              {recipe.phase && PHASE_COLORS[recipe.phase.toLowerCase()] && (
                <span
                  className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 flex-shrink-0"
                  style={{
                    backgroundColor: PHASE_COLORS[recipe.phase.toLowerCase()].bg,
                    color: PHASE_COLORS[recipe.phase.toLowerCase()].text
                  }}
                >
                  <span className="text-sm">{PHASE_COLORS[recipe.phase.toLowerCase()].icon}</span>
                  <span className="capitalize font-medium">{recipe.phase}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white mx-4 -mt-6 relative rounded-2xl shadow-lg p-4 mb-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="rounded-xl p-3 mb-2 flex items-center justify-center" style={{ backgroundColor: '#e1e5de' }}>
                <Flame className="h-5 w-5" style={{ color: '#8a9a84' }} />
              </div>
              <div className="text-xs text-slate-600">Calories</div>
              <div className="text-slate-900">{recipe.calories}</div>
            </div>
            <div className="text-center">
              <div className="bg-yellow-50 rounded-xl p-3 mb-2 flex items-center justify-center">
                <Clock className="h-5 w-5" style={{ color: '#8a9a84' }} />
              </div>
              <div className="text-xs text-slate-600">Prep</div>
              <div className="text-slate-900">{recipe.prepTime}m</div>
            </div>
            <div className="text-center">
              <div className="rounded-xl p-3 mb-2 flex items-center justify-center" style={{ backgroundColor: '#e1e5de' }}>
                <Clock className="h-5 w-5" style={{ color: '#8a9a84' }} />
              </div>
              <div className="text-xs text-slate-600">Cook</div>
              <div className="text-slate-900">{recipe.cookTime}m</div>
            </div>
            <div className="text-center">
              <div className="bg-yellow-50 rounded-xl p-3 mb-2 flex items-center justify-center">
                <Users className="h-5 w-5" style={{ color: '#8a9a84' }} />
              </div>
              <div className="text-xs text-slate-600">Servings</div>
              <div className="text-slate-900">{recipe.servings}</div>
            </div>
          </div>
        </div>

        {/* Nutrition */}
        {recipe.nutritionPerServing && (
          <div className="bg-white mx-4 rounded-2xl shadow-lg p-4 mb-4">
            <h2 className="text-slate-900 mb-3">Nutrition per serving</h2>
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#f0f2ef' }}>
                <div className="text-slate-900 mb-1">{recipe.nutritionPerServing.protein || 0}g</div>
                <div className="text-xs text-slate-600">Protein</div>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#e1e5de' }}>
                <div className="text-slate-900 mb-1">{recipe.nutritionPerServing['unsaturated fat'] || 0}g</div>
                <div className="text-xs text-slate-600">Unsat. Fat</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <div className="text-slate-900 mb-1">{recipe.nutritionPerServing['saturated fat'] || 0}g</div>
                <div className="text-xs text-slate-600">Sat. Fat</div>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#f0f2ef' }}>
                <div className="text-slate-900 mb-1">{recipe.nutritionPerServing.fiber || 0}g</div>
                <div className="text-xs text-slate-600">Fiber</div>
              </div>
            </div>
          </div>
        )}

        {/* Adjust Servings */}
        <div className="bg-white mx-4 rounded-2xl shadow-lg p-4 mb-4">
          <h2 className="text-slate-900 mb-3">Adjust Servings</h2>
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => adjustServings(-1)}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[80px]">
              <div className="text-slate-900">{servings}</div>
              <div className="text-xs text-slate-600">servings</div>
            </div>
            <Button
              onClick={() => adjustServings(1)}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {servingMultiplier !== 1 && (
            <p className="text-xs text-slate-500 text-center mt-3">
              Ingredient amounts will be adjusted by {servingMultiplier.toFixed(1)}x
            </p>
          )}
        </div>

        {/* Rating Section */}
        <div className="bg-white mx-4 rounded-2xl shadow-lg p-4 mb-4">
          <h2 className="text-slate-900 mb-3">Rate This Recipe</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {hasRated && (
            <p className="text-sm text-center" style={{ color: '#8a9a84' }}>
              Thanks for rating! You gave this recipe {rating} star{rating !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="mx-4 mb-4">
          <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('ingredients')}
              className="flex-1 py-2 rounded-xl transition-colors"
              style={{
                background: activeTab === 'ingredients' ? 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' : 'transparent',
                color: activeTab === 'ingredients' ? 'white' : '#64748b'
              }}
            >
              Ingredients
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className="flex-1 py-2 rounded-xl transition-colors"
              style={{
                background: activeTab === 'instructions' ? 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' : 'transparent',
                color: activeTab === 'instructions' ? 'white' : '#64748b'
              }}
            >
              Instructions
            </button>
          </div>

          {/* Ingredients */}
          {activeTab === 'ingredients' && (
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h2 className="text-slate-900 mb-4">Ingredients</h2>
              <div className="space-y-3">
                {Object.entries(recipe.ingredients).map(([item, amount], index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: '#e1e5de', color: '#8a9a84' }}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <span className="text-slate-900 capitalize">{item}</span>
                    </div>
                    <div className="text-sm text-slate-600">{amount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {activeTab === 'instructions' && (
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
              <h2 className="text-slate-900 mb-4">Instructions</h2>
              <div className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: '#8a9a84' }}>
                      {index + 1}
                    </div>
                    <p className="text-slate-700 flex-1 pt-1">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="px-4 pb-6">
          <Button className="w-full text-white py-6" style={{ background: 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' }}>
            Start Cooking
          </Button>
        </div>
      </div>
    </div>
  );
}
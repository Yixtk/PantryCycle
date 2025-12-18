import { useState } from 'react';
import { Search, Home, User, BookOpen, Droplet, Flame, Clock } from 'lucide-react';
import { Recipe } from '../types';
import { Input } from './ui/input';
import { getRecipeGradient, getRecipeEmoji, formatCalories } from '../utils/recipeImageMatcher';

// Phase colors and icons
const PHASE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  menstrual: { bg: '#f4c2c2', text: '#9b6b6b', icon: '🩸' },
  follicular: { bg: '#c8d5c0', text: '#5a6b54', icon: '🌱' },
  ovulation: { bg: '#b8d4d1', text: '#4a7370', icon: '✨' },
  luteal: { bg: '#d4c5d8', text: '#7a6b7e', icon: '🌙' },
};

interface RecipeListPageProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onNavigate: (page: string) => void;
}

export function RecipeListPage({ recipes, onRecipeClick, onNavigate }: RecipeListPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get nutrition data (supports both formats)
  const getNutrition = (recipe: Recipe) => {
    const nutrition = recipe.nutritionPerServing || recipe.nutrition || {};
    
    // Calculate total fat from saturated + unsaturated fat
    const saturatedFat = nutrition['saturated fat'] || 0;
    const unsaturatedFat = nutrition['unsaturated fat'] || 0;
    const totalFat = saturatedFat + unsaturatedFat;
    
    return {
      protein: nutrition.protein || 0,
      carbs: nutrition.carbs || nutrition.carbohydrates || 0,
      fat: nutrition.fat || totalFat || 0,
      fiber: nutrition.fiber || 0,
      calories: nutrition.calories || 0
    };
  };

  return (
    <div className="min-h-screen flex flex-col hide-scrollbar" style={{ background: 'linear-gradient(to bottom, #e1e5de 0%, #f0f2ef 50%, #ffffff 100%)' }}>
      <div className="flex-1 p-4 pb-20 overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="mb-4">
          <h1 className="mb-4" style={{ color: '#5a6b54' }}>My Recipes</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search saved recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="space-y-4">
          {filteredRecipes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#e1e5de' }}>
                <BookOpen className="h-8 w-8" style={{ color: '#8a9a84' }} />
              </div>
              <h3 className="text-slate-900 mb-2">No Selected Recipes Yet</h3>
              <p className="text-slate-600 text-sm mb-4">
                Go to Calendar and click on any day to add recipes to your meal plan!
              </p>
              <button
                onClick={() => onNavigate('calendar')}
                className="px-4 py-2 rounded-lg text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' }}
              >
                Go to Calendar
              </button>
            </div>
          ) : (
            filteredRecipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onRecipeClick(recipe)}
                className="w-full bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div
                  className="w-full h-48 flex items-center justify-center text-8xl"
                  style={{ background: getRecipeGradient(recipe.name) }}
                >
                  {getRecipeEmoji(recipe.name)}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-slate-900 flex-1">{recipe.name}</h3>
                    {((recipe.phase && PHASE_COLORS[recipe.phase.toLowerCase()]) || 
                      (recipe.cyclePhase && PHASE_COLORS[recipe.cyclePhase])) && (
                      <span 
                        className="px-2 py-1 rounded-full text-[10px] flex items-center gap-1 flex-shrink-0"
                        style={{ 
                          backgroundColor: PHASE_COLORS[(recipe.phase || recipe.cyclePhase || '').toLowerCase()]?.bg,
                          color: PHASE_COLORS[(recipe.phase || recipe.cyclePhase || '').toLowerCase()]?.text
                        }}
                      >
                        <span>{PHASE_COLORS[(recipe.phase || recipe.cyclePhase || '').toLowerCase()]?.icon}</span>
                        <span className="capitalize">{recipe.phase || recipe.cyclePhase}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-slate-600 text-sm">
                      <Flame className="h-4 w-4" style={{ color: '#8a9a84' }} />
                      <span>{formatCalories(recipe.calories)} cal</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 text-sm">
                      <Clock className="h-4 w-4" style={{ color: '#8a9a84' }} />
                      <span>{(recipe.prepTime || 0) + (recipe.cookTime || 0)}m</span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <div className="flex-1 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#f0f2ef' }}>
                      <div className="text-slate-600">Protein</div>
                      <div className="text-slate-900">{getNutrition(recipe).protein || 0}g</div>
                    </div>
                    <div className="flex-1 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#e1e5de' }}>
                      <div className="text-slate-600">Carbs</div>
                      <div className="text-slate-900">{getNutrition(recipe).carbs || 0}g</div>
                    </div>
                    <div className="flex-1 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#f0f2ef' }}>
                      <div className="text-slate-600">Fat</div>
                      <div className="text-slate-900">{getNutrition(recipe).fat || 0}g</div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 safe-area-inset-bottom">
        <div className="flex justify-around max-w-md mx-auto">
          <button
            onClick={() => onNavigate('calendar')}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => onNavigate('recipes')}
            className="flex flex-col items-center gap-1"
            style={{ color: '#8a9a84' }}
          >
            <BookOpen className="h-6 w-6" />
            <span className="text-xs">Recipes</span>
          </button>
          <button
            onClick={() => onNavigate('grocery')}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs">Grocery</span>
          </button>
          <button
            onClick={() => onNavigate('period')}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <Droplet className="h-6 w-6" />
            <span className="text-xs">Period</span>
          </button>
          <button 
            onClick={() => onNavigate('profile')}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
// ============================================
// CORE DATA TYPES - Backend API Interfaces
// ============================================

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthday?: Date;
}
// Update your WeekBlock interface in src/types/index.ts:

export interface WeekBlock {
  id: string;
  startDate: Date;
  endDate: Date;
  meals: { 
    [day: number]: Array<{
      meal: string;        // 'breakfast', 'lunch', 'dinner'
      recipeId: number | null;   // Recipe ID from database
      phase: string;       // 'Menstrual', 'Follicular', 'Ovulation', 'Luteal'
    }> 
  };
}


export interface UserProfile {
  userId: string;
  lastPeriodStart?: Date;
  lastPeriodEnd?: Date;
  periodHistory?: PeriodRecord[];
  dietaryPreferences: string[];
  allergies: { type: string }[];
  selectedMeals: { [day: number]: string[] }; // Default schedule
  weekBlocks?: WeekBlock[]; // ← ADD THIS
  recipesPerWeek: number;
}

export interface PeriodRecord {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  duration: number;
}

export interface DayLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  flow?: 'light' | 'medium' | 'heavy';
  symptoms: {
    cramps?: boolean;
    headache?: boolean;
    bloating?: boolean;
    fatigue?: boolean;
    insomnia?: boolean;
    cravings?: boolean;
  };
  mood?: 'happy' | 'neutral' | 'sad';
  energy?: 'high' | 'low';
  notes?: string;
}

export interface Allergy {
  type: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

// Also update your Recipe interface to include the new fields:
export interface Recipe {
  id: number;  // Changed from string to number
  name: string;
  description: string;
  ingredients: { [key: string]: string }; // e.g., {"chicken": "1 lb"}
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings: number;
  calories: number;
  nutritionPerServing?: {
    calories: number;
    protein: number;
    [key: string]: number;
  };
  imageUrl?: string;
  phase: string; // 'Menstrual', 'Follicular', 'Ovulation', 'Luteal'
  mealTypes: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
}


export interface Ingredient {
  item: string;
  amount: string;
}

export interface Nutrition {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface SavedRecipe {
  id: string;
  userId: string;
  recipeId: string;
  savedAt: Date;
  rating?: number;
}

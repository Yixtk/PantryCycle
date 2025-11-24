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

export interface UserProfile {
  userId: string;
  // Period tracking
  lastPeriodStart?: Date;
  lastPeriodEnd?: Date;
  periodHistory: PeriodRecord[];
  
  // Dietary preferences
  dietaryPreferences: string[];
  allergies: Allergy[];
  
  // Meal preferences
  selectedMeals: { [day: number]: string[] }; // { 0: ['breakfast', 'lunch'], 1: ['dinner'], ... }
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

export interface Recipe {
  id: string;
  name: string;
  image: string;
  calories: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  cyclePhase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  tags: string[];
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
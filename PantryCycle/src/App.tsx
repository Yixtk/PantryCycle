import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { OnboardingPage } from './components/OnboardingPage';
import { CalendarPage } from './components/CalendarPage';
import { RecipeListPage } from './components/RecipeListPage';
import { RecipeDetailPage } from './components/RecipeDetailPage';
import { ProfilePage } from './components/ProfilePage';
import { GroceryListPage } from './components/GroceryListPage';
import { PeriodTrackerPage } from './components/PeriodTrackerPage';
import { User, UserProfile, Recipe } from './types';
import * as api from './services/api';

type AppState = 'login' | 'onboarding' | 'calendar' | 'recipes' | 'recipeDetail' | 'profile' | 'grocery' | 'period';

export default function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  // Load user data after login
  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    }
  }, [user]);

  // ============================================
  // DATA LOADING
  // ============================================

  const loadUserData = async (userId: string) => {
    try {
      const [profile, recipes, saved] = await Promise.all([
        api.getUserProfile(userId),
        api.getRecommendedRecipes(userId),
        api.getSavedRecipes(userId),
      ]);
      
      setUserProfile(profile);
      setRecommendedRecipes(recipes);
      setSavedRecipes(saved);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // ============================================
  // AUTH HANDLERS
  // ============================================

  const handleLogin = async (username: string, password: string) => {
    try {
      const loggedInUser = await api.loginUser(username, password);
      setUser(loggedInUser);
      setAppState('calendar');
    } catch (error) {
      console.error('Login failed:', error);
      // TODO: Show error message to user
    }
  };

  const handleCreateAccount = async (accountData: {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  try {
    const newUser = await api.createUser(
      accountData.username,
      accountData.password,
      accountData.firstName,
      accountData.lastName
    );
    setUser(newUser);
    setAppState('onboarding');
  } catch (error) {
    console.error('Account creation failed:', error);
    // TODO: Show error message to user
  }
};

  // ============================================
  // ONBOARDING HANDLER
  // ============================================

  const handleOnboardingComplete = async (data: {
  lastPeriodStart: Date;
  lastPeriodEnd: Date;
  dietaryPreferences: string[];
  allergies: string[];
  selectedMeals: { [day: number]: string[] };
}) => {
  if (!user) return;

  try {
    // Helper function to get next Sunday
    const getNextSunday = () => {
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      if (currentDay === 0) {
        // Today is Sunday, use today
        const sunday = new Date(today);
        sunday.setHours(0, 0, 0, 0);
        return sunday;
      } else {
        // Get next Sunday
        const daysUntilSunday = 7 - currentDay;
        const nextSunday = new Date(today);
        nextSunday.setDate(today.getDate() + daysUntilSunday);
        nextSunday.setHours(0, 0, 0, 0);
        return nextSunday;
      }
    };

    const getSaturday = (sunday: Date) => {
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      saturday.setHours(23, 59, 59, 999);
      return saturday;
    };

    // Create first week block for upcoming Sunday
    const nextSunday = getNextSunday();
    const firstWeekBlock = {
      id: `week-${Date.now()}`,
      startDate: nextSunday,
      endDate: getSaturday(nextSunday),
      meals: data.selectedMeals
    };

    // Update profile with period info, preferences, AND first week block
    const profile = await api.updateUserProfile(user.id, {
      lastPeriodStart: data.lastPeriodStart,
      lastPeriodEnd: data.lastPeriodEnd,
      dietaryPreferences: data.dietaryPreferences,
      allergies: data.allergies.map(a => ({ type: a })),
      selectedMeals: data.selectedMeals,  // Keep as default
      weekBlocks: [firstWeekBlock],       // Add first week
      recipesPerWeek: 7,
    });

    setUserProfile(profile);
    setAppState('calendar');
  } catch (error) {
    console.error('Onboarding failed:', error);
    // TODO: Show error message to user
  }
};

  // ============================================
  // PROFILE UPDATE HANDLER
  // ============================================

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;

    try {
      const updated = await api.updateUserProfile(user.id, updates);
      setUserProfile(updated);
    } catch (error) {
      console.error('Profile update failed:', error);
      // TODO: Show error message to user
    }
  };

  // ============================================
  // RECIPE HANDLERS
  // ============================================

  const handleSaveRecipe = async (recipe: Recipe, rating?: number) => {
    if (!user) return;

    try {
      await api.saveRecipe(user.id, recipe.id, rating);
      setSavedRecipes(prev => [...prev.filter(r => r.id !== recipe.id), recipe]);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      // TODO: Show error message to user
    }
  };

  // ============================================
  // NAVIGATION
  // ============================================

  const handleNavigate = (page: string) => {
    setAppState(page as AppState);
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setAppState('recipeDetail');
  };

  const handleBackFromRecipe = () => {
    setAppState('calendar');
    setSelectedRecipe(null);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="size-full">
      {appState === 'login' && (
        <LoginPage onLogin={handleLogin} onCreateAccount={handleCreateAccount} />
      )}

      {appState === 'onboarding' && (
        <OnboardingPage onComplete={handleOnboardingComplete} />
      )}

      {appState === 'calendar' && userProfile && (
        <CalendarPage
          recipes={recommendedRecipes}
          userProfile={userProfile}
          onRecipeClick={handleRecipeClick}
          onNavigate={handleNavigate}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {appState === 'recipes' && (
        <RecipeListPage
          recipes={savedRecipes}
          onRecipeClick={handleRecipeClick}
          onNavigate={handleNavigate}
        />
      )}

      {appState === 'recipeDetail' && selectedRecipe && (
        <RecipeDetailPage
          recipe={selectedRecipe}
          onBack={handleBackFromRecipe}
          onSaveRecipe={handleSaveRecipe}
        />
      )}

      {appState === 'profile' && user && userProfile && (
        <ProfilePage
          user={user}
          userProfile={userProfile}
          onNavigate={handleNavigate}
          onUpdateProfile={handleUpdateProfile}
          onSignOut={() => {
            setUser(null);
            setUserProfile(null);
            setAppState('login');
          }}
        />
      )}

      {appState === 'grocery' && (
        <GroceryListPage recipes={savedRecipes} onNavigate={handleNavigate} />
      )}

      {appState === 'period' && userProfile && (
        <PeriodTrackerPage 
          userProfile={userProfile}
          onNavigate={handleNavigate}
          onUpdateProfile={handleUpdateProfile}
        />
      )}
    </div>
  );
}

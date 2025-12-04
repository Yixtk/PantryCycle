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
    
    // Load user profile to check if migration is needed
    const profile = await api.getUserProfile(loggedInUser.id);
    
    // Migration: If user has selectedMeals but no weekBlocks, create one
    if (profile.selectedMeals && Object.keys(profile.selectedMeals).length > 0 && 
        (!profile.weekBlocks || profile.weekBlocks.length === 0)) {
      
      console.log('Migrating user to week blocks...');
      
      // Helper functions
      const getNextSunday = () => {
        const today = new Date();
        const currentDay = today.getDay();
        
        if (currentDay === 0) {
          const sunday = new Date(today);
          sunday.setHours(0, 0, 0, 0);
          return sunday;
        } else {
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

      // Create first week block for next Sunday
      const nextSunday = getNextSunday();
      const firstWeekBlock = {
        id: `week-${Date.now()}`,
        startDate: nextSunday,
        endDate: getSaturday(nextSunday),
        meals: profile.selectedMeals
      };

      // Save the week block
      await api.updateUserProfile(loggedInUser.id, {
        weekBlocks: [firstWeekBlock]
      });
      
      console.log('Migration complete! Week block created for', nextSunday);
    }
    
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
    console.log('Starting onboarding completion...', {
      periodStart: data.lastPeriodStart,
      periodEnd: data.lastPeriodEnd,
      mealsSelected: Object.keys(data.selectedMeals).length
    });

    // Helper functions
    const getUpcomingSunday = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentDay = today.getDay();
      
      // If today is Sunday, use today
      // Otherwise, get NEXT Sunday
      if (currentDay === 0) {
        return today;
      } else {
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
    const upcomingSunday = getUpcomingSunday();
    const firstWeekBlock = {
      id: `week-${Date.now()}`,
      startDate: upcomingSunday,
      endDate: getSaturday(upcomingSunday),
      meals: data.selectedMeals
    };

    console.log('Creating week block:', {
      start: upcomingSunday.toDateString(),
      end: getSaturday(upcomingSunday).toDateString(),
      mealsCount: Object.values(data.selectedMeals).flat().length
    });

    // Format dates as strings to avoid timezone issues
    const startDateString = data.lastPeriodStart.toISOString().split('T')[0];
    const endDateString = data.lastPeriodEnd.toISOString().split('T')[0];

    // Save everything to database
    await api.updateUserProfile(user.id, {
      lastPeriodStart: new Date(startDateString), // Use date string
      lastPeriodEnd: new Date(endDateString),     // Use date string
      dietaryPreferences: data.dietaryPreferences,
      allergies: data.allergies.map(a => ({ type: a })),
      selectedMeals: data.selectedMeals,
      weekBlocks: [firstWeekBlock],
      recipesPerWeek: 7,
    });

    console.log('Profile updated successfully');

    // Load the data from database
    await loadUserData(user.id);

    console.log('User data loaded');

    // Navigate to calendar
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

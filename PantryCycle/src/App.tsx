import React, { useState, useEffect } from 'react';
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
  const [recipes, setRecipes] = useState<Recipe[]>([]); // All available recipes
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
      console.log('🚀 loadUserData START for userId:', userId);
      
      // Load user profile
      const profile = await api.getUserProfile(userId);
      console.log('👤 Profile loaded:', {
        username: profile.username,
        weekBlocksCount: profile.weekBlocks?.length || 0,
        weekBlocks: profile.weekBlocks
      });
      setUserProfile(profile);

      // Load recommended recipes using new API
      const recommended = await api.getRecommendedRecipes(userId);
      console.log(`📋 Recommended recipes loaded: ${recommended.length}`);
      
      // Remove duplicates based on recipe id
      const uniqueRecommended = Array.from(
        new Map(recommended.map(recipe => [recipe.id, recipe])).values()
      );
      console.log(`✅ Unique recommended recipes: ${uniqueRecommended.length}`);
      
      setRecommendedRecipes(uniqueRecommended);

      // Load all recipes that are in the user's meal plan
      const selectedRecipeIds = new Set<number>();
      if (profile.weekBlocks) {
        profile.weekBlocks.forEach((block, blockIndex) => {
          console.log(`📅 Block ${blockIndex}: ${block.id}, meals:`, block.meals);
          Object.entries(block.meals).forEach(([day, dayMeals]) => {
            dayMeals.forEach(meal => {
              if (typeof meal !== 'string' && meal.recipeId) {
                selectedRecipeIds.add(meal.recipeId);
                console.log(`  → Day ${day}: Added recipeId ${meal.recipeId} (${meal.meal})`);
              }
            });
          });
        });
      }
      console.log(`🎯 Total selected recipe IDs from weekBlocks:`, Array.from(selectedRecipeIds));

      // Fetch any recipes that are in meal plan but not in recommendations
      const missingRecipeIds = Array.from(selectedRecipeIds).filter(
        id => !uniqueRecommended.find(r => r.id === id)
      );
      console.log(`🔍 Missing recipe IDs (not in recommendations):`, missingRecipeIds);

      let additionalRecipes: Recipe[] = [];
      if (missingRecipeIds.length > 0) {
        console.log('🔍 Fetching missing recipes by IDs:', missingRecipeIds);
        // Fetch specific recipes by their IDs
        additionalRecipes = await api.getRecipesByIds(missingRecipeIds);
        console.log(`✅ Fetched ${additionalRecipes.length} additional recipes:`, additionalRecipes.map(r => ({ id: r.id, name: r.name })));
      } else {
        console.log('ℹ️ No missing recipes to fetch');
      }

      // Combine recommended + additional recipes
      const allAvailableRecipes = [...uniqueRecommended, ...additionalRecipes];
      console.log(`📦 Total recipes available: ${allAvailableRecipes.length}`);
      console.log(`   - Recommended: ${uniqueRecommended.length}`);
      console.log(`   - Additional: ${additionalRecipes.length}`);
      console.log(`   - Recipe IDs:`, allAvailableRecipes.map(r => r.id));
      setRecipes(allAvailableRecipes);

      // Load saved recipes (if any)
      const saved = await api.getSavedRecipes(userId);
      setSavedRecipes(saved);

    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };


  // ============================================
  // AUTH HANDLERS
  // ============================================

  // Helper function to convert old meal format to new format
  const convertMealsToWeekBlock = (selectedMeals: { [day: number]: string[] }, startDate: Date, profile: UserProfile) => {
    const convertedMeals: { [day: number]: Array<{ meal: string; recipeId: number | null; phase: string }> } = {};
    
    Object.entries(selectedMeals).forEach(([dayStr, meals]) => {
      const day = parseInt(dayStr);
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      // Calculate phase for this date
      const phase = profile.lastPeriodStart 
        ? api.getPhaseForDate(currentDate, profile.lastPeriodStart, profile.averageCycleLength || 28)
        : 'Follicular';
      
      convertedMeals[day] = meals.map(meal => ({
        meal,
        recipeId: null,
        phase
      }));
    });
    
    return convertedMeals;
  };

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
        meals: convertMealsToWeekBlock(profile.selectedMeals, nextSunday, profile)
      };

      // Save the week block
      await api.updateUserProfile(loggedInUser.id, {
        weekBlocks: [firstWeekBlock]
      });
      
      console.log('Migration complete! Week block created for', nextSunday);
    }
    
    // Load all user data (recipes, week blocks, etc.)
    await loadUserData(loggedInUser.id);
    
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
    const getSmartWeekStart = (selectedMeals: { [day: number]: string[] }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentDay = today.getDay();
      
      // Find the earliest selected day
      const selectedDays = Object.keys(selectedMeals).map(d => parseInt(d));
      if (selectedDays.length === 0) {
        // No meals selected, default to next Sunday
        const daysUntilSunday = currentDay === 0 ? 7 : 7 - currentDay;
        const nextSunday = new Date(today);
        nextSunday.setDate(today.getDate() + daysUntilSunday);
        nextSunday.setHours(0, 0, 0, 0);
        return nextSunday;
      }
      
      const earliestSelectedDay = Math.min(...selectedDays);
      
      // If earliest selected day is after today (in the same week), use this week
      // If earliest selected day is today or before, use next week
      if (earliestSelectedDay > currentDay) {
        // Use this week's Sunday
        const daysFromSunday = currentDay;
        const thisSunday = new Date(today);
        thisSunday.setDate(today.getDate() - daysFromSunday);
        thisSunday.setHours(0, 0, 0, 0);
        return thisSunday;
      } else {
        // Use next week's Sunday
        const daysUntilSunday = currentDay === 0 ? 7 : 7 - currentDay;
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

    // Create first week block - smart week selection based on selected meals
    const weekStartSunday = getSmartWeekStart(data.selectedMeals);
    
    // Create a temporary profile object for phase calculation
    const tempProfile: UserProfile = {
      userId: user.id,
      lastPeriodStart: data.lastPeriodStart,
      lastPeriodEnd: data.lastPeriodEnd,
      dietaryPreferences: data.dietaryPreferences,
      allergies: data.allergies.map(a => ({ type: a })),
      selectedMeals: data.selectedMeals,
      recipesPerWeek: 7,
    };
    
    const firstWeekBlock = {
      id: `week-${Date.now()}`,
      startDate: weekStartSunday,
      endDate: getSaturday(weekStartSunday),
      meals: convertMealsToWeekBlock(data.selectedMeals, weekStartSunday, tempProfile)
    };

    console.log('Creating week block:', {
      start: weekStartSunday.toDateString(),
      end: getSaturday(weekStartSunday).toDateString(),
      mealsCount: Object.values(data.selectedMeals).flat().length,
      selectedDays: Object.keys(data.selectedMeals).map(d => parseInt(d)),
      today: new Date().getDay()
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
      console.log('Updating profile with:', updates);
      await api.updateUserProfile(user.id, updates);
      
      // If weekBlocks were updated, reload all data to ensure consistency
      if (updates.weekBlocks) {
        console.log('Week blocks updated, reloading all user data...');
        await loadUserData(user.id);
      } else {
        // For other updates, just refresh the profile
        const refreshedProfile = await api.getUserProfile(user.id);
        setUserProfile(refreshedProfile);
      }
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
          recipes={recipes}
          userProfile={userProfile}
          onRecipeClick={handleRecipeClick}
          onNavigate={handleNavigate}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {appState === 'recipes' && userProfile && (
        <RecipeListPage
          recipes={(() => {
            // Get all selected recipes from week blocks
            const selectedRecipeIds = new Set<number>();
            if (userProfile.weekBlocks) {
              userProfile.weekBlocks.forEach(block => {
                Object.values(block.meals).forEach(dayMeals => {
                  dayMeals.forEach(meal => {
                    if (typeof meal !== 'string' && meal.recipeId) {
                      selectedRecipeIds.add(meal.recipeId);
                    }
                  });
                });
              });
            }
            
            // Filter from ALL available recipes (not just recommended)
            // This includes recommended + additional recipes loaded for meal plan
            const filtered = recipes.filter(r => selectedRecipeIds.has(r.id));
            
            // Extra deduplication: ensure no duplicate recipes in the list
            const uniqueFiltered = Array.from(
              new Map(filtered.map(recipe => [recipe.id, recipe])).values()
            );
            
            console.log('Selected recipe IDs:', Array.from(selectedRecipeIds));
            console.log('Filtered recipes:', uniqueFiltered.map(r => ({ id: r.id, name: r.name })));
            
            return uniqueFiltered;
          })()}
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

      {appState === 'grocery' && userProfile && (
        <GroceryListPage 
          recipes={recipes} 
          userProfile={userProfile}
          onNavigate={handleNavigate} 
        />
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

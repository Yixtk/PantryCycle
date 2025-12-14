// ============================================
// API SERVICE - Backend Integration Layer
// ============================================
// Replace these functions with actual API calls to your backend

import { User, UserProfile, Recipe, PeriodRecord, DayLog, SavedRecipe } from '../types';

// TODO: Replace with your backend URL
const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// AUTH API
// ============================================

// ============================================
// AUTHENTICATION
// ============================================

export async function loginUser(username: string, password: string): Promise<User> {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username,
        password 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function createUser(
  username: string,
  password: string,
  firstName: string,
  lastName: string,
  email?: string,
  phone?: string
): Promise<User> {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        firstName,
        lastName
        // email and phone removed - not collected by frontend form
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// ============================================
// USER PROFILE API
// ============================================

export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const response = await fetch(`/api/get-profile?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get profile');
    }
    
    const data = await response.json();
    const profile = data.profile;
    
    // Convert date strings to Date objects
    return {
      ...profile,
      lastPeriodStart: profile.lastPeriodStart ? new Date(profile.lastPeriodStart) : undefined,
      lastPeriodEnd: profile.lastPeriodEnd ? new Date(profile.lastPeriodEnd) : undefined,
      periodHistory: profile.periodHistory?.map((record: any) => ({
        ...record,
        startDate: new Date(record.startDate),
        endDate: new Date(record.endDate)
      })) || [],
      weekBlocks: profile.weekBlocks?.map((block: any) => ({
        ...block,
        startDate: new Date(block.startDate),
        endDate: new Date(block.endDate)
      })) || []
    };
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const body: any = {
      userId,
      dietaryPreferences: profile.dietaryPreferences,
      allergies: profile.allergies?.map(a => a.type),
      selectedMeals: profile.selectedMeals,
    };

    // Handle week blocks
    if (profile.weekBlocks) {
      body.weekBlocks = profile.weekBlocks.map(block => ({
        ...block,
        startDate: block.startDate instanceof Date 
          ? block.startDate.toISOString() 
          : block.startDate,
        endDate: block.endDate instanceof Date 
          ? block.endDate.toISOString() 
          : block.endDate,
      }));
    }

    // Handle period dates - use date strings to avoid timezone issues
    if (profile.lastPeriodStart) {
      body.lastPeriodStart = profile.lastPeriodStart instanceof Date
        ? profile.lastPeriodStart.toISOString().split('T')[0]
        : profile.lastPeriodStart;
    }

    if (profile.lastPeriodEnd) {
      body.lastPeriodEnd = profile.lastPeriodEnd instanceof Date
        ? profile.lastPeriodEnd.toISOString().split('T')[0]
        : profile.lastPeriodEnd;
    }

    const response = await fetch('/api/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    // Fetch updated profile
    return getUserProfile(userId);
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

export async function addPeriodRecord(userId: string, record: Omit<PeriodRecord, 'id' | 'userId'>): Promise<PeriodRecord> {
  // This now just returns the record since we save it via updateUserProfile
  return {
    id: Date.now().toString(),
    userId,
    ...record
  };
}

export async function getPeriodHistory(userId: string): Promise<PeriodRecord[]> {
  try {
    const response = await fetch(`/api/get-periods?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get period history');
    }

    const data = await response.json();
    return data.periods;
  } catch (error) {
    console.error('Get periods error:', error);
    throw error;
  }
}

export async function saveDayLog(userId: string, log: Omit<DayLog, 'id' | 'userId'>): Promise<DayLog> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/users/${userId}/day-logs`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(log)
  // });
  // return response.json();
  
  // Mock response
  return {
    id: Date.now().toString(),
    userId,
    ...log,
  };
}

export async function getDayLogs(userId: string, startDate: string, endDate: string): Promise<DayLog[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(
  //   `${API_BASE_URL}/users/${userId}/day-logs?start=${startDate}&end=${endDate}`
  // );
  // return response.json();
  
  // Mock response with sample symptom data
  const today = new Date();
  const mockLogs: DayLog[] = [];
  
  // Add logs for the last 30 days with varied symptoms
  for (let i = 0; i < 30; i++) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);
    const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
    
    // Adjust to match new timing: period was 20 days ago (days 20-25 ago were period days)
    const isPeriodDay = i >= 20 && i <= 25;
    const isPrePeriod = i >= 17 && i < 20;
    const isFollicular = i >= 26 && i <= 32;
    
    if (isPeriodDay) {
      mockLogs.push({
        id: `log-${i}`,
        userId,
        date: dateStr,
        flow: i === 20 || i === 21 ? 'heavy' : i === 22 || i === 23 ? 'medium' : 'light',
        symptoms: {
          cramps: i <= 22,
          fatigue: i <= 23,
          headache: i === 20 || i === 21,
        },
        mood: i <= 21 ? 'sad' : 'neutral',
        energy: 'low',
      });
    } else if (isPrePeriod) {
      mockLogs.push({
        id: `log-${i}`,
        userId,
        date: dateStr,
        symptoms: {
          bloating: true,
          cravings: true,
          fatigue: true,
        },
        mood: 'neutral',
        energy: 'low',
      });
    } else if (isFollicular) {
      mockLogs.push({
        id: `log-${i}`,
        userId,
        date: dateStr,
        symptoms: {},
        mood: 'happy',
        energy: 'high',
      });
    } else if (i < 17) {
      // Recent days - luteal phase (approaching next period)
      mockLogs.push({
        id: `log-${i}`,
        userId,
        date: dateStr,
        symptoms: {
          bloating: i < 5,
          cravings: i < 8,
        },
        mood: i < 3 ? 'neutral' : 'happy',
        energy: i < 6 ? 'low' : 'high',
      });
    }
  }
  
  return mockLogs;
}

// ============================================
// RECIPES API
// ============================================

export async function getRecommendedRecipes(userId: string): Promise<Recipe[]> {
  // TODO: Replace with actual API call
  // This should return recipes based on user's cycle phase, preferences, and allergies
  // const response = await fetch(`${API_BASE_URL}/users/${userId}/recipes/recommended`);
  // return response.json();
  
  // Mock response - return mock recipes
  const { mockRecipes } = await import('../components/RecipeData');
  return mockRecipes;
}

// NEW: Get recipes with filters
export async function getRecipes(filters: {
  phase?: string;           // 'Menstrual', 'Follicular', 'Ovulation', 'Luteal'
  mealType?: string;        // 'breakfast', 'lunch', 'dinner'
  dietary?: string[];       // ['Vegetarian', 'Gluten-Free']
  allergens?: string[];     // ['Dairy', 'Eggs']
  limit?: number;
}): Promise<Recipe[]> {
  try {
    const params = new URLSearchParams();
    
    if (filters.phase) params.append('phase', filters.phase);
    if (filters.mealType) params.append('mealType', filters.mealType);
    if (filters.dietary && filters.dietary.length > 0) {
      params.append('dietary', filters.dietary.join(','));
    }
    if (filters.allergens && filters.allergens.length > 0) {
      params.append('allergens', filters.allergens.join(','));
    }
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`/api/get-recipes?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch recipes');
    }
    
    const data = await response.json();
    return data.recipes;
  } catch (error) {
    console.error('Get recipes error:', error);
    throw error;
  }
}

// Helper function to get phase for a specific date
export function getPhaseForDate(date: Date, lastPeriodStart: Date, avgCycleLength: number = 28): string {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const periodStart = new Date(lastPeriodStart);
  periodStart.setHours(0, 0, 0, 0);
  
  const daysSinceLastPeriod = Math.ceil((checkDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate cycle day (1-indexed)
  let cycleDay = (daysSinceLastPeriod % avgCycleLength) + 1;
  if (cycleDay <= 0) cycleDay += avgCycleLength;
  
  // Determine phase based on cycle day
  if (cycleDay >= 1 && cycleDay <= 5) {
    return 'Menstrual';
  } else if (cycleDay >= 6 && cycleDay <= 13) {
    return 'Follicular';
  } else if (cycleDay >= 14 && cycleDay <= 16) {
    return 'Ovulation';
  } else {
    return 'Luteal';
  }
}

export async function getSavedRecipes(userId: string): Promise<Recipe[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/users/${userId}/recipes/saved`);
  // return response.json();
  
  // Mock response
  return [];
}

export async function saveRecipe(userId: string, recipeId: string, rating?: number): Promise<SavedRecipe> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/users/${userId}/recipes/saved`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ recipeId, rating })
  // });
  // return response.json();
  
  // Mock response
  return {
    id: Date.now().toString(),
    userId,
    recipeId,
    savedAt: new Date(),
    rating,
  };
}

export async function unsaveRecipe(userId: string, recipeId: string): Promise<void> {
  // TODO: Replace with actual API call
  // await fetch(`${API_BASE_URL}/users/${userId}/recipes/saved/${recipeId}`, {
  //   method: 'DELETE'
  // });
}

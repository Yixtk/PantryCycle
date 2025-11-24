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
        email: username,  // In login form, username is actually email
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
        email: email || username, // Use email parameter or username as email
        password,
        firstName,
        lastName,
        phone
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
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`);
  // return response.json();
  
  // Generate mock period history for demo (last 6 periods)
  const today = new Date();
  const mockPeriodHistory: PeriodRecord[] = [];
  
  // Start from 5 cycles ago (roughly 140 days ago with 28-day cycles)
  for (let i = 5; i >= 0; i--) {
    const cycleStart = new Date(today);
    cycleStart.setDate(today.getDate() - (i * 28) - 20); // 20 days ago for the most recent (so predicted period is in 8 days)
    
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleStart.getDate() + 4); // Add 4 days to get 5-day duration (day 0-4 = 5 days)
    
    mockPeriodHistory.push({
      id: `period-${i}`,
      userId,
      startDate: cycleStart,
      endDate: cycleEnd,
      duration: 5,
    });
  }

  // Most recent period
  const lastPeriod = mockPeriodHistory[mockPeriodHistory.length - 1];
  
  console.log('Mock period data generated:', {
    lastPeriodStart: lastPeriod.startDate,
    lastPeriodEnd: lastPeriod.endDate,
    totalPeriods: mockPeriodHistory.length
  });
  
  // Mock response with realistic data
  return {
    userId,
    lastPeriodStart: lastPeriod.startDate,
    lastPeriodEnd: lastPeriod.endDate,
    periodHistory: mockPeriodHistory,
    dietaryPreferences: ['Vegetarian', 'Gluten-Free'],
    allergies: [{ type: 'Peanuts' }, { type: 'Shellfish' }],
    selectedMeals: { 0: ['breakfast', 'lunch'], 1: ['breakfast', 'dinner'], 2: ['lunch'], 3: ['breakfast', 'lunch', 'dinner'], 4: ['lunch', 'dinner'], 5: ['breakfast', 'lunch'], 6: ['breakfast', 'dinner'] },
    recipesPerWeek: 7,
  };
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(profile)
  // });
  // return response.json();
  
  // Mock response
  return { userId, ...profile } as UserProfile;
}

// ============================================
// PERIOD TRACKING API
// ============================================

export async function addPeriodRecord(userId: string, record: Omit<PeriodRecord, 'id' | 'userId'>): Promise<PeriodRecord> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/users/${userId}/periods`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(record)
  // });
  // return response.json();
  
  // Mock response
  return {
    id: Date.now().toString(),
    userId,
    ...record,
  };
}

export async function getPeriodHistory(userId: string): Promise<PeriodRecord[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/users/${userId}/periods`);
  // return response.json();
  
  // Mock response
  return [];
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
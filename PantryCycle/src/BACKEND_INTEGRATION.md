# Backend Integration Guide

## Overview

This application has been simplified for easy backend integration. All data types and API calls are centralized in two files:

- `/types/index.ts` - Core data interfaces
- `/services/api.ts` - API integration layer

## Architecture

```
┌─────────────┐
│   App.tsx   │ ← Main app state & orchestration
└──────┬──────┘
       │
       ├─→ /services/api.ts ← Replace mock functions with real API calls
       │         │
       │         └─→ Your Backend API
       │
       └─→ /types/index.ts ← Shared type definitions
```

## Quick Start

### 1. Configure API Base URL

In `/services/api.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

Set your backend URL in `.env`:
```
REACT_APP_API_URL=https://your-backend.com/api
```

### 2. Implement API Functions

Each function in `/services/api.ts` has:
- ✅ TypeScript interface
- ✅ Commented example of real API call
- ⚠️ Mock implementation (replace these!)

Example:
```typescript
export async function loginUser(username: string, password: string): Promise<User> {
  // TODO: Replace with actual API call
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}
```

## API Endpoints Needed

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - Create new user

### User Profile
- `GET /users/:userId/profile` - Get user profile
- `PATCH /users/:userId/profile` - Update profile

### Period Tracking
- `POST /users/:userId/periods` - Add period record
- `GET /users/:userId/periods` - Get period history
- `POST /users/:userId/day-logs` - Save daily log (symptoms, mood, etc.)
- `GET /users/:userId/day-logs?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get day logs

### Recipes
- `GET /users/:userId/recipes/recommended` - Get personalized recipes based on cycle phase
- `GET /users/:userId/recipes/saved` - Get user's saved recipes
- `POST /users/:userId/recipes/saved` - Save a recipe
- `DELETE /users/:userId/recipes/saved/:recipeId` - Unsave a recipe

## Data Models

### User
```typescript
{
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthday?: Date;
}
```

### UserProfile
```typescript
{
  userId: string;
  lastPeriodStart?: Date;
  lastPeriodEnd?: Date;
  periodHistory: PeriodRecord[];
  dietaryPreferences: string[]; // ['Vegetarian', 'Vegan', etc.]
  allergies: Allergy[];
  selectedDays: number[]; // [0,1,2,3,4,5,6] - Days of week for meals
  recipesPerWeek: number;
}
```

### PeriodRecord
```typescript
{
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
}
```

### DayLog
```typescript
{
  id: string;
  userId: string;
  date: string; // 'YYYY-MM-DD'
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
```

### Recipe
```typescript
{
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
```

## State Management Flow

```
1. User Login
   └─→ api.loginUser() → User object
       └─→ App.setUser()
           └─→ loadUserData()
               ├─→ api.getUserProfile() → UserProfile
               ├─→ api.getRecommendedRecipes() → Recipe[]
               └─→ api.getSavedRecipes() → Recipe[]

2. Onboarding
   └─→ api.createUser() → User object
       └─→ api.addPeriodRecord() → PeriodRecord
           └─→ api.updateUserProfile() → UserProfile

3. Profile Updates
   └─→ api.updateUserProfile() → UserProfile
       └─→ App.setUserProfile()
```

## Error Handling

Currently errors are logged to console. Add proper error handling:

```typescript
try {
  const user = await api.loginUser(username, password);
  setUser(user);
} catch (error) {
  // Show error toast/modal to user
  console.error('Login failed:', error);
  showErrorMessage('Invalid username or password');
}
```

## Authentication

Add token-based auth by modifying `/services/api.ts`:

```typescript
// Store token after login
localStorage.setItem('authToken', token);

// Add to all requests
const response = await fetch(`${API_BASE_URL}/endpoint`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});
```

## Testing

Mock data is still available in `/components/RecipeData.tsx` for testing UI without backend.

To use real data:
1. Replace functions in `/services/api.ts`
2. Update `API_BASE_URL`
3. Test each endpoint individually

## Removed Complexity

✅ No Redux/MobX - Simple React state  
✅ No complex data transformations - Direct API → UI  
✅ No nested state updates - Flat structure  
✅ No redundant data storage - Single source of truth  
✅ Clean separation - Types, API, Components

## Next Steps

1. Set up backend API with endpoints listed above
2. Replace mock functions in `/services/api.ts`
3. Add error handling UI components
4. Implement authentication tokens
5. Add loading states
6. Test data flow end-to-end

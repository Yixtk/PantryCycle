import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Home, User, BookOpen, Droplet, Plus, Check, X } from 'lucide-react';
import { Recipe, UserProfile, PeriodRecord, WeekBlock } from '../types';
import { Button } from './ui/button';
import * as api from '../services/api';
import { formatCalories } from '../utils/recipeImageMatcher';

interface CalendarPageProps {
  recipes: Recipe[];
  userProfile: UserProfile;
  onRecipeClick: (recipe: Recipe) => void;
  onNavigate: (page: string) => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
}

const COLORS = {
  sage: '#8a9a84',
  sageDark: '#5a6b54',
  sageLight: '#a8b5a0',
  sageBg: '#f0f2ef',
  sageBgLight: '#e1e5de',
  
  menstrual: '#f4c2c2',
  menstrualText: '#9b6b6b',
  
  follicular: '#c8d5c0',
  follicularText: '#5a6b54',
  
  ovulation: '#b8d4d1',
  ovulationText: '#4a7370',
  
  luteal: '#d4c5d8',
  lutealText: '#7a6b7e',
  
  predictedPeriod: '#f8d4d4',
  predictedText: '#b89090',
};

export function CalendarPage({ 
  recipes, 
  userProfile,
  onRecipeClick, 
  onNavigate, 
  onUpdateProfile
}: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pastPeriods, setPastPeriods] = useState<PeriodRecord[]>([]);
  
  // Debug: Log userProfile when it changes
  useEffect(() => {
    console.log('📊 CalendarPage received userProfile:', {
      hasProfile: !!userProfile,
      weekBlocksCount: userProfile.weekBlocks?.length || 0,
      weekBlocks: userProfile.weekBlocks
    });
    console.log('📊 CalendarPage received recipes:', {
      recipesCount: recipes.length,
      recipeIds: recipes.map(r => r.id)
    });
  }, [userProfile, recipes]);
  
  // Add Week Modal state
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [newWeekMeals, setNewWeekMeals] = useState<{ [day: number]: string[] }>({});
  const [isSavingWeek, setIsSavingWeek] = useState(false);

  // Recipe selection state (Step 2)
  const [modalStep, setModalStep] = useState<'selectMeals' | 'selectRecipes'>('selectMeals');
  const [recommendedRecipesForWeek, setRecommendedRecipesForWeek] = useState<{ [key: string]: Recipe[] }>({});
  const [selectedRecipesForMeals, setSelectedRecipesForMeals] = useState<{ [key: string]: number | null }>({});

  // Edit Day Modal state
  const [showEditDayModal, setShowEditDayModal] = useState(false);
  const [selectedEditDate, setSelectedEditDate] = useState<Date | null>(null);
  const [editingMealType, setEditingMealType] = useState<string | null>(null);
  const [recipeOptions, setRecipeOptions] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [showRecipeAdded, setShowRecipeAdded] = useState(false);
  const [cachedRecipes, setCachedRecipes] = useState<Map<number, Recipe>>(new Map());

  useEffect(() => {
    if (userProfile.periodHistory && userProfile.periodHistory.length > 0) {
      setPastPeriods(userProfile.periodHistory);
    } else if (userProfile.lastPeriodStart && userProfile.lastPeriodEnd) {
      const duration = Math.ceil(
        (userProfile.lastPeriodEnd.getTime() - userProfile.lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      setPastPeriods([{
        id: 'temp',
        userId: userProfile.userId,
        startDate: userProfile.lastPeriodStart,
        endDate: userProfile.lastPeriodEnd,
        duration: duration,
      }]);
    }
  }, [userProfile]);

  // ========== HELPER FUNCTIONS ==========

  const getSundayOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  };

  const getSaturdayOfWeek = (sunday: Date) => {
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);
    return saturday;
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWeekBlockForDate = (date: Date): WeekBlock | null => {
    if (!userProfile.weekBlocks || userProfile.weekBlocks.length === 0) {
      console.log('⚠️ getWeekBlockForDate: No week blocks available');
      return null;
    }

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    console.log(`🔍 Looking for week block containing ${checkDate.toISOString()}`);

    for (const block of userProfile.weekBlocks) {
      const start = block.startDate instanceof Date 
        ? new Date(block.startDate) 
        : new Date(block.startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = block.endDate instanceof Date 
        ? new Date(block.endDate) 
        : new Date(block.endDate);
      end.setHours(23, 59, 59, 999);
      
      console.log(`  Block ${block.id}: ${start.toISOString()} to ${end.toISOString()}`);

      if (checkDate >= start && checkDate <= end) {
        console.log(`  ✅ Found matching block: ${block.id}`);
        return {
          ...block,
          startDate: start,
          endDate: end
        };
      }
    }
    
    console.log(`  ❌ No matching week block found`);
    return null;
  };

  const getAvailableWeeks = (): Date[] => {
    const weeks: Date[] = [];
    const today = new Date();
    const currentWeekStart = getSundayOfWeek(today);

    if (!userProfile.weekBlocks || !Array.isArray(userProfile.weekBlocks)) {
      for (let i = 0; i < 8; i++) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        weeks.push(weekStart);
      }
      return weeks;
    }

    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      let isPlanned = false;
      
      try {
        for (const block of userProfile.weekBlocks) {
          if (!block || !block.startDate) {
            console.warn('Invalid week block:', block);
            continue;
          }
          
          const blockStart = block.startDate instanceof Date 
            ? new Date(block.startDate) 
            : new Date(block.startDate);
          blockStart.setHours(0, 0, 0, 0);
          
          if (blockStart.getTime() === weekStart.getTime()) {
            isPlanned = true;
            break;
          }
        }
      } catch (error) {
        console.error('Error checking week blocks:', error);
      }

      if (!isPlanned) {
        weeks.push(weekStart);
      }
    }

    return weeks;
  };

  // ========== PERIOD CALCULATIONS ==========

  const calculateAverageCycleLength = (): number => {
    if (pastPeriods.length < 2) return 28;
    
    const cycles: number[] = [];
    for (let i = 0; i < pastPeriods.length - 1; i++) {
      const days = Math.ceil(
        (pastPeriods[i].startDate.getTime() - pastPeriods[i + 1].startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      cycles.push(days);
    }
    
    return Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);
  };

  const predictNextPeriod = (): { startDate: Date; endDate: Date } | null => {
    if (pastPeriods.length === 0) return null;

    const avgCycleLength = calculateAverageCycleLength();
    const lastPeriod = pastPeriods[0];
    const avgDuration = pastPeriods.reduce((sum, p) => sum + p.duration, 0) / pastPeriods.length;

    const nextStart = new Date(lastPeriod.startDate);
    nextStart.setDate(nextStart.getDate() + avgCycleLength);

    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextEnd.getDate() + Math.round(avgDuration));

    return { startDate: nextStart, endDate: nextEnd };
  };

  const getPhaseForDate = (date: Date): 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'predicted' | null => {
    if (pastPeriods.length === 0) return null;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    for (const period of pastPeriods) {
      const start = new Date(period.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(period.endDate);
      end.setHours(0, 0, 0, 0);
      
      if (checkDate >= start && checkDate <= end) {
        return 'menstrual';
      }
    }

    const predicted = predictNextPeriod();
    if (predicted) {
      const predStart = new Date(predicted.startDate);
      predStart.setHours(0, 0, 0, 0);
      const predEnd = new Date(predicted.endDate);
      predEnd.setHours(0, 0, 0, 0);
      
      if (checkDate >= predStart && checkDate <= predEnd) {
        return 'predicted';
      }
    }

    const lastPeriod = pastPeriods[0];
    const lastPeriodStart = new Date(lastPeriod.startDate);
    lastPeriodStart.setHours(0, 0, 0, 0);
    
    const daysSinceLastPeriodStart = Math.round(
      (checkDate.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastPeriodStart < 0) {
      return null;
    }
    
    const avgCycleLength = calculateAverageCycleLength();
    if (daysSinceLastPeriodStart >= avgCycleLength) {
      return null;
    }
    
    const cycleDay = daysSinceLastPeriodStart + 1;
    
    if (cycleDay >= 6 && cycleDay <= 13) {
      return 'follicular';
    } else if (cycleDay >= 14 && cycleDay <= 16) {
      return 'ovulation';
    } else if (cycleDay >= 17) {
      return 'luteal';
    }

    return null;
  };

  // Helper to get phase name for API (capitalize first letter)
  const getPhaseNameForAPI = (phase: string | null): string => {
    if (!phase || phase === 'predicted') return 'Menstrual'; // Default to Menstrual
    return phase.charAt(0).toUpperCase() + phase.slice(1); // menstrual -> Menstrual
  };

  // ========== ADD WEEK MODAL FUNCTIONS ==========

  const handleOpenAddWeekModal = () => {
    setNewWeekMeals({});
    setSelectedWeekStart(null);
    setShowAddWeekModal(true);
  };

  const handleSelectWeek = (weekStart: Date) => {
    setSelectedWeekStart(weekStart);
  };

  const toggleMealForDay = (day: number, meal: string) => {
    setNewWeekMeals(prev => {
      const dayMeals = prev[day] || [];
      const newDayMeals = dayMeals.includes(meal)
        ? dayMeals.filter((m) => m !== meal)
        : [...dayMeals, meal];
      
      if (newDayMeals.length === 0) {
        const { [day]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [day]: newDayMeals };
    });
  };

  const getTotalMealsSelected = () => {
    return Object.values(newWeekMeals).reduce((total, meals) => total + meals.length, 0);
  };

  const handleSaveWeek = async () => {
    if (!selectedWeekStart || getTotalMealsSelected() === 0) {
      return;
    }

    setIsSavingWeek(true);

    try {
      // Build enhanced meals object with user-selected recipe assignments
      const enhancedMeals: { 
        [day: number]: Array<{ 
          meal: string; 
          recipeId: number | null; 
          phase: string 
        }> 
      } = {};

      // Process each day that has meals
      for (const [dayStr, meals] of Object.entries(newWeekMeals)) {
        const day = parseInt(dayStr);
        const dayDate = new Date(selectedWeekStart);
        dayDate.setDate(selectedWeekStart.getDate() + day);
        
        const phaseRaw = getPhaseForDate(dayDate);
        const phase = getPhaseNameForAPI(phaseRaw);
        
        const dayMealAssignments = [];
        
        for (const mealType of meals) {
          const key = `${day}-${mealType}`;
          const selectedRecipeId = selectedRecipesForMeals[key];
          
              dayMealAssignments.push({
                meal: mealType,
            recipeId: selectedRecipeId || null,
                phase: phase
              });
        }
        
        enhancedMeals[day] = dayMealAssignments;
      }

      // Create the week block with recipe assignments
      const newBlock: WeekBlock = {
        id: `week-${Date.now()}`,
        startDate: selectedWeekStart,
        endDate: getSaturdayOfWeek(selectedWeekStart),
        meals: enhancedMeals,
      };

      const updatedWeekBlocks = [...(userProfile.weekBlocks || []), newBlock];

      if (onUpdateProfile) {
        await onUpdateProfile({
          weekBlocks: updatedWeekBlocks,
        });
      }

      setShowAddWeekModal(false);
      setNewWeekMeals({});
      setSelectedWeekStart(null);
      setModalStep('selectMeals');
      setRecommendedRecipesForWeek({});
      setSelectedRecipesForMeals({});
    } catch (error) {
      console.error('Error saving week:', error);
      alert('Failed to save week. Please try again.');
    } finally {
      setIsSavingWeek(false);
    }
  };

  const handleCancelAddWeek = () => {
    setShowAddWeekModal(false);
    setNewWeekMeals({});
    setSelectedWeekStart(null);
    setModalStep('selectMeals');
    setRecommendedRecipesForWeek({});
    setSelectedRecipesForMeals({});
  };

  const handleProceedToRecipeSelection = async () => {
    if (!selectedWeekStart || getTotalMealsSelected() === 0) {
      return;
    }

    setIsSavingWeek(true);

    try {
      const avgCycleLength = calculateAverageCycleLength();
      const lastPeriodStart = userProfile.lastPeriodStart || new Date();
      const recommendations: { [key: string]: Recipe[] } = {};

      // For each day and meal, fetch 3-5 recipe options
      for (const [dayStr, meals] of Object.entries(newWeekMeals)) {
        const day = parseInt(dayStr);
        const dayDate = new Date(selectedWeekStart);
        dayDate.setDate(selectedWeekStart.getDate() + day);
        
        const phaseRaw = getPhaseForDate(dayDate);
        const phase = getPhaseNameForAPI(phaseRaw);
        
        for (const mealType of meals) {
          const key = `${day}-${mealType}`;
          
          try {
            // Fetch 5 recipe options for this meal
            const matchingRecipes = await api.getRecipes({
              phase: phase,
              mealType: mealType,
              dietary: userProfile.dietaryPreferences,
              allergens: userProfile.allergies.map(a => a.type),
              limit: 5
            });

            recommendations[key] = matchingRecipes;
          } catch (error) {
            console.error(`Error fetching recipes for ${mealType}:`, error);
            recommendations[key] = [];
          }
        }
      }

      setRecommendedRecipesForWeek(recommendations);
      setModalStep('selectRecipes');
    } catch (error) {
      console.error('Error loading recipe recommendations:', error);
      alert('Failed to load recommendations. Please try again.');
    } finally {
      setIsSavingWeek(false);
    }
  };

  const handleBackToMealSelection = () => {
    setModalStep('selectMeals');
    setRecommendedRecipesForWeek({});
    setSelectedRecipesForMeals({});
  };

  const handleSelectRecipeForMeal = (mealKey: string, recipeId: number) => {
    setSelectedRecipesForMeals(prev => ({
      ...prev,
      [mealKey]: recipeId
    }));
  };

  // ========== EDIT DAY MODAL FUNCTIONS ==========

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedEditDate(clickedDate);
    setShowEditDayModal(true);
  };

  const handleSelectMealToEdit = async (mealType: string) => {
    if (!selectedEditDate) return;
    
    setEditingMealType(mealType);
    setIsLoadingRecipes(true);
    
    try {
      // Calculate phase for this date
      const phaseRaw = getPhaseForDate(selectedEditDate);
      const phase = getPhaseNameForAPI(phaseRaw);
      
      // Fetch recipes that match this phase, meal type, and user preferences
      const matchingRecipes = await api.getRecipes({
        phase: phase,
        mealType: mealType,
        dietary: userProfile.dietaryPreferences,
        allergens: userProfile.allergies.map(a => a.type),
        limit: 10 // Get 10 options for user to choose from
      });
      
      setRecipeOptions(matchingRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setRecipeOptions([]);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  const handleSelectRecipe = async (recipe: Recipe | null) => {
    if (!selectedEditDate || !editingMealType) return;

    // Show feedback animation and cache the recipe
    if (recipe) {
      setSelectedRecipeId(recipe.id);
      setShowRecipeAdded(true);
      setTimeout(() => setShowRecipeAdded(false), 2000);
      
      // Cache the selected recipe so it's available later
      setCachedRecipes(prev => new Map(prev).set(recipe.id, recipe));
      console.log('Cached recipe:', recipe.id, recipe.name);
    }

    try {
      // Find the week block for this date
      const dayOfWeek = selectedEditDate.getDay();
      const weekBlock = getWeekBlockForDate(selectedEditDate);
      
      if (!weekBlock) {
        // No week block exists for this date - need to create one
        const sunday = getSundayOfWeek(selectedEditDate);
        const phaseRaw = getPhaseForDate(selectedEditDate);
        const phase = getPhaseNameForAPI(phaseRaw);
        
        const newBlock: WeekBlock = {
          id: `week-${Date.now()}`,
          startDate: sunday,
          endDate: getSaturdayOfWeek(sunday),
          meals: {
            [dayOfWeek]: [{
              meal: editingMealType,
              recipeId: recipe ? recipe.id : null,
              phase: phase
            }]
          },
        };
        
        const updatedWeekBlocks = [...(userProfile.weekBlocks || []), newBlock];
        
        if (onUpdateProfile) {
          await onUpdateProfile({ weekBlocks: updatedWeekBlocks });
        }
      } else {
        // Update existing week block
        const updatedWeekBlocks = (userProfile.weekBlocks || []).map(block => {
          if (block.id === weekBlock.id) {
            const phaseRaw = getPhaseForDate(selectedEditDate);
            const phase = getPhaseNameForAPI(phaseRaw);
            
            // Get existing meals for this day
            const existingMeals = block.meals[dayOfWeek] || [];
            
            console.log('Existing meals for day', dayOfWeek, ':', existingMeals);
            
            // Check if this meal type already exists
            const mealIndex = existingMeals.findIndex(m => 
              typeof m === 'string' ? m === editingMealType : m.meal === editingMealType
            );
            
            console.log('Meal index for', editingMealType, ':', mealIndex);
            
            let updatedDayMeals;
            if (mealIndex >= 0) {
              // Update existing meal
              updatedDayMeals = [...existingMeals];
              updatedDayMeals[mealIndex] = {
                meal: editingMealType,
                recipeId: recipe ? recipe.id : null,
                phase: phase
              };
            } else {
              // Add new meal
              updatedDayMeals = [
                ...existingMeals,
                {
                  meal: editingMealType,
                  recipeId: recipe ? recipe.id : null,
                  phase: phase
                }
              ];
            }
            
            console.log('Updated day meals:', updatedDayMeals);
            
            return {
              ...block,
              meals: {
                ...block.meals,
                [dayOfWeek]: updatedDayMeals
              }
            };
          }
          return block;
        });
        
        if (onUpdateProfile) {
          console.log('Sending updated week blocks to API:', updatedWeekBlocks);
          await onUpdateProfile({ weekBlocks: updatedWeekBlocks });
          console.log('Profile updated successfully');
        }
      }
      
      // Don't close modal immediately - keep it open for adding more meals
      setEditingMealType(null);
      setRecipeOptions([]);
      
      console.log('Recipe saved successfully. RecipeId:', recipe?.id, 'Meal:', editingMealType);
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('Failed to update recipe. Please try again.');
    }
  };

  const handleRemoveMeal = async (mealType: string) => {
    if (!selectedEditDate) return;

    try {
      const dayOfWeek = selectedEditDate.getDay();
      const weekBlock = getWeekBlockForDate(selectedEditDate);
      
      if (!weekBlock) return;
      
      // Update week block by removing this meal
      const updatedWeekBlocks = (userProfile.weekBlocks || []).map(block => {
        if (block.id === weekBlock.id) {
          const existingMeals = block.meals[dayOfWeek] || [];
          const updatedDayMeals = existingMeals.filter(m => 
            typeof m === 'string' ? m !== mealType : m.meal !== mealType
          );
          
          return {
            ...block,
            meals: {
              ...block.meals,
              [dayOfWeek]: updatedDayMeals
            }
          };
        }
        return block;
      });
      
      if (onUpdateProfile) {
        await onUpdateProfile({ weekBlocks: updatedWeekBlocks });
      }
    } catch (error) {
      console.error('Error removing meal:', error);
      alert('Failed to remove meal. Please try again.');
    }
  };

  const handleCloseEditModal = () => {
    setShowEditDayModal(false);
    setEditingMealType(null);
    setRecipeOptions([]);
    setSelectedEditDate(null);
  };

  // ========== CALENDAR GENERATION ==========

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  
  // Debug: Log the current viewing year/month
  console.log(`📅 Calendar viewing: ${year}-${month + 1} (${currentDate.toDateString()})`);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getRecipesForDay = (day: number): { meal: string; recipe: Recipe | null }[] => {
    const checkDate = new Date(year, month, day);
    const dayOfWeek = checkDate.getDay();
    
    // Find the week block for this date
    const weekBlock = getWeekBlockForDate(checkDate);
    
    if (!weekBlock) {
      console.log(`📅 Day ${day}: No week block found for ${checkDate.toDateString()}`);
      return []; // No week block = no meals
    }
    
    const mealsForDay = weekBlock.meals[dayOfWeek] || [];
    
    console.log(`📅 Day ${day} (${checkDate.toDateString()}, dayOfWeek=${dayOfWeek}):`, {
      weekBlockId: weekBlock.id,
      mealsCount: mealsForDay.length,
      meals: mealsForDay
    });
    
    if (mealsForDay.length === 0) {
      return [];
    }

    // Map meal assignments to actual recipes
    const mappedMeals = mealsForDay.map(mealAssignment => {
      // Check if mealAssignment is the new format (object) or old format (string)
      if (typeof mealAssignment === 'string') {
        // Old format - just a meal string, no recipe
        return {
          meal: mealAssignment,
          recipe: null
        };
      }

      // New format - has recipeId
      if (!mealAssignment.recipeId) {
        // Meal slot exists but no recipe assigned
        return {
          meal: mealAssignment.meal,
          recipe: null
        };
      }

      // Find the recipe in the loaded recipes
      let recipe = recipes.find(r => r.id === mealAssignment.recipeId);
      
      // If not found in loaded recipes, check cache
      if (!recipe && cachedRecipes.has(mealAssignment.recipeId)) {
        recipe = cachedRecipes.get(mealAssignment.recipeId);
      }
      
      // Debug: log if recipe not found
      if (!recipe) {
        console.warn(`Recipe not found for ID ${mealAssignment.recipeId}. Will need to fetch from API.`);
      }
      
      return {
        meal: mealAssignment.meal,
        recipe: recipe || null
      };
    });

    // Sort meals in BLD order: breakfast -> lunch -> dinner
    const mealOrder = { breakfast: 1, lunch: 2, dinner: 3 };
    return mappedMeals.sort((a, b) => {
      return (mealOrder[a.meal as keyof typeof mealOrder] || 99) - 
             (mealOrder[b.meal as keyof typeof mealOrder] || 99);
    });
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const recipesForDay = getRecipesForDay(day);
    const checkDate = new Date(year, month, day);
    const phase = getPhaseForDate(checkDate);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    const isToday = checkDate.getTime() === today.getTime();

    const hasMeals = recipesForDay.length > 0;

    let bgColor = 'white';
    let textColor = '#64748b';
    let borderColor = '#e5e7eb';
    let borderWidth = '1px';
    let borderStyle = 'solid';

    if (hasMeals && phase === 'menstrual') {
      bgColor = COLORS.menstrual;
      textColor = COLORS.menstrualText;
    } else if (hasMeals && phase === 'follicular') {
      bgColor = COLORS.follicular;
      textColor = COLORS.follicularText;
    } else if (hasMeals && phase === 'ovulation') {
      bgColor = COLORS.ovulation;
      textColor = COLORS.ovulationText;
    } else if (hasMeals && phase === 'luteal') {
      bgColor = COLORS.luteal;
      textColor = COLORS.lutealText;
    } else if (hasMeals && phase === 'predicted') {
      bgColor = COLORS.predictedPeriod;
      textColor = COLORS.predictedText;
      borderStyle = 'dashed';
    }

    if (isToday) {
      borderColor = COLORS.sage;
      borderWidth = '2px';
      if (!hasMeals) {
        bgColor = COLORS.sageBg;
        textColor = COLORS.sageDark;
      }
    }

    days.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className="aspect-square rounded-lg transition-all flex flex-col overflow-hidden hover:shadow-md cursor-pointer"
        style={{
          borderColor: isToday ? COLORS.sage : borderColor,
          borderWidth: isToday ? '2px' : borderWidth,
          borderStyle: borderStyle
        }}
      >
        <div 
          className="text-xs text-center py-2" 
          style={{ 
            color: textColor, 
            fontWeight: isToday ? '600' : '400',
            backgroundColor: bgColor,
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {day}
        </div>
        
        {recipesForDay.length > 0 ? (
          <div className="flex-1 flex flex-col">
            {recipesForDay.map((mealRecipe, idx) => {
              const mealColors = {
                breakfast: '#fde68a',
                lunch: '#bfdbfe',
                dinner: '#ddd6fe'
              };
              const mealTextColors = {
                breakfast: '#78350f',
                lunch: '#1e3a8a',
                dinner: '#5b21b6'
              };
              const mealColor = mealColors[mealRecipe.meal as keyof typeof mealColors] || COLORS.sage;
              const mealTextColor = mealTextColors[mealRecipe.meal as keyof typeof mealTextColors] || '#fff';
              
              // If no recipe assigned, show just the meal initial (non-clickable)
              if (!mealRecipe.recipe) {
                return (
                  <div
                    key={idx}
                    className="flex-1 text-[10px] flex items-center justify-center font-medium opacity-50"
                    style={{ backgroundColor: mealColor, color: mealTextColor }}
                    title={`${mealRecipe.meal.charAt(0).toUpperCase() + mealRecipe.meal.slice(1)}: No recipe assigned`}
                  >
                    {mealRecipe.meal.charAt(0).toUpperCase()}
                  </div>
                );
              }

              return (
                <button
                  key={idx}
                  onClick={() => onRecipeClick(mealRecipe.recipe!)}
                  className="flex-1 text-[10px] transition-all hover:opacity-80 flex items-center justify-center font-medium"
                  style={{ backgroundColor: mealColor, color: mealTextColor }}
                  title={`${mealRecipe.meal.charAt(0).toUpperCase() + mealRecipe.meal.slice(1)}: ${mealRecipe.recipe.name}`}
                >
                  {mealRecipe.meal.charAt(0).toUpperCase()}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex-1" style={{ backgroundColor: bgColor }} />
        )}
      </button>
    );
  }

  const availableWeeks = getAvailableWeeks();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #e1e5de 0%, #f0f2ef 50%, #ffffff 100%)' }}>
      <div className="flex-1 p-4 pb-20 overflow-y-auto">
        
        <div className="mb-6 pt-2">
          <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl mb-1" style={{ color: COLORS.sageDark }}>Pantry Cycle</h1>
              <p className="text-sm text-slate-500">Click any day to plan your meals</p>
          </div>
          </div>
          
          {/* Help tip for new users */}
          {(!userProfile.weekBlocks || userProfile.weekBlocks.length === 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
              <div className="text-blue-600 text-xl">💡</div>
              <div className="flex-1">
                <p className="text-sm text-blue-900 mb-1 font-medium">
                  Start Planning Your Meals
                </p>
                <p className="text-xs text-blue-700">
                  Click <span className="font-semibold">"Add Week"</span> above to plan your meals for the week. 
                  We'll recommend recipes based on your cycle phase and preferences!
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={previousMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h2 className="text-lg" style={{ color: COLORS.sageDark }}>
              {monthNames[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[10px] text-slate-500 font-medium uppercase">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h3 className="text-sm mb-3" style={{ color: COLORS.sageDark }}>Meal Types</h3>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#fde68a' }} />
              <span className="text-slate-600">Breakfast</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#bfdbfe' }} />
              <span className="text-slate-600">Lunch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: '#ddd6fe' }} />
              <span className="text-slate-600">Dinner</span>
            </div>
          </div>
        </div>
      </div>

      {showAddWeekModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl" style={{ color: COLORS.sageDark }}>Plan a Week</h2>
                <button
                  onClick={handleCancelAddWeek}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={isSavingWeek}
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              {!selectedWeekStart && (
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    Select which week you'd like to plan meals for:
                  </p>
                  <div className="space-y-2">
                    {availableWeeks.length > 0 ? (
                      availableWeeks.map((weekStart) => {
                        const weekEnd = getSaturdayOfWeek(weekStart);
                        return (
                          <button
                            key={weekStart.getTime()}
                            onClick={() => handleSelectWeek(weekStart)}
                            className="w-full p-4 rounded-xl border-2 transition-all hover:shadow-sm text-left"
                            style={{
                              borderColor: COLORS.sageBgLight,
                              backgroundColor: 'white'
                            }}
                          >
                            <p className="text-sm" style={{ color: COLORS.sageDark }}>
                              {formatDateShort(weekStart)} - {formatDateShort(weekEnd)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {weekStart.toLocaleDateString('en-US', { year: 'numeric' })}
                            </p>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-slate-500">
                          You've planned all available weeks!
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Manage existing weeks in your Profile
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedWeekStart && modalStep === 'selectMeals' && (
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    Step 1: Select meals for the week
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Week of {formatDateShort(selectedWeekStart)} - {formatDateShort(getSaturdayOfWeek(selectedWeekStart))}
                  </p>

                  <div className="mb-6">
                    <div className="grid grid-cols-4 gap-2 mb-3 pb-2 border-b-2" style={{ borderColor: COLORS.sageBgLight }}>
                      <div></div>
                      <div className="text-center text-xs" style={{ color: COLORS.sageDark }}>B</div>
                      <div className="text-center text-xs" style={{ color: COLORS.sageDark }}>L</div>
                      <div className="text-center text-xs" style={{ color: COLORS.sageDark }}>D</div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { label: 'Sun', value: 0 },
                        { label: 'Mon', value: 1 },
                        { label: 'Tue', value: 2 },
                        { label: 'Wed', value: 3 },
                        { label: 'Thu', value: 4 },
                        { label: 'Fri', value: 5 },
                        { label: 'Sat', value: 6 },
                      ].map((day) => (
                        <div key={day.value} className="grid grid-cols-4 gap-2 items-center">
                          <div className="text-sm" style={{ color: COLORS.sageDark }}>{day.label}</div>
                          {['breakfast', 'lunch', 'dinner'].map((meal) => (
                            <button
                              key={meal}
                              onClick={() => toggleMealForDay(day.value, meal)}
                              disabled={isSavingWeek}
                              className="h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center"
                              style={{
                                borderColor: newWeekMeals[day.value]?.includes(meal) ? COLORS.sage : '#e2e8f0',
                                backgroundColor: newWeekMeals[day.value]?.includes(meal) ? COLORS.sageBgLight : 'white',
                                opacity: isSavingWeek ? 0.5 : 1
                              }}
                            >
                              {newWeekMeals[day.value]?.includes(meal) && (
                                <Check className="h-4 w-4" style={{ color: COLORS.sage }} />
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: COLORS.sageBg }}>
                    <p className="text-sm text-center" style={{ color: COLORS.sageDark }}>
                      {isSavingWeek ? 'Assigning recipes...' : `${getTotalMealsSelected()} total meals selected`}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={modalStep === 'selectMeals' ? () => setSelectedWeekStart(null) : handleBackToMealSelection}
                      variant="outline"
                      disabled={isSavingWeek}
                      className="flex-1 h-11"
                      style={{ borderColor: COLORS.sage, color: COLORS.sageDark }}
                    >
                      Back
                    </Button>
                    {modalStep === 'selectMeals' ? (
                    <Button
                        onClick={handleProceedToRecipeSelection}
                      disabled={getTotalMealsSelected() === 0 || isSavingWeek}
                      className="flex-1 h-11 text-white"
                      style={{ 
                        background: (getTotalMealsSelected() > 0 && !isSavingWeek)
                          ? `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)`
                          : '#d1d5db'
                      }}
                    >
                        {isSavingWeek ? 'Loading...' : 'Next: Choose Recipes'}
                    </Button>
                    ) : (
                      <Button
                        onClick={handleSaveWeek}
                        disabled={isSavingWeek}
                        className="flex-1 h-11 text-white"
                        style={{ 
                          background: !isSavingWeek
                            ? `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)`
                            : '#d1d5db'
                        }}
                      >
                        {isSavingWeek ? 'Saving...' : 'Confirm & Save Week'}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Select Recipes */}
              {selectedWeekStart && modalStep === 'selectRecipes' && (
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    Step 2: Choose recipes for each meal
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Week of {formatDateShort(selectedWeekStart)} - {formatDateShort(getSaturdayOfWeek(selectedWeekStart))}
                  </p>

                  <div className="space-y-6 mb-6 max-h-[60vh] overflow-y-auto">
                    {Object.entries(newWeekMeals).map(([dayStr, meals]) => {
                      const day = parseInt(dayStr);
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      
                      return (
                        <div key={day}>
                          <h4 className="font-medium mb-3" style={{ color: COLORS.sageDark }}>
                            {dayNames[day]}
                          </h4>
                          {meals.map((mealType) => {
                            const key = `${day}-${mealType}`;
                            const recipeOptions = recommendedRecipesForWeek[key] || [];
                            const selectedRecipeId = selectedRecipesForMeals[key];
                            
                            return (
                              <div key={key} className="mb-4">
                                <p className="text-xs text-slate-600 mb-2 capitalize">
                                  {mealType} {recipeOptions.length > 0 ? `(${recipeOptions.length} options)` : '(No recipes found)'}
                                </p>
                                <div className="space-y-2">
                                  {recipeOptions.map((recipe) => (
                                    <button
                                      key={recipe.id}
                                      onClick={() => handleSelectRecipeForMeal(key, recipe.id)}
                                      className="w-full text-left p-3 rounded-lg border-2 transition-all"
                                      style={{
                                        borderColor: selectedRecipeId === recipe.id ? COLORS.sage : '#e5e7eb',
                                        backgroundColor: selectedRecipeId === recipe.id ? COLORS.sageBgLight : 'white'
                                      }}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium" style={{ color: COLORS.sageDark }}>
                                            {recipe.name}
                                          </p>
                                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span>🔥 {formatCalories(recipe.calories)} cal</span>
                                            {recipe.phase && (
                                              <span className="px-2 py-0.5 rounded text-xs" style={{
                                                backgroundColor: recipe.phase === 'Menstrual' ? COLORS.menstrual :
                                                                recipe.phase === 'Follicular' ? COLORS.follicular :
                                                                recipe.phase === 'Ovulation' ? COLORS.ovulation :
                                                                COLORS.luteal,
                                                color: recipe.phase === 'Menstrual' ? COLORS.menstrualText :
                                                      recipe.phase === 'Follicular' ? COLORS.follicularText :
                                                      recipe.phase === 'Ovulation' ? COLORS.ovulationText :
                                                      COLORS.lutealText
                                              }}>
                                                {recipe.phase}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {selectedRecipeId === recipe.id && (
                                          <Check className="h-5 w-5 flex-shrink-0" style={{ color: COLORS.sage }} />
                                        )}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: COLORS.sageBg }}>
                    <p className="text-sm text-center" style={{ color: COLORS.sageDark }}>
                      {Object.keys(selectedRecipesForMeals).length} of {getTotalMealsSelected()} meals selected
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleBackToMealSelection}
                      variant="outline"
                      disabled={isSavingWeek}
                      className="flex-1 h-11"
                      style={{ borderColor: COLORS.sage, color: COLORS.sageDark }}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSaveWeek}
                      disabled={isSavingWeek}
                      className="flex-1 h-11 text-white"
                      style={{ 
                        background: !isSavingWeek
                          ? `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)`
                          : '#d1d5db'
                      }}
                    >
                      {isSavingWeek ? 'Saving...' : 'Confirm & Save Week'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Day Modal */}
      {showEditDayModal && selectedEditDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ zIndex: 10000 }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl" style={{ color: COLORS.sageDark }}>
                  {selectedEditDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h2>
                <button
                  onClick={handleCloseEditModal}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              {!editingMealType ? (
                // Step 1: Show meals for this day
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    Select a meal to add or edit:
                  </p>
                  
                  <div className="space-y-3">
                    {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                      const recipesForDay = getRecipesForDay(selectedEditDate.getDate());
                      const mealRecipe = recipesForDay.find(m => m.meal === mealType);
                      
                      const mealColors = {
                        breakfast: { bg: '#fde68a', text: '#78350f', label: 'Breakfast' },
                        lunch: { bg: '#bfdbfe', text: '#1e3a8a', label: 'Lunch' },
                        dinner: { bg: '#ddd6fe', text: '#5b21b6', label: 'Dinner' }
                      };
                      
                      const colors = mealColors[mealType as keyof typeof mealColors];
                      
                      return (
                        <div
                          key={mealType}
                          className="border-2 rounded-xl p-4 transition-all"
                          style={{ borderColor: COLORS.sageBgLight }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: colors.bg, color: colors.text }}
                              >
                                {colors.label.charAt(0)}
                              </div>
                              <h3 className="text-sm font-medium" style={{ color: COLORS.sageDark }}>
                                {colors.label}
                              </h3>
                            </div>
                            {mealRecipe && (
                              <button
                                onClick={() => handleRemoveMeal(mealType)}
                                className="p-1 hover:bg-red-50 rounded transition-colors"
                                title="Remove meal"
                              >
                                <X className="h-4 w-4 text-red-400" />
                              </button>
                            )}
                          </div>
                          
                          {mealRecipe && mealRecipe.recipe ? (
                            <div>
                              <p className="text-xs text-slate-600 mb-2">
                                {mealRecipe.recipe.name}
                              </p>
                              <Button
                                onClick={() => handleSelectMealToEdit(mealType)}
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                style={{ borderColor: COLORS.sage, color: COLORS.sageDark }}
                              >
                                Change Recipe
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleSelectMealToEdit(mealType)}
                              size="sm"
                              className="w-full text-xs text-white"
                              style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Recipe
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Step 2: Show recipe options
                <div>
                  <button
                    onClick={() => {
                      setEditingMealType(null);
                      setRecipeOptions([]);
                    }}
                    className="flex items-center gap-1 text-sm mb-4 text-slate-600 hover:text-slate-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to meals
                  </button>
                  
                  <p className="text-sm text-slate-600 mb-4">
                    Choose a recipe for {editingMealType}:
                  </p>
                  
                  {isLoadingRecipes ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-500">Loading recipes...</p>
                    </div>
                  ) : recipeOptions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-500 mb-4">
                        No recipes found matching your preferences.
                      </p>
                      <Button
                        onClick={() => handleSelectRecipe(null)}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {recipeOptions.map((recipe) => {
                        const isSelected = selectedRecipeId === recipe.id;
                        return (
                        <button
                          key={recipe.id}
                          onClick={() => handleSelectRecipe(recipe)}
                          className="w-full p-3 rounded-xl border-2 transition-all hover:shadow-lg text-left relative overflow-hidden"
                          style={{
                            borderColor: isSelected ? COLORS.sage : COLORS.sageBgLight,
                            backgroundColor: isSelected ? COLORS.sageBg : 'white',
                            transform: isSelected ? 'scale(0.98)' : 'scale(1)'
                          }}
                        >
                          <div>
                            <h4 className="text-sm font-medium" style={{ color: COLORS.sageDark }}>
                              {recipe.name}
                            </h4>
                            {recipe.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {recipe.description}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2 text-xs text-slate-400">
                              {recipe.prepTime && <span>⏱️ {recipe.prepTime}min</span>}
                              {recipe.calories && <span>🔥 {formatCalories(recipe.calories)}cal</span>}
                            </div>
                          </div>
                        </button>
                      );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex justify-around max-w-md mx-auto">
          <button
            onClick={() => onNavigate('calendar')}
            className="flex flex-col items-center gap-1"
            style={{ color: COLORS.sage }}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => onNavigate('recipes')}
            className="flex flex-col items-center gap-1 text-slate-400"
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

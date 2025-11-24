import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Home, User, BookOpen, Droplet, Calendar as CalendarIcon } from 'lucide-react';
import { Recipe, UserProfile, PeriodRecord } from '../types';

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
  
  // Soft, harmonious colors that complement sage green
  menstrual: '#f4c2c2',        // Soft coral pink
  menstrualText: '#9b6b6b',
  
  follicular: '#c8d5c0',       // Light sage/mint
  follicularText: '#5a6b54',
  
  ovulation: '#b8d4d1',        // Soft teal
  ovulationText: '#4a7370',
  
  luteal: '#d4c5d8',           // Soft lavender
  lutealText: '#7a6b7e',
  
  predictedPeriod: '#f8d4d4',  // Very light coral
  predictedText: '#b89090',
};

// Phase-specific nutritional guidance
const PHASE_NUTRITION: Record<string, { foods: string[]; why: string; icon: string }> = {
  menstrual: {
    foods: ['Iron-rich foods', 'Leafy greens', 'Red meat', 'Lentils'],
    why: 'Replenish iron lost during menstruation and reduce cramping',
    icon: '🩸'
  },
  follicular: {
    foods: ['Fresh vegetables', 'Lean proteins', 'Whole grains', 'Fermented foods'],
    why: 'Support rising energy and metabolism as estrogen increases',
    icon: '🌱'
  },
  ovulation: {
    foods: ['Colorful vegetables', 'Fruits', 'Light proteins', 'Omega-3s'],
    why: 'Support peak energy and manage inflammation',
    icon: '✨'
  },
  luteal: {
    foods: ['Complex carbs', 'Magnesium-rich foods', 'Dark chocolate', 'Root vegetables'],
    why: 'Stabilize mood and energy as progesterone rises',
    icon: '🌙'
  }
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
  const [isEditingPeriod, setIsEditingPeriod] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [showQuickLog, setShowQuickLog] = useState(false);

  // Initialize past periods from user data
  useEffect(() => {
    if (userProfile.periodHistory && userProfile.periodHistory.length > 0) {
      setPastPeriods(userProfile.periodHistory);
      console.log('📅 Calendar: Period History Loaded:', userProfile.periodHistory.length, 'periods');
      console.log('📅 Most recent period:', {
        start: userProfile.periodHistory[0].startDate,
        end: userProfile.periodHistory[0].endDate,
        duration: userProfile.periodHistory[0].duration
      });
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

  const getCurrentCyclePhase = (): { phase: string; description: string; dayInCycle: number } => {
    if (pastPeriods.length === 0) {
      return { 
        phase: 'No Data', 
        description: 'Track your period in the Profile tab to get personalized meal recommendations', 
        dayInCycle: 0 
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastPeriod = pastPeriods[0];
    const daysSinceLastPeriod = Math.ceil(
      (today.getTime() - lastPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const avgCycleLength = calculateAverageCycleLength();

    if (daysSinceLastPeriod >= 0 && daysSinceLastPeriod <= lastPeriod.duration) {
      return {
        phase: 'Menstrual',
        description: 'Focus on iron-rich foods and stay hydrated.',
        dayInCycle: daysSinceLastPeriod,
      };
    } else if (daysSinceLastPeriod > lastPeriod.duration && daysSinceLastPeriod <= 13) {
      return {
        phase: 'Follicular',
        description: 'Great time for high-energy activities and trying new foods.',
        dayInCycle: daysSinceLastPeriod,
      };
    } else if (daysSinceLastPeriod > 13 && daysSinceLastPeriod <= 16) {
      return {
        phase: 'Ovulation',
        description: 'Enjoy complex carbs and protein-rich meals.',
        dayInCycle: daysSinceLastPeriod,
      };
    } else if (daysSinceLastPeriod > 16 && daysSinceLastPeriod < avgCycleLength) {
      return {
        phase: 'Luteal',
        description: 'Focus on magnesium and B-vitamin rich foods.',
        dayInCycle: daysSinceLastPeriod,
      };
    } else {
      return {
        phase: 'Pre-Menstrual',
        description: 'Your next period is approaching soon.',
        dayInCycle: daysSinceLastPeriod,
      };
    }
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

  const predictOvulation = (): Date | null => {
    if (pastPeriods.length === 0) return null;
    
    const lastPeriod = pastPeriods[0];
    const ovulationDay = new Date(lastPeriod.startDate);
    ovulationDay.setDate(ovulationDay.getDate() + 14);

    return ovulationDay;
  };

  const getPhaseForDate = (date: Date): 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'predicted' | null => {
    if (pastPeriods.length === 0) return null;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Check if this date falls within any recorded period
    for (const period of pastPeriods) {
      const start = new Date(period.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(period.endDate);
      end.setHours(0, 0, 0, 0);
      
      if (checkDate >= start && checkDate <= end) {
        return 'menstrual';
      }
    }

    // Check if date is in predicted period
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

    // Calculate which cycle day this is based on most recent period
    const lastPeriod = pastPeriods[0];
    const lastPeriodStart = new Date(lastPeriod.startDate);
    lastPeriodStart.setHours(0, 0, 0, 0);
    
    const daysSinceLastPeriodStart = Math.round(
      (checkDate.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Only show phases for dates after the last period started and before predicted next period
    if (daysSinceLastPeriodStart < 0) {
      return null; // Before last period
    }
    
    const avgCycleLength = calculateAverageCycleLength();
    if (daysSinceLastPeriodStart >= avgCycleLength) {
      return null; // After predicted next period should start
    }
    
    const cycleDay = daysSinceLastPeriodStart + 1; // Day 1, Day 2, etc.
    
    // Phase determination based on cycle day
    // Days 1-5: Menstrual (already handled above in pastPeriods check)
    // Days 6-13: Follicular
    // Days 14-16: Ovulation
    // Days 17-28: Luteal
    
    if (cycleDay >= 6 && cycleDay <= 13) {
      return 'follicular';
    } else if (cycleDay >= 14 && cycleDay <= 16) {
      return 'ovulation';
    } else if (cycleDay >= 17) {
      return 'luteal';
    }

    return null;
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

  // Assign recipes to days based on user's selected days
  const getRecipesForDay = (day: number): { meal: string; recipe: Recipe }[] => {
    const dayOfWeek = (startingDayOfWeek + day - 1) % 7;
    
    // Check if this day has any meals selected
    const mealsForDay = userProfile.selectedMeals[dayOfWeek];
    if (!mealsForDay || mealsForDay.length === 0) {
      return [];
    }
    
    if (recipes.length === 0) {
      return [];
    }

    // Create a flattened list of all meals in the week (for recipe distribution)
    const allMealsInWeek: { day: number; meal: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const meals = userProfile.selectedMeals[d] || [];
      meals.forEach(meal => {
        allMealsInWeek.push({ day: d, meal });
      });
    }
    
    // Sort by day to maintain consistent ordering
    allMealsInWeek.sort((a, b) => a.day - b.day);
    
    // Find which week of the month we're in
    const weekNumber = Math.floor((day - 1) / 7);
    
    // Assign recipes to this day's meals
    const result: { meal: string; recipe: Recipe }[] = [];
    mealsForDay.forEach(meal => {
      // Find the index of this specific meal in the week pattern
      const mealIndexInWeek = allMealsInWeek.findIndex(m => m.day === dayOfWeek && m.meal === meal);
      if (mealIndexInWeek !== -1) {
        // Calculate the recipe index based on week number and position in week
        const recipeIndex = (weekNumber * allMealsInWeek.length + mealIndexInWeek) % recipes.length;
        result.push({ meal, recipe: recipes[recipeIndex] });
      }
    });
    
    return result;
  };

  // Get period status for a day
  const getDayStatus = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    checkDate.setHours(0, 0, 0, 0);

    let isPastPeriod = false;
    let isPredictedPeriod = false;
    let isOvulation = false;

    // Check past periods
    pastPeriods.forEach(period => {
      const start = new Date(period.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(period.endDate);
      end.setHours(0, 0, 0, 0);
      
      if (checkDate >= start && checkDate <= end) {
        isPastPeriod = true;
      }
    });

    // Check predicted period
    const predicted = predictNextPeriod();
    if (predicted) {
      const predStart = new Date(predicted.startDate);
      predStart.setHours(0, 0, 0, 0);
      const predEnd = new Date(predicted.endDate);
      predEnd.setHours(0, 0, 0, 0);
      
      if (checkDate >= predStart && checkDate <= predEnd) {
        isPredictedPeriod = true;
      }
    }

    // Check ovulation
    const ovulationDate = predictOvulation();
    if (ovulationDate) {
      const ovDate = new Date(ovulationDate);
      ovDate.setHours(0, 0, 0, 0);
      
      if (checkDate.getTime() === ovDate.getTime()) {
        isOvulation = true;
      }
    }

    return {
      isToday: checkDate.getTime() === today.getTime(),
      isPastPeriod,
      isPredictedPeriod,
      isOvulation,
    };
  };

  const days = [];
  // Empty cells before first day
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const recipesForDay = getRecipesForDay(day);
    const checkDate = new Date(year, month, day);
    const phase = getPhaseForDate(checkDate);
    
    // Debug logging for first 5 days
    if (day <= 5) {
      console.log(`📆 Day ${day} (${monthNames[month]} ${day}):`, {
        date: checkDate.toDateString(),
        phase: phase,
        pastPeriodsCount: pastPeriods.length
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    const isToday = checkDate.getTime() === today.getTime();

    let bgColor = 'white';
    let textColor = '#64748b';
    let borderColor = '#e5e7eb';
    let borderWidth = '1px';
    let borderStyle = 'solid';

    // Apply phase colors
    if (phase === 'menstrual') {
      bgColor = COLORS.menstrual;
      textColor = COLORS.menstrualText;
    } else if (phase === 'follicular') {
      bgColor = COLORS.follicular;
      textColor = COLORS.follicularText;
    } else if (phase === 'ovulation') {
      bgColor = COLORS.ovulation;
      textColor = COLORS.ovulationText;
    } else if (phase === 'luteal') {
      bgColor = COLORS.luteal;
      textColor = COLORS.lutealText;
    } else if (phase === 'predicted') {
      bgColor = COLORS.predictedPeriod;
      textColor = COLORS.predictedText;
      borderStyle = 'dashed';
    }

    // Today styling
    if (isToday) {
      borderColor = COLORS.sage;
      borderWidth = '2px';
      if (!phase) {
        bgColor = COLORS.sageBg;
        textColor = COLORS.sageDark;
      }
    }

    days.push(
      <div
        key={day}
        className="aspect-square rounded-lg transition-all flex flex-col overflow-hidden"
        style={{
          borderColor: isToday ? COLORS.sage : borderColor,
          borderWidth: isToday ? '2px' : borderWidth,
          borderStyle: borderStyle
        }}
      >
        {/* Day number */}
        <div 
          className="text-[10px] text-center py-0.5" 
          style={{ 
            color: textColor, 
            fontWeight: isToday ? '600' : '400',
            backgroundColor: bgColor 
          }}
        >
          {day}
        </div>
        
        {/* Meals section */}
        {recipesForDay.length > 0 ? (
          <div className="flex-1 flex flex-col">
            {recipesForDay.map((mealRecipe, idx) => {
              const mealColors = {
                breakfast: '#fde68a',  // soft amber
                lunch: '#bfdbfe',      // soft light blue
                dinner: '#ddd6fe'      // soft lavender
              };
              const mealTextColors = {
                breakfast: '#78350f',  // amber text
                lunch: '#1e3a8a',      // blue text
                dinner: '#5b21b6'      // violet text
              };
              const mealColor = mealColors[mealRecipe.meal as keyof typeof mealColors] || COLORS.sage;
              const textColor = mealTextColors[mealRecipe.meal as keyof typeof mealTextColors] || '#fff';
              
              return (
                <button
                  key={idx}
                  onClick={() => onRecipeClick(mealRecipe.recipe)}
                  className="flex-1 text-[10px] transition-all hover:opacity-80 flex items-center justify-center font-medium"
                  style={{ backgroundColor: mealColor, color: textColor }}
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
      </div>
    );
  }

  const currentPhase = getCurrentCyclePhase();
  const nextPeriod = predictNextPeriod();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleEditPeriod = () => {
    if (pastPeriods.length > 0) {
      setEditStartDate(formatDateInput(pastPeriods[0].startDate));
      setEditEndDate(formatDateInput(pastPeriods[0].endDate));
    }
    setIsEditingPeriod(true);
  };

  const handleSavePeriod = () => {
    if (editStartDate && editEndDate && onUpdateProfile) {
      const start = new Date(editStartDate);
      const end = new Date(editEndDate);
      
      // Update the profile with new dates
      onUpdateProfile({
        lastPeriodStart: start,
        lastPeriodEnd: end,
      });
      
      setIsEditingPeriod(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPeriod(false);
    setEditStartDate('');
    setEditEndDate('');
  };

  return (
    <div className="min-h-screen flex flex-col hide-scrollbar" style={{ background: 'linear-gradient(to bottom, #e1e5de 0%, #f0f2ef 50%, #ffffff 100%)' }}>
      <div className="flex-1 p-4 pb-20 overflow-y-auto hide-scrollbar">
        
        {/* Clean Header */}
        <div className="mb-6 pt-2">
          <h1 className="text-2xl mb-1" style={{ color: COLORS.sageDark }}>Pantry Cycle</h1>
          <p className="text-sm text-slate-500">Your weekly meal plan</p>
        </div>

        {/* Calendar */}
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

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[10px] text-slate-500 font-medium uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {days}
          </div>
        </div>

        {/* Legend - only meal types */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 safe-area-inset-bottom">
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
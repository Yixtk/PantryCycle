import { useState } from 'react';
import { Home, BookOpen, User, Edit2, Save, Droplet, LogOut, X, UtensilsCrossed, Check, Plus, Calendar, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User as UserType, UserProfile, Recipe, WeekBlock } from '../types';
import { PeriodTrackerTab } from './PeriodTrackerTab';

interface ProfilePageProps {
  user: UserType;
  userProfile: UserProfile;
  onNavigate: (page: string) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
  onSignOut?: () => void;
  plannedRecipes?: Recipe[];
  onRemoveRecipe?: (recipeId: string) => void;
}

const COLORS = {
  sage: '#8a9a84',
  sageDark: '#5a6b54',
  sageLight: '#a8b5a0',
  sageBg: '#f0f2ef',
  sageBgLight: '#e1e5de',
};

export function ProfilePage({ user, userProfile, onNavigate, onUpdateProfile, onSignOut, plannedRecipes = [], onRemoveRecipe }: ProfilePageProps) {
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [isEditingRecipes, setIsEditingRecipes] = useState(false);
  
  // Basic info
  const [editedFirstName, setEditedFirstName] = useState(user.firstName);
  const [editedLastName, setEditedLastName] = useState(user.lastName);
  const [editedEmail, setEditedEmail] = useState(user.email || '');
  const [editedPhone, setEditedPhone] = useState(user.phone || '');

  // Health info
  const [editedPreferences, setEditedPreferences] = useState<string[]>(userProfile.dietaryPreferences || []);
  const [editedAllergies, setEditedAllergies] = useState<string[]>(
    userProfile.allergies?.map(a => a.type) || []
  );

  // Recipe preferences - Week blocks
  const [weekBlocks, setWeekBlocks] = useState<WeekBlock[]>(
    (userProfile.weekBlocks || []).map(block => ({
      ...block,
      startDate: new Date(block.startDate),
      endDate: new Date(block.endDate),
    }))
  );
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  // Helper function to get the Sunday of a given week
  const getSundayOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Helper function to get the Saturday of a given week
  const getSaturdayOfWeek = (sunday: Date) => {
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    return saturday;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSaveBasic = () => {
    // Note: User updates would need a separate API call
    // For now just update what we can in the profile
    setIsEditingBasic(false);
  };

  const handleSaveHealth = () => {
    onUpdateProfile({
      dietaryPreferences: editedPreferences,
      allergies: editedAllergies.map(a => ({ type: a })),
    });
    setIsEditingHealth(false);
  };

  const handleSaveRecipes = () => {
    // Make sure to preserve selectedMeals when saving weekBlocks
    onUpdateProfile({
      weekBlocks: weekBlocks,
      selectedMeals: userProfile.selectedMeals, // Keep the default meal plan
    });
    setIsEditingRecipes(false);
    setEditingBlockId(null);
  };

  const addWeekBlock = () => {
    // Find the next available week start date
    let nextStartDate: Date;
    
    if (weekBlocks.length === 0) {
      // First week block starts from NEXT week's Sunday (not current week)
      const currentSunday = getSundayOfWeek(new Date());
      nextStartDate = new Date(currentSunday);
      nextStartDate.setDate(nextStartDate.getDate() + 7); // Next Sunday
    } else {
      // Next week starts after the last week's end date
      const lastBlock = weekBlocks.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
      nextStartDate = new Date(lastBlock.endDate);
      nextStartDate.setDate(nextStartDate.getDate() + 1); // Day after last Saturday
    }
    
    const newBlock: WeekBlock = {
      id: `week-${Date.now()}`,
      startDate: nextStartDate,
      endDate: getSaturdayOfWeek(nextStartDate),
      meals: {},
    };
    
    setWeekBlocks([...weekBlocks, newBlock]);
    setEditingBlockId(newBlock.id);
  };

  const deleteWeekBlock = (blockId: string) => {
    setWeekBlocks(weekBlocks.filter(b => b.id !== blockId));
    if (editingBlockId === blockId) {
      setEditingBlockId(null);
    }
  };

  const toggleMealForDay = (blockId: string, day: number, meal: string) => {
    setWeekBlocks(weekBlocks.map(block => {
      if (block.id !== blockId) return block;
      
      const dayMeals = block.meals[day] || [];
      const newDayMeals = dayMeals.includes(meal)
        ? dayMeals.filter((m) => m !== meal)
        : [...dayMeals, meal];
      
      const newMeals = { ...block.meals };
      if (newDayMeals.length === 0) {
        delete newMeals[day];
      } else {
        newMeals[day] = newDayMeals;
      }
      
      return { ...block, meals: newMeals };
    }));
  };

  const getTotalMealsForBlock = (block: WeekBlock) => {
    return Object.values(block.meals).reduce((total, meals) => total + meals.length, 0);
  };

  const togglePreference = (pref: string) => {
    setEditedPreferences(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setEditedAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
    'Low-Carb', 'High-Protein', 'Pescatarian', 'Keto'
  ];

  const allergyOptions = [
    'Dairy', 'Eggs', 'Peanuts', 'Tree Nuts',
    'Wheat', 'Soy', 'Shellfish', 'Fish'
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #e1e5de 0%, #f0f2ef 50%, #ffffff 100%)' }}>
      <div className="flex-1 p-4 pb-20 overflow-y-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white"
              style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
            >
              {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''} 
            </div>
            <div>
              <h1 style={{ color: COLORS.sageDark }}>{user.firstName} {user.lastName}</h1>
              <p className="text-sm text-slate-600">@{user.username}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="health">Health Info</TabsTrigger>
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ color: COLORS.sageDark }}>Basic Information</h2>
                {!isEditingBasic ? (
                  <button
                    onClick={() => setIsEditingBasic(true)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" style={{ color: COLORS.sage }} />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveBasic}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" style={{ color: COLORS.sage }} />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-600 mb-1 block">First Name</Label>
                  {isEditingBasic ? (
                    <Input
                      value={editedFirstName}
                      onChange={(e) => setEditedFirstName(e.target.value)}
                    />
                  ) : (
                    <p style={{ color: COLORS.sageDark }}>{user.firstName}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-slate-600 mb-1 block">Last Name</Label>
                  {isEditingBasic ? (
                    <Input
                      value={editedLastName}
                      onChange={(e) => setEditedLastName(e.target.value)}
                    />
                  ) : (
                    <p style={{ color: COLORS.sageDark }}>{user.lastName}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-slate-600 mb-1 block">Email</Label>
                  {isEditingBasic ? (
                    <Input
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                    />
                  ) : (
                    <p style={{ color: COLORS.sageDark }}>{user.email || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-slate-600 mb-1 block">Phone</Label>
                  {isEditingBasic ? (
                    <Input
                      type="tel"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                    />
                  ) : (
                    <p style={{ color: COLORS.sageDark }}>{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Health Info Tab */}
          <TabsContent value="health">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ color: COLORS.sageDark }}>Health Information</h2>
                {!isEditingHealth ? (
                  <button
                    onClick={() => setIsEditingHealth(true)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" style={{ color: COLORS.sage }} />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveHealth}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" style={{ color: COLORS.sage }} />
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Dietary Preferences */}
                <div>
                  <Label className="mb-3 block">Dietary Preferences</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {dietaryOptions.map((pref) => (
                      <button
                        key={pref}
                        onClick={() => isEditingHealth && togglePreference(pref)}
                        disabled={!isEditingHealth}
                        className="p-3 rounded-xl border-2 transition-all text-sm"
                        style={{
                          borderColor: editedPreferences.includes(pref) ? COLORS.sageLight : '#e2e8f0',
                          backgroundColor: editedPreferences.includes(pref) ? COLORS.sageBgLight : 'white',
                          color: editedPreferences.includes(pref) ? COLORS.sageDark : '#64748b',
                          cursor: isEditingHealth ? 'pointer' : 'default',
                          opacity: isEditingHealth ? 1 : 0.7,
                        }}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <Label className="mb-3 block">Allergies</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {allergyOptions.map((allergy) => (
                      <button
                        key={allergy}
                        onClick={() => isEditingHealth && toggleAllergy(allergy)}
                        disabled={!isEditingHealth}
                        className="p-3 rounded-xl border-2 transition-all text-sm"
                        style={{
                          borderColor: editedAllergies.includes(allergy) ? COLORS.sageLight : '#e2e8f0',
                          backgroundColor: editedAllergies.includes(allergy) ? COLORS.sageBgLight : 'white',
                          color: editedAllergies.includes(allergy) ? COLORS.sageDark : '#64748b',
                          cursor: isEditingHealth ? 'pointer' : 'default',
                          opacity: isEditingHealth ? 1 : 0.7,
                        }}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Recipe Preferences Tab */}
          <TabsContent value="recipes">
            <div className="space-y-4">
              {/* Week Block Management */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 style={{ color: COLORS.sageDark }}>Weekly Meal Plans</h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Set up your meal schedule for specific weeks
                    </p>
                  </div>
                </div>

                {/* Add New Week Block */}
                {isEditingRecipes && (
                  <div className="mb-6">
                    <Button
                      onClick={addWeekBlock}
                      className="w-full h-12 text-white"
                      style={{ 
                        background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)`
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Week
                    </Button>
                  </div>
                )}

                {/* List of Week Blocks */}
                {weekBlocks.length === 0 ? (
                  <div className="text-center py-8" style={{ color: COLORS.sageDark }}>
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No weekly meal plans yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isEditingRecipes ? 'Add your first week above' : 'Click Edit to get started'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {weekBlocks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((block) => (
                      <div 
                        key={block.id} 
                        className="border-2 rounded-xl overflow-hidden transition-all"
                        style={{ 
                          borderColor: editingBlockId === block.id ? COLORS.sage : COLORS.sageBgLight 
                        }}
                      >
                        {/* Week Block Header */}
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer"
                          style={{ backgroundColor: editingBlockId === block.id ? COLORS.sageBgLight : COLORS.sageBg }}
                          onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5" style={{ color: COLORS.sage }} />
                            <div>
                              <p className="text-sm" style={{ color: COLORS.sageDark }}>
                                Week of {formatDateShort(block.startDate)} - {formatDateShort(block.endDate)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {getTotalMealsForBlock(block)} meals selected
                              </p>
                            </div>
                          </div>
                          {isEditingRecipes && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteWeekBlock(block.id);
                              }}
                              className="p-2 hover:bg-white rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          )}
                        </div>

                        {/* Week Block Meal Grid (expandable) */}
                        {editingBlockId === block.id && (
                          <div className="p-4 bg-white">
                            {/* Header Row */}
                            <div className="grid grid-cols-4 gap-2 mb-3 pb-2 border-b-2" style={{ borderColor: COLORS.sageBgLight }}>
                              <div></div>
                              <div className="text-center text-xs" style={{ color: COLORS.sageDark }}>Breakfast</div>
                              <div className="text-center text-xs" style={{ color: COLORS.sageDark }}>Lunch</div>
                              <div className="text-center text-xs" style={{ color: COLORS.sageDark }}>Dinner</div>
                            </div>

                            {/* Day Rows */}
                            <div className="space-y-2">
                              {[
                                { label: 'Sunday', value: 0 },
                                { label: 'Monday', value: 1 },
                                { label: 'Tuesday', value: 2 },
                                { label: 'Wednesday', value: 3 },
                                { label: 'Thursday', value: 4 },
                                { label: 'Friday', value: 5 },
                                { label: 'Saturday', value: 6 },
                              ].map((day) => (
                                <div key={day.value} className="grid grid-cols-4 gap-2 items-center">
                                  <div className="text-sm" style={{ color: COLORS.sageDark }}>
                                    {day.label}
                                  </div>
                                  {['breakfast', 'lunch', 'dinner'].map((meal) => (
                                    <button
                                      key={meal}
                                      onClick={() => isEditingRecipes && toggleMealForDay(block.id, day.value, meal)}
                                      disabled={!isEditingRecipes}
                                      className="h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center"
                                      style={{
                                        borderColor: block.meals[day.value]?.includes(meal) ? COLORS.sage : '#e2e8f0',
                                        backgroundColor: block.meals[day.value]?.includes(meal) ? COLORS.sageBgLight : 'white',
                                        cursor: isEditingRecipes ? 'pointer' : 'default',
                                        opacity: isEditingRecipes ? 1 : 0.7
                                      }}
                                    >
                                      {block.meals[day.value]?.includes(meal) && (
                                        <Check className="h-4 w-4" style={{ color: COLORS.sage }} />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit/Save Button */}
                <div className="mt-6 flex justify-end">
                  {!isEditingRecipes ? (
                    <Button
                      onClick={() => setIsEditingRecipes(true)}
                      variant="outline"
                      className="h-10"
                      style={{ borderColor: COLORS.sage, color: COLORS.sageDark }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Meal Plans
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSaveRecipes}
                      className="h-10 text-white"
                      style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>

              {/* Planned Recipes Management */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="mb-4" style={{ color: COLORS.sageDark }}>
                  Planned Recipes
                </h2>

                {plannedRecipes.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 mb-3">
                      Remove any recipes you don't want from your meal plan:
                    </p>
                    {plannedRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all"
                        style={{
                          borderColor: COLORS.sageBgLight,
                          backgroundColor: '#fafafa',
                        }}
                      >
                        {recipe.image && (
                          <img
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate" style={{ color: COLORS.sageDark }}>
                            {recipe.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {recipe.calories} cal • {recipe.prepTime + recipe.cookTime} min
                          </p>
                        </div>
                        {onRemoveRecipe && (
                          <button
                            onClick={() => onRemoveRecipe(recipe.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove recipe"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UtensilsCrossed
                      className="h-12 w-12 mx-auto mb-3 opacity-30"
                      style={{ color: COLORS.sage }}
                    />
                    <p className="text-sm text-slate-500">
                      No recipes planned yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Recipes will appear here once you plan meals on your calendar
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Sign Out Button */}
        <Button
          onClick={onSignOut}
          variant="outline"
          className="w-full mt-4 border-2"
          style={{ 
            borderColor: '#ef4444',
            color: '#ef4444'
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex justify-around max-w-md mx-auto">
          <button
            onClick={() => onNavigate('calendar')}
            className="flex flex-col items-center gap-1 text-slate-400"
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
            className="flex flex-col items-center gap-1"
            style={{ color: COLORS.sage }}
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

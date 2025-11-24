import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Check, Calendar } from 'lucide-react';

export interface OnboardingData {
  lastPeriodStart: Date;
  lastPeriodEnd: Date;
  dietaryPreferences: string[];
  allergies: string[];
  selectedMeals: { [day: number]: string[] }; // { 0: ['breakfast', 'lunch'], 1: ['dinner'], ... }
}

interface OnboardingPageProps {
  onComplete: (data: OnboardingData) => void;
}

const COLORS = {
  sage: '#8a9a84',
  sageDark: '#5a6b54',
  sageLight: '#a8b5a0',
  sageBg: '#f0f2ef',
  sageBgLight: '#e1e5de',
};

const dietaryPreferences = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Low-Carb',
  'High-Protein',
  'Pescatarian',
  'Keto',
];

const allergyOptions = [
  { label: 'Dairy', key: 'Dairy' },
  { label: 'Eggs', key: 'Eggs' },
  { label: 'Peanuts', key: 'Peanuts' },
  { label: 'Tree Nuts', key: 'Tree Nuts' },
  { label: 'Wheat', key: 'Wheat' },
  { label: 'Soy', key: 'Soy' },
  { label: 'Shellfish', key: 'Shellfish' },
];

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [lastPeriodDate, setLastPeriodDate] = useState<Date>();
  const [lastPeriodEndDate, setLastPeriodEndDate] = useState<Date>();
  const [preferences, setPreferences] = useState<string[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<{ [day: number]: string[] }>({});
  const [allergies, setAllergies] = useState<string[]>([]);
  const [otherAllergy, setOtherAllergy] = useState('');

  const togglePreference = (pref: string) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const toggleMeal = (day: number, meal: string) => {
    setSelectedMeals((prev) => {
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

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleComplete = () => {
    if (lastPeriodDate && lastPeriodEndDate) {
      const finalAllergies = otherAllergy.trim() 
        ? [...allergies, otherAllergy.trim()] 
        : allergies;
      
      onComplete({ 
        lastPeriodStart: lastPeriodDate, 
        lastPeriodEnd: lastPeriodEndDate, 
        dietaryPreferences: preferences, 
        allergies: finalAllergies,
        selectedMeals
      });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setLastPeriodDate(new Date(e.target.value));
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setLastPeriodEndDate(new Date(e.target.value));
    }
  };

  const getTotalMealsCount = () => {
    return Object.values(selectedMeals).reduce((total, meals) => total + meals.length, 0);
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header with Progress */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
              style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
            >
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm" style={{ color: COLORS.sageDark }}>Setup Your Profile</h3>
              <p className="text-xs text-slate-500">Step {step} of {totalSteps}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: s <= step ? COLORS.sage : '#e2e8f0' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Step 1: Last Period Dates (Combined Start & End) */}
          {step === 1 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm">
              <div className="text-center mb-8">
                <div 
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" 
                  style={{ backgroundColor: COLORS.sageBgLight }}
                >
                  <Calendar className="w-8 h-8" style={{ color: COLORS.sage }} />
                </div>
                <h1 className="mb-3" style={{ color: COLORS.sageDark }}>Tell us about yourself</h1>
                <p className="text-slate-600 text-sm leading-relaxed">
                  When did your last period start and end? This helps us personalize meal recommendations for your cycle.
                </p>
              </div>

              <div className="space-y-5 mb-8">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm">Period Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={lastPeriodDate ? lastPeriodDate.toISOString().split('T')[0] : ''}
                    onChange={handleDateChange}
                    className="w-full h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-sm">Period End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={lastPeriodEndDate ? lastPeriodEndDate.toISOString().split('T')[0] : ''}
                    onChange={handleEndDateChange}
                    className="w-full h-12 text-base"
                    min={lastPeriodDate ? lastPeriodDate.toISOString().split('T')[0] : undefined}
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!lastPeriodDate || !lastPeriodEndDate}
                className="w-full h-12 text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Dietary Preferences & Allergies */}
          {step === 2 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm">
              <div className="text-center mb-8">
                <h1 className="mb-3" style={{ color: COLORS.sageDark }}>Dietary Preferences & Allergies</h1>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Tell us about your dietary needs (optional)
                </p>
              </div>

              {/* Dietary Preferences */}
              <div className="mb-8">
                <Label className="mb-4 block text-sm">Dietary Preferences</Label>
                <div className="grid grid-cols-2 gap-3">
                  {dietaryPreferences.map((pref) => (
                    <button
                      key={pref}
                      onClick={() => togglePreference(pref)}
                      className="p-4 rounded-xl border-2 transition-all duration-200 relative hover:shadow-sm"
                      style={{
                        borderColor: preferences.includes(pref) ? COLORS.sageLight : '#e2e8f0',
                        backgroundColor: preferences.includes(pref) ? COLORS.sageBgLight : 'white'
                      }}
                    >
                      <span className="text-sm" style={{ color: preferences.includes(pref) ? COLORS.sageDark : '#64748b' }}>
                        {pref}
                      </span>
                      {preferences.includes(pref) && (
                        <Check className="absolute top-2 right-2 h-4 w-4" style={{ color: COLORS.sage }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div className="mb-8">
                <Label className="mb-4 block text-sm">Allergies</Label>
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  {allergyOptions.map((allergy) => (
                    <button
                      key={allergy.key}
                      onClick={() => toggleAllergy(allergy.key)}
                      className="p-3.5 rounded-xl border-2 transition-all duration-200 relative hover:shadow-sm"
                      style={{
                        borderColor: allergies.includes(allergy.key) ? COLORS.sageLight : '#e2e8f0',
                        backgroundColor: allergies.includes(allergy.key) ? COLORS.sageBgLight : 'white'
                      }}
                    >
                      <span className="text-sm" style={{ color: allergies.includes(allergy.key) ? COLORS.sageDark : '#64748b' }}>
                        {allergy.label}
                      </span>
                      {allergies.includes(allergy.key) && (
                        <Check className="absolute top-2 right-2 h-4 w-4" style={{ color: COLORS.sage }} />
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="mt-3">
                  <Label htmlFor="other-allergy" className="text-xs text-slate-600 mb-2 block">Other allergies</Label>
                  <Input
                    id="other-allergy"
                    type="text"
                    placeholder="E.g., Sesame, Fish"
                    value={otherAllergy}
                    onChange={(e) => setOtherAllergy(e.target.value)}
                    className="w-full h-11"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 h-12"
                  style={{ borderColor: COLORS.sage, color: COLORS.sageDark }}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Meal Selection by Day */}
          {step === 3 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm">
              <div className="text-center mb-8">
                <h1 className="mb-3" style={{ color: COLORS.sageDark }}>Plan Your Meals</h1>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Select which meals you'd like each day
                </p>
              </div>

              {/* Meal Selection Grid */}
              <div className="mb-8">
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
                    { label: 'Mon', value: 1 },
                    { label: 'Tue', value: 2 },
                    { label: 'Wed', value: 3 },
                    { label: 'Thu', value: 4 },
                    { label: 'Fri', value: 5 },
                    { label: 'Sat', value: 6 },
                    { label: 'Sun', value: 0 },
                  ].map((day) => (
                    <div key={day.value} className="grid grid-cols-4 gap-2 items-center">
                      <div className="text-sm" style={{ color: COLORS.sageDark }}>{day.label}</div>
                      {['breakfast', 'lunch', 'dinner'].map((meal) => (
                        <button
                          key={meal}
                          onClick={() => toggleMeal(day.value, meal)}
                          className="h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center"
                          style={{
                            borderColor: selectedMeals[day.value]?.includes(meal) ? COLORS.sage : '#e2e8f0',
                            backgroundColor: selectedMeals[day.value]?.includes(meal) ? COLORS.sageBgLight : 'white'
                          }}
                        >
                          {selectedMeals[day.value]?.includes(meal) && (
                            <Check className="h-4 w-4" style={{ color: COLORS.sage }} />
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl p-4 mb-8" style={{ backgroundColor: COLORS.sageBg }}>
                <p className="text-sm text-center">
                  <span style={{ color: COLORS.sageDark }}>{getTotalMealsCount()} total meals selected</span>
                  <br />
                  <span className="text-slate-600 text-xs">across {Object.keys(selectedMeals).length} day{Object.keys(selectedMeals).length !== 1 ? 's' : ''}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 h-12"
                  style={{ borderColor: COLORS.sage, color: COLORS.sageDark }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={getTotalMealsCount() === 0}
                  className="flex-1 h-12 text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
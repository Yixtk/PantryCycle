import { useState } from 'react';
import { Home, BookOpen, User, Edit2, Save, Droplet, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User as UserType, UserProfile } from '../types';
import { PeriodTrackerTab } from './PeriodTrackerTab';

interface ProfilePageProps {
  user: UserType;
  userProfile: UserProfile;
  onNavigate: (page: string) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
  onSignOut?: () => void;
}

const COLORS = {
  sage: '#8a9a84',
  sageDark: '#5a6b54',
  sageLight: '#a8b5a0',
  sageBg: '#f0f2ef',
  sageBgLight: '#e1e5de',
};

export function ProfilePage({ user, userProfile, onNavigate, onUpdateProfile, onSignOut }: ProfilePageProps) {
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  
  // Basic info
  const [editedFirstName, setEditedFirstName] = useState(user.firstName);
  const [editedLastName, setEditedLastName] = useState(user.lastName);
  const [editedEmail, setEditedEmail] = useState(user.email || '');
  const [editedPhone, setEditedPhone] = useState(user.phone || '');

  // Health info
  const [editedPreferences, setEditedPreferences] = useState<string[]>(userProfile.dietaryPreferences);
  const [editedAllergies, setEditedAllergies] = useState<string[]>(
    userProfile.allergies.map(a => a.type)
  );

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
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h1 style={{ color: COLORS.sageDark }}>{user.firstName} {user.lastName}</h1>
              <p className="text-sm text-slate-600">@{user.username}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="health">Health Info</TabsTrigger>
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
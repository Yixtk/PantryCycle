export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const response = await fetch('/api/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        dietaryPreferences: profile.dietaryPreferences,
        allergies: profile.allergies?.map(a => a.type),
        selectedMeals: profile.selectedMeals,
        lastPeriodStart: profile.lastPeriodStart?.toISOString().split('T')[0],
        lastPeriodEnd: profile.lastPeriodEnd?.toISOString().split('T')[0]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    return { userId, ...profile } as UserProfile;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

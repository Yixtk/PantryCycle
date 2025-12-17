// COMPLETE FIX FOR APP.TSX loadUserData function:
// Replace your entire loadUserData function with this:

const loadUserData = async (userId: string) => {
  try {
    console.log('📥 Loading user data for:', userId);
    
    // Load user profile
    const profile = await api.getUserProfile(userId);
    console.log('✅ Profile loaded:', profile);
    setUserProfile(profile);

    // Load ALL recipes from database
    console.log('📚 Loading recipes from database...');
    try {
      const allRecipes = await api.getRecipes({ limit: 1000 });
      console.log(`✅ Loaded ${allRecipes.length} recipes from database`);
      
      if (allRecipes.length > 0) {
        console.log('📊 Sample recipe IDs:', allRecipes.slice(0, 5).map(r => ({ id: r.id, name: r.name })));
        setRecommendedRecipes(allRecipes);
      } else {
        console.warn('⚠️ No recipes returned from database, using mock recipes as fallback');
        const { mockRecipes } = await import('./components/RecipeData');
        setRecommendedRecipes(mockRecipes);
      }
    } catch (recipeError) {
      console.error('❌ Failed to load recipes from database:', recipeError);
      console.log('🔄 Falling back to mock recipes');
      const { mockRecipes } = await import('./components/RecipeData');
      setRecommendedRecipes(mockRecipes);
    }

    // Log week blocks for debugging
    if (profile.weekBlocks && profile.weekBlocks.length > 0) {
      console.log('📅 Week blocks found:', profile.weekBlocks.length);
      profile.weekBlocks.forEach((block, idx) => {
        console.log(`  Week ${idx + 1}:`, {
          id: block.id,
          meals: Object.keys(block.meals).length,
          sampleMeal: block.meals[0] ? block.meals[0][0] : 'none'
        });
      });
    } else {
      console.log('ℹ️ No week blocks found');
    }

  } catch (error) {
    console.error('❌ Failed to load user data:', error);
  }
};

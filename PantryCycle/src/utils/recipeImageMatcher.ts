/**
 * Match recipe name to appropriate gradient background based on keywords
 * Returns CSS gradient string for use in style={{background: ...}}
 */

// Color gradients for different recipe categories
const RECIPE_GRADIENTS: Record<string, string> = {
  // Pasta & Noodles
  pasta: 'linear-gradient(135deg, #FFE5B4 0%, #F4A460 100%)',
  noodles: 'linear-gradient(135deg, #FFE5B4 0%, #F4A460 100%)',
  spaghetti: 'linear-gradient(135deg, #FFE5B4 0%, #F4A460 100%)',
  
  // Salads
  salad: 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
  
  // Rice dishes
  rice: 'linear-gradient(135deg, #FFFAF0 0%, #F5DEB3 100%)',
  risotto: 'linear-gradient(135deg, #FFFAF0 0%, #F5DEB3 100%)',
  
  // Soups & Stews
  soup: 'linear-gradient(135deg, #FFE4B5 0%, #DEB887 100%)',
  stew: 'linear-gradient(135deg, #FFE4B5 0%, #CD853F 100%)',
  broth: 'linear-gradient(135deg, #FFE4B5 0%, #DEB887 100%)',
  
  // Breakfast
  oatmeal: 'linear-gradient(135deg, #F5DEB3 0%, #D2B48C 100%)',
  oats: 'linear-gradient(135deg, #F5DEB3 0%, #D2B48C 100%)',
  pancake: 'linear-gradient(135deg, #FFE4C4 0%, #FFDAB9 100%)',
  waffle: 'linear-gradient(135deg, #FFE4C4 0%, #FFDAB9 100%)',
  toast: 'linear-gradient(135deg, #FFE4C4 0%, #DEB887 100%)',
  egg: 'linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 100%)',
  omelette: 'linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 100%)',
  
  // Bowls
  bowl: 'linear-gradient(135deg, #E6F3E6 0%, #A8B5A0 100%)',
  poke: 'linear-gradient(135deg, #E6F3E6 0%, #A8B5A0 100%)',
  
  // Protein dishes
  chicken: 'linear-gradient(135deg, #FFE4B5 0%, #F4A460 100%)',
  salmon: 'linear-gradient(135deg, #FFA07A 0%, #FF7F50 100%)',
  fish: 'linear-gradient(135deg, #B0E0E6 0%, #87CEEB 100%)',
  beef: 'linear-gradient(135deg, #F4A460 0%, #CD853F 100%)',
  steak: 'linear-gradient(135deg, #F4A460 0%, #CD853F 100%)',
  tofu: 'linear-gradient(135deg, #FFFACD 0%, #F0E68C 100%)',
  tempeh: 'linear-gradient(135deg, #D2B48C 0%, #BC8F8F 100%)',
  
  // Legumes
  lentil: 'linear-gradient(135deg, #CD853F 0%, #8B4513 100%)',
  chickpea: 'linear-gradient(135deg, #F5DEB3 0%, #D2B48C 100%)',
  bean: 'linear-gradient(135deg, #8B4513 0%, #654321 100%)',
  
  // Vegetables
  quinoa: 'linear-gradient(135deg, #F0E68C 0%, #BDB76B 100%)',
  avocado: 'linear-gradient(135deg, #9ACD32 0%, #6B8E23 100%)',
  spinach: 'linear-gradient(135deg, #7CFC00 0%, #32CD32 100%)',
  kale: 'linear-gradient(135deg, #6B8E23 0%, #556B2F 100%)',
  broccoli: 'linear-gradient(135deg, #7FFF00 0%, #32CD32 100%)',
  potato: 'linear-gradient(135deg, #DEB887 0%, #BC8F8F 100%)',
  sweet: 'linear-gradient(135deg, #FF8C00 0%, #FF7F50 100%)',
  
  // Cooking methods
  curry: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  'stir-fry': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
  stir: 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
  roast: 'linear-gradient(135deg, #D2691E 0%, #A0522D 100%)',
  grilled: 'linear-gradient(135deg, #CD853F 0%, #8B4513 100%)',
  grill: 'linear-gradient(135deg, #CD853F 0%, #8B4513 100%)',
  baked: 'linear-gradient(135deg, #F5DEB3 0%, #D2691E 100%)',
  bake: 'linear-gradient(135deg, #F5DEB3 0%, #D2691E 100%)',
  
  // Tacos & Wraps
  taco: 'linear-gradient(135deg, #FFE4B5 0%, #FF8C00 100%)',
  burrito: 'linear-gradient(135deg, #FFE4B5 0%, #FF8C00 100%)',
  wrap: 'linear-gradient(135deg, #FFE4B5 0%, #FF8C00 100%)',
  
  // Desserts
  dessert: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
  cake: 'linear-gradient(135deg, #FFC0CB 0%, #FF1493 100%)',
  cookie: 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
  chocolate: 'linear-gradient(135deg, #8B4513 0%, #3C1414 100%)',
  
  // Smoothies & Drinks
  smoothie: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
  juice: 'linear-gradient(135deg, #FFA500 0%, #FF6347 100%)',
  
  // Sandwich
  sandwich: 'linear-gradient(135deg, #F5DEB3 0%, #D2B48C 100%)',
  burger: 'linear-gradient(135deg, #F4A460 0%, #8B4513 100%)',
  
  // Pizza
  pizza: 'linear-gradient(135deg, #FFE4B5 0%, #DC143C 100%)',
  
  // More specific items
  bulgur: 'linear-gradient(135deg, #E6F3E6 0%, #A8B5A0 100%)',
  casserole: 'linear-gradient(135deg, #FFE4B5 0%, #D2691E 100%)',
  medley: 'linear-gradient(135deg, #E6F3E6 0%, #A8B5A0 100%)',
  plate: 'linear-gradient(135deg, #E6F3E6 0%, #A8B5A0 100%)',
  wild: 'linear-gradient(135deg, #FFFAF0 0%, #CD853F 100%)',
  onion: 'linear-gradient(135deg, #FFE4B5 0%, #D2691E 100%)',
  broil: 'linear-gradient(135deg, #CD853F 0%, #8B4513 100%)',
  simmer: 'linear-gradient(135deg, #FFE4B5 0%, #D2691E 100%)',
  blanch: 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
  
  // Default fallback - sage green
  default: 'linear-gradient(135deg, #E6F3E6 0%, #A8B5A0 100%)'
};

/**
 * Emoji icons for different recipe categories
 */
const RECIPE_EMOJIS: Record<string, string> = {
  pasta: '🍝', noodles: '🍜', spaghetti: '🍝',
  salad: '🥗',
  rice: '🍚', risotto: '🍚',
  soup: '🍲', stew: '🍲', broth: '🍲',
  oatmeal: '🥣', oats: '🥣', pancake: '🥞', waffle: '🧇', toast: '🍞', egg: '🥚', omelette: '🍳',
  bowl: '🥙', poke: '🥙',
  chicken: '🍗', salmon: '🐟', fish: '🐟', beef: '🥩', steak: '🥩', tofu: '🥘', tempeh: '🥘',
  lentil: '🫘', chickpea: '🫘', bean: '🫘',
  quinoa: '🌾', avocado: '🥑', spinach: '🥬', kale: '🥬', broccoli: '🥦', potato: '🥔', sweet: '🍠',
  curry: '🍛', 'stir-fry': '🥘', stir: '🥘', roast: '🍖', grilled: '🍖', grill: '🍖', baked: '🥘', bake: '🥘',
  taco: '🌮', burrito: '🌯', wrap: '🌯',
  dessert: '🍰', cake: '🍰', cookie: '🍪', chocolate: '🍫',
  smoothie: '🥤', juice: '🧃',
  sandwich: '🥪', burger: '🍔',
  pizza: '🍕',
  bulgur: '🥙', casserole: '🥘', medley: '🥙', plate: '🍽️', wild: '🍚', onion: '🧅',
  broil: '🍖', simmer: '🍲', blanch: '🥬',
  default: '🍽️'
};

/**
 * Get gradient background for a recipe based on its name
 * @param recipeName - The name of the recipe
 * @returns CSS gradient string
 */
export function getRecipeGradient(recipeName: string): string {
  if (!recipeName) return RECIPE_GRADIENTS.default;
  
  const nameLower = recipeName.toLowerCase();
  
  // Check each keyword in order of priority
  for (const [keyword, gradient] of Object.entries(RECIPE_GRADIENTS)) {
    if (keyword === 'default') continue;
    if (nameLower.includes(keyword)) {
      return gradient;
    }
  }
  
  return RECIPE_GRADIENTS.default;
}

/**
 * Get emoji icon for a recipe based on its name
 * @param recipeName - The name of the recipe
 * @returns Emoji string
 */
export function getRecipeEmoji(recipeName: string): string {
  if (!recipeName) return RECIPE_EMOJIS.default;
  
  const nameLower = recipeName.toLowerCase();
  
  // Check each keyword in order of priority
  for (const [keyword, emoji] of Object.entries(RECIPE_EMOJIS)) {
    if (keyword === 'default') continue;
    if (nameLower.includes(keyword)) {
      return emoji;
    }
  }
  
  return RECIPE_EMOJIS.default;
}

// Legacy function for backward compatibility - returns gradient
export function getRecipeImage(recipeName: string): string {
  return getRecipeGradient(recipeName);
}

/**
 * Format calories as an integer
 * @param calories - The calorie value
 * @returns Rounded integer string
 */
export function formatCalories(calories: number | undefined | null): string {
  if (calories === undefined || calories === null || isNaN(calories)) {
    return '0';
  }
  return Math.round(calories).toString();
}



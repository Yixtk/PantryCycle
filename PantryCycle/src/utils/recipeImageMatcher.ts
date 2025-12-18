/**
 * Match recipe name to appropriate image URL based on keywords
 */

// Stable Unsplash image URLs by photo ID (more reliable than search)
const RECIPE_IMAGES: Record<string, string> = {
  // Pasta & Noodles
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9',
  noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624',
  spaghetti: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9',
  
  // Salads
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
  
  // Rice dishes
  rice: 'https://images.unsplash.com/photo-1516684732162-798a0062be99',
  risotto: 'https://images.unsplash.com/photo-1476124369491-bb3e6d5ddf9c',
  
  // Soups & Stews
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
  stew: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
  broth: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
  
  // Breakfast
  oatmeal: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf',
  oats: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf',
  pancake: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445',
  waffle: 'https://images.unsplash.com/photo-1568051243851-f9b136146e97',
  toast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8',
  egg: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543',
  omelette: 'https://images.unsplash.com/photo-1525351484163-7529414344d8',
  
  // Bowls
  bowl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  poke: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  
  // Protein dishes
  chicken: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6',
  salmon: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
  fish: 'https://images.unsplash.com/photo-1534766438357-2b77c9d29e0c',
  beef: 'https://images.unsplash.com/photo-1588347818036-5e5580d1e6e7',
  steak: 'https://images.unsplash.com/photo-1588347818036-5e5580d1e6e7',
  tofu: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f',
  tempeh: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f',
  
  // Legumes
  lentil: 'https://images.unsplash.com/photo-1596797038530-2c107229654b',
  chickpea: 'https://images.unsplash.com/photo-1607532941433-304659e8198a',
  bean: 'https://images.unsplash.com/photo-1589478830659-1c4aa50900c8',
  
  // Vegetables  
  quinoa: 'https://images.unsplash.com/photo-1586201375761-83865001e31c',
  avocado: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb',
  kale: 'https://images.unsplash.com/photo-1506802913710-40e2e66339c9',
  broccoli: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655',
  sweet: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90',
  
  // Cooking methods
  curry: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd',
  'stir-fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b',
  stir: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b',
  roast: 'https://images.unsplash.com/photo-1574484284002-952d92456975',
  grilled: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba',
  grill: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba',
  baked: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
  bake: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
  
  // Tacos & Wraps
  taco: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b',
  burrito: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f',
  wrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f',
  
  // Desserts
  dessert: 'https://images.unsplash.com/photo-1551024506-0bccd828d307',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
  cookie: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e',
  chocolate: 'https://images.unsplash.com/photo-1511381939415-e44015466834',
  
  // Smoothies & Drinks
  smoothie: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625',
  juice: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8',
  
  // Sandwich
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af',
  burger: 'https://images.unsplash.com/photo-1550547660-d9450f859349',
  
  // Pizza
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
  
  // More specific items
  bulgur: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  casserole: 'https://images.unsplash.com/photo-1574484284002-952d92456975',
  medley: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  plate: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  wild: 'https://images.unsplash.com/photo-1536304447766-da0ed4ce1b73',
  onion: 'https://images.unsplash.com/photo-1587486936387-1c257d9c2b0d',
  broil: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba',
  simmer: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
  blanch: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
  
  // Default fallback - healthy bowl
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
};

/**
 * Get image URL for a recipe based on its name
 * @param recipeName - The name of the recipe
 * @returns Full Unsplash image URL with parameters
 */
export function getRecipeImage(recipeName: string): string {
  if (!recipeName) {
    return `${RECIPE_IMAGES.default}?w=800&h=600&fit=crop&q=80`;
  }
  
  const nameLower = recipeName.toLowerCase();
  
  // Check each keyword in order of priority
  for (const [keyword, imageBaseUrl] of Object.entries(RECIPE_IMAGES)) {
    if (keyword === 'default') continue;
    if (nameLower.includes(keyword)) {
      return `${imageBaseUrl}?w=800&h=600&fit=crop&q=80`;
    }
  }
  
  // Return default if no match found
  return `${RECIPE_IMAGES.default}?w=800&h=600&fit=crop&q=80`;
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

/**
 * Format nutritional value to 1 decimal place
 * @param value - The nutritional value (protein, fat, carbs, etc.)
 * @returns Formatted string with 1 decimal place
 */
export function formatNutrition(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0';
  }
  return value.toFixed(1);
}




/**
 * Match recipe name to appropriate image based on keywords
 */

// Image URLs for different recipe categories (using reliable Unsplash photo IDs)
const RECIPE_IMAGES = {
  // Pasta & Noodles
  pasta: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop',
  noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
  spaghetti: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&auto=format&fit=crop',
  
  // Salads
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
  
  // Rice dishes
  rice: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&auto=format&fit=crop',
  risotto: 'https://images.unsplash.com/photo-1476124369491-bb3e6d5ddf9c?w=800&auto=format&fit=crop',
  
  // Soups & Stews
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop',
  stew: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop',
  broth: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop',
  
  // Breakfast
  oatmeal: 'https://images.unsplash.com/photo-1517673332423-64d5bdf97d54?w=800&auto=format&fit=crop',
  oats: 'https://images.unsplash.com/photo-1517673332423-64d5bdf97d54?w=800&auto=format&fit=crop',
  pancake: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop',
  waffle: 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=800&auto=format&fit=crop',
  toast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop',
  egg: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&auto=format&fit=crop',
  omelette: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop',
  
  // Bowls
  bowl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
  poke: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
  
  // Protein dishes
  chicken: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&auto=format&fit=crop',
  salmon: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop',
  fish: 'https://images.unsplash.com/photo-1534766438357-2b77convert76b7?w=800&auto=format&fit=crop',
  beef: 'https://images.unsplash.com/photo-1588347818036-5e5580d1e6e7?w=800&auto=format&fit=crop',
  steak: 'https://images.unsplash.com/photo-1588347818036-5e5580d1e6e7?w=800&auto=format&fit=crop',
  tofu: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=800&auto=format&fit=crop',
  tempeh: 'https://images.unsplash.com/photo-1603046891726-36bfd957f438?w=800&auto=format&fit=crop',
  
  // Legumes
  lentil: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&auto=format&fit=crop',
  chickpea: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=800&auto=format&fit=crop',
  bean: 'https://images.unsplash.com/photo-1589478830659-1c4aa50900c8?w=800&auto=format&fit=crop',
  
  // Vegetables
  quinoa: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop',
  avocado: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&auto=format&fit=crop',
  kale: 'https://images.unsplash.com/photo-1515686832-81c1e9446bb6?w=800&auto=format&fit=crop',
  broccoli: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&auto=format&fit=crop',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop',
  sweet: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop',
  
  // Cooking methods
  curry: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&auto=format&fit=crop',
  'stir-fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop',
  stir: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop',
  roast: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&auto=format&fit=crop',
  grilled: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&auto=format&fit=crop',
  grill: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&auto=format&fit=crop',
  baked: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop',
  bake: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop',
  
  // Tacos & Wraps
  taco: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop',
  burrito: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop',
  wrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop',
  
  // Desserts
  dessert: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&auto=format&fit=crop',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop',
  cookie: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&auto=format&fit=crop',
  chocolate: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800&auto=format&fit=crop',
  
  // Smoothies & Drinks
  smoothie: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&auto=format&fit=crop',
  juice: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&auto=format&fit=crop',
  
  // Sandwich
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop',
  burger: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop',
  
  // Pizza
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop',
  
  // More specific items
  bulgur: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
  casserole: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&auto=format&fit=crop',
  medley: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
  plate: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
  wild: 'https://images.unsplash.com/photo-1536304447766-da0ed4ce1b73?w=800&auto=format&fit=crop',
  onion: 'https://images.unsplash.com/photo-1580377968323-4f9c7b69b8e7?w=800&auto=format&fit=crop',
  broil: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&auto=format&fit=crop',
  simmer: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop',
  blanch: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
  
  // Default fallback - healthy bowl
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop'
};

/**
 * Get image URL for a recipe based on its name
 * @param recipeName - The name of the recipe
 * @returns Image URL
 */
export function getRecipeImage(recipeName: string): string {
  if (!recipeName) return RECIPE_IMAGES.default;
  
  const nameLower = recipeName.toLowerCase();
  
  // Check each keyword in order of priority
  for (const [keyword, imageUrl] of Object.entries(RECIPE_IMAGES)) {
    if (keyword === 'default') continue;
    
    // Check if recipe name contains the keyword
    if (nameLower.includes(keyword)) {
      return imageUrl;
    }
  }
  
  // Return default if no match found
  return RECIPE_IMAGES.default;
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


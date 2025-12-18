/**
 * Match recipe name to appropriate image based on keywords
 */

// Image URLs for different recipe categories
const RECIPE_IMAGES = {
  // Pasta & Noodles
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
  noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
  
  // Salads
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
  
  // Rice dishes
  rice: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=300&fit=crop',
  risotto: 'https://images.unsplash.com/photo-1476124369491-bb3e6d5ddf9c?w=400&h=300&fit=crop',
  
  // Soups & Stews
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
  stew: 'https://images.unsplash.com/photo-1604908815879-eb1ed6e93fc6?w=400&h=300&fit=crop',
  broth: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
  
  // Breakfast
  oatmeal: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&h=300&fit=crop',
  oats: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&h=300&fit=crop',
  pancake: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
  waffle: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&h=300&fit=crop',
  toast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
  egg: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400&h=300&fit=crop',
  omelette: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop',
  
  // Bowls
  bowl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  poke: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  
  // Protein dishes
  chicken: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop',
  salmon: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop',
  beef: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&h=300&fit=crop',
  steak: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&h=300&fit=crop',
  tofu: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=400&h=300&fit=crop',
  
  // Legumes
  lentil: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop',
  chickpea: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=400&h=300&fit=crop',
  bean: 'https://images.unsplash.com/photo-1589478830659-1c4aa50900c8?w=400&h=300&fit=crop',
  
  // Vegetables
  quinoa: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
  avocado: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=300&fit=crop',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop',
  kale: 'https://images.unsplash.com/photo-1506802913710-40e2e66339c9?w=400&h=300&fit=crop',
  broccoli: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400&h=300&fit=crop',
  
  // Cooking methods
  curry: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=300&fit=crop',
  'stir-fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
  stir: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
  roast: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop',
  grilled: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
  baked: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
  
  // Tacos & Wraps
  taco: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop',
  burrito: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop',
  wrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop',
  
  // Desserts
  dessert: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
  cookie: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop',
  
  // Smoothies & Drinks
  smoothie: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop',
  juice: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop',
  
  // Sandwich
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop',
  burger: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',
  
  // Pizza
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
  
  // Default fallback
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'
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


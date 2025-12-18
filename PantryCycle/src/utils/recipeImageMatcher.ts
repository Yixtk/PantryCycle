/**
 * Match recipe name to appropriate image based on keywords
 */

// Simple placeholder images using placeholder services
const RECIPE_IMAGES = {
  // Pasta & Noodles
  pasta: 'https://via.placeholder.com/800x600/FFE5B4/8B4513?text=Pasta',
  noodles: 'https://via.placeholder.com/800x600/FFE5B4/8B4513?text=Noodles',
  spaghetti: 'https://via.placeholder.com/800x600/FFE5B4/8B4513?text=Spaghetti',
  
  // Salads
  salad: 'https://via.placeholder.com/800x600/90EE90/228B22?text=Salad',
  
  // Rice dishes
  rice: 'https://via.placeholder.com/800x600/FFFAF0/CD853F?text=Rice',
  risotto: 'https://via.placeholder.com/800x600/FFFAF0/CD853F?text=Risotto',
  
  // Soups & Stews
  soup: 'https://via.placeholder.com/800x600/FFE4B5/D2691E?text=Soup',
  stew: 'https://via.placeholder.com/800x600/FFE4B5/D2691E?text=Stew',
  broth: 'https://via.placeholder.com/800x600/FFE4B5/D2691E?text=Broth',
  
  // Breakfast
  oatmeal: 'https://via.placeholder.com/800x600/F5DEB3/8B7355?text=Oatmeal',
  oats: 'https://via.placeholder.com/800x600/F5DEB3/8B7355?text=Oats',
  pancake: 'https://via.placeholder.com/800x600/FFE4C4/DEB887?text=Pancake',
  waffle: 'https://via.placeholder.com/800x600/FFE4C4/DEB887?text=Waffle',
  toast: 'https://via.placeholder.com/800x600/FFE4C4/DEB887?text=Toast',
  egg: 'https://via.placeholder.com/800x600/FFF8DC/DAA520?text=Egg',
  omelette: 'https://via.placeholder.com/800x600/FFF8DC/DAA520?text=Omelette',
  
  // Bowls
  bowl: 'https://via.placeholder.com/800x600/E6F3E6/5A6B54?text=Bowl',
  poke: 'https://via.placeholder.com/800x600/E6F3E6/5A6B54?text=Poke+Bowl',
  
  // Protein dishes
  chicken: 'https://via.placeholder.com/800x600/FFE4B5/CD853F?text=Chicken',
  salmon: 'https://via.placeholder.com/800x600/FFA07A/DC143C?text=Salmon',
  fish: 'https://via.placeholder.com/800x600/B0E0E6/4682B4?text=Fish',
  beef: 'https://via.placeholder.com/800x600/F4A460/8B4513?text=Beef',
  steak: 'https://via.placeholder.com/800x600/F4A460/8B4513?text=Steak',
  tofu: 'https://via.placeholder.com/800x600/FFFACD/8B8B7A?text=Tofu',
  tempeh: 'https://via.placeholder.com/800x600/D2B48C/8B7355?text=Tempeh',
  
  // Legumes
  lentil: 'https://via.placeholder.com/800x600/CD853F/8B4513?text=Lentil',
  chickpea: 'https://via.placeholder.com/800x600/F5DEB3/DAA520?text=Chickpea',
  bean: 'https://via.placeholder.com/800x600/8B4513/654321?text=Beans',
  
  // Vegetables
  quinoa: 'https://via.placeholder.com/800x600/F0E68C/BDB76B?text=Quinoa',
  avocado: 'https://via.placeholder.com/800x600/9ACD32/556B2F?text=Avocado',
  spinach: 'https://via.placeholder.com/800x600/7CFC00/228B22?text=Spinach',
  kale: 'https://via.placeholder.com/800x600/6B8E23/556B2F?text=Kale',
  broccoli: 'https://via.placeholder.com/800x600/7FFF00/228B22?text=Broccoli',
  potato: 'https://via.placeholder.com/800x600/DEB887/8B7355?text=Potato',
  sweet: 'https://via.placeholder.com/800x600/FF8C00/8B4500?text=Sweet+Potato',
  
  // Cooking methods
  curry: 'https://via.placeholder.com/800x600/FFD700/FF8C00?text=Curry',
  'stir-fry': 'https://via.placeholder.com/800x600/90EE90/228B22?text=Stir+Fry',
  stir: 'https://via.placeholder.com/800x600/90EE90/228B22?text=Stir+Fry',
  roast: 'https://via.placeholder.com/800x600/D2691E/8B4513?text=Roasted',
  grilled: 'https://via.placeholder.com/800x600/CD853F/8B4513?text=Grilled',
  grill: 'https://via.placeholder.com/800x600/CD853F/8B4513?text=Grilled',
  baked: 'https://via.placeholder.com/800x600/F5DEB3/D2691E?text=Baked',
  bake: 'https://via.placeholder.com/800x600/F5DEB3/D2691E?text=Baked',
  
  // Tacos & Wraps
  taco: 'https://via.placeholder.com/800x600/FFE4B5/FF8C00?text=Taco',
  burrito: 'https://via.placeholder.com/800x600/FFE4B5/FF8C00?text=Burrito',
  wrap: 'https://via.placeholder.com/800x600/FFE4B5/FF8C00?text=Wrap',
  
  // Desserts
  dessert: 'https://via.placeholder.com/800x600/FFB6C1/DC143C?text=Dessert',
  cake: 'https://via.placeholder.com/800x600/FFC0CB/FF1493?text=Cake',
  cookie: 'https://via.placeholder.com/800x600/D2691E/8B4513?text=Cookie',
  chocolate: 'https://via.placeholder.com/800x600/8B4513/3C1414?text=Chocolate',
  
  // Smoothies & Drinks
  smoothie: 'https://via.placeholder.com/800x600/FFB6C1/FF69B4?text=Smoothie',
  juice: 'https://via.placeholder.com/800x600/FFA500/FF6347?text=Juice',
  
  // Sandwich
  sandwich: 'https://via.placeholder.com/800x600/F5DEB3/D2691E?text=Sandwich',
  burger: 'https://via.placeholder.com/800x600/F4A460/8B4513?text=Burger',
  
  // Pizza
  pizza: 'https://via.placeholder.com/800x600/FFE4B5/DC143C?text=Pizza',
  
  // More specific items
  bulgur: 'https://via.placeholder.com/800x600/E6F3E6/5A6B54?text=Bulgur',
  casserole: 'https://via.placeholder.com/800x600/FFE4B5/D2691E?text=Casserole',
  medley: 'https://via.placeholder.com/800x600/E6F3E6/5A6B54?text=Medley',
  plate: 'https://via.placeholder.com/800x600/E6F3E6/5A6B54?text=Plate',
  wild: 'https://via.placeholder.com/800x600/FFFAF0/CD853F?text=Wild+Rice',
  onion: 'https://via.placeholder.com/800x600/FFE4B5/D2691E?text=Onion',
  broil: 'https://via.placeholder.com/800x600/CD853F/8B4513?text=Broiled',
  simmer: 'https://via.placeholder.com/800x600/FFE4B5/D2691E?text=Simmered',
  blanch: 'https://via.placeholder.com/800x600/90EE90/228B22?text=Blanched',
  
  // Default fallback - healthy bowl
  default: 'https://via.placeholder.com/800x600/E6F3E6/5A6B54?text=Recipe'
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


// Update your RecipeDetailPage.tsx to handle both ingredient formats:

// Add this helper function at the top of RecipeDetailPage component:
const formatIngredients = (ingredients: Recipe['ingredients']): { item: string; amount: string }[] => {
  // If it's already an array, return it
  if (Array.isArray(ingredients)) {
    return ingredients;
  }
  
  // If it's an object (database format), convert to array
  return Object.entries(ingredients).map(([item, amount]) => ({
    item,
    amount
  }));
};

// Then in your render, use:
const ingredientsList = formatIngredients(recipe.ingredients);

// And map over ingredientsList instead of recipe.ingredients:
{ingredientsList.map((ing, index) => (
  <li key={index} className="flex items-start gap-2">
    <Check className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: COLORS.sage }} />
    <span className="text-sm text-slate-700">
      <span className="font-medium">{ing.amount}</span> {ing.item}
    </span>
  </li>
))}

// Also add this helper for getting the image:
const getRecipeImage = (recipe: Recipe): string => {
  return recipe.image || recipe.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
};

// Use it in your image src:
<img
  src={getRecipeImage(recipe)}
  alt={recipe.name}
  className="w-full h-64 object-cover"
/>

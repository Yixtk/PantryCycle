import { useState, useEffect, useCallback } from 'react';
import { Home, BookOpen, User, ShoppingCart, Plus, Trash2, Edit2, Save, X, Droplet } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Recipe, UserProfile } from '../types';

interface GroceryItem {
  id: number;
  name: string;
  quantity: string;
  expirationDate: string;
  category?: string;
}

interface GroceryListPageProps {
  onNavigate: (page: string) => void;
  recipes: Recipe[];
  userProfile: UserProfile;
}

export function GroceryListPage({ onNavigate, recipes, userProfile }: GroceryListPageProps) {
  // Generate grocery items from selected recipes in week blocks
  const generateGroceryItems = useCallback((): GroceryItem[] => {
    const ingredientsMap: { [key: string]: { quantity: string; count: number } } = {};
    let itemId = 1;

    // Extract all recipe IDs from week blocks
    if (userProfile.weekBlocks && userProfile.weekBlocks.length > 0) {
      userProfile.weekBlocks.forEach(weekBlock => {
        Object.values(weekBlock.meals).forEach(dayMeals => {
          dayMeals.forEach(mealAssignment => {
            if (typeof mealAssignment !== 'string' && mealAssignment.recipeId) {
              // Find the recipe
              const recipe = recipes.find(r => r.id === mealAssignment.recipeId);
              
              if (recipe && recipe.ingredients) {
                // Parse ingredients (can be object or array)
                let ingredientsList: { item: string; amount: string }[] = [];
                
                if (Array.isArray(recipe.ingredients)) {
                  ingredientsList = recipe.ingredients;
                } else if (typeof recipe.ingredients === 'object') {
                  // Convert { "item": "amount" } to array format
                  ingredientsList = Object.entries(recipe.ingredients).map(([item, amount]) => ({
                    item,
                    amount: String(amount)
                  }));
                }
                
                // Add to ingredients map
                ingredientsList.forEach(({ item, amount }) => {
                  const normalizedItem = item.toLowerCase().trim();
                  
                  if (ingredientsMap[normalizedItem]) {
                    // Item already exists - for now, just increment count
                    ingredientsMap[normalizedItem].count++;
                  } else {
                    ingredientsMap[normalizedItem] = {
                      quantity: amount,
                      count: 1
                    };
                  }
                });
              }
            }
          });
        });
      });
    }

    // Convert map to array with proper quantities
    const items: GroceryItem[] = Object.entries(ingredientsMap).map(([name, { quantity, count }]) => {
      // Generate expiration date (7 days from now for produce, 30 days for others)
      const daysToAdd = name.includes('produce') || name.includes('vegetable') || 
                        name.includes('fruit') || name.includes('lettuce') || 
                        name.includes('spinach') || name.includes('herb') ? 7 : 30;
      
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + daysToAdd);
      
      // Determine category
      let category = 'Other';
      if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
          name.includes('fish') || name.includes('salmon') || name.includes('shrimp') ||
          name.includes('tofu')) {
        category = 'Proteins';
      } else if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || 
                 name.includes('butter') || name.includes('egg')) {
        category = 'Dairy';
      } else if (name.includes('rice') || name.includes('pasta') || name.includes('bread') || 
                 name.includes('flour') || name.includes('oat') || name.includes('quinoa')) {
        category = 'Grains';
      } else if (name.includes('tomato') || name.includes('lettuce') || name.includes('spinach') ||
                 name.includes('carrot') || name.includes('onion') || name.includes('pepper') ||
                 name.includes('broccoli') || name.includes('potato') || name.includes('avocado')) {
        category = 'Produce';
      } else if (name.includes('oil') || name.includes('sauce') || name.includes('spice') ||
                 name.includes('salt') || name.includes('pepper') || name.includes('vinegar')) {
        category = 'Pantry';
      }
      
      // If count > 1, update quantity to show multiple needed
      const displayQuantity = count > 1 ? `${quantity} (×${count})` : quantity;
      
      return {
        id: itemId++,
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
        quantity: displayQuantity,
        expirationDate: expirationDate.toISOString().split('T')[0],
        category
      };
    });

    // If no items from recipes, return empty array
    return items.length > 0 ? items : [];
  }, [recipes, userProfile]);

  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);

  // Regenerate grocery list when userProfile or recipes change
  useEffect(() => {
    const items = generateGroceryItems();
    setGroceryItems(items);
  }, [generateGroceryItems]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  // New item states
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemExpiration, setNewItemExpiration] = useState('');

  // Edit item states
  const [editedName, setEditedName] = useState('');
  const [editedQuantity, setEditedQuantity] = useState('');
  const [editedExpiration, setEditedExpiration] = useState('');

  const handleAddItem = () => {
    if (newItemName && newItemQuantity && newItemExpiration) {
      const newItem: GroceryItem = {
        id: Math.max(...groceryItems.map(item => item.id), 0) + 1,
        name: newItemName,
        quantity: newItemQuantity,
        expirationDate: newItemExpiration,
      };
      setGroceryItems([...groceryItems, newItem]);
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemExpiration('');
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = (id: number) => {
    setGroceryItems(groceryItems.filter(item => item.id !== id));
  };

  const handleStartEdit = (item: GroceryItem) => {
    setEditingItemId(item.id);
    setEditedName(item.name);
    setEditedQuantity(item.quantity);
    setEditedExpiration(item.expirationDate);
  };

  const handleSaveEdit = (id: number) => {
    setGroceryItems(groceryItems.map(item =>
      item.id === id
        ? { ...item, name: editedName, quantity: editedQuantity, expirationDate: editedExpiration }
        : item
    ));
    setEditingItemId(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditedName('');
    setEditedQuantity('');
    setEditedExpiration('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilExpiration = (dateString: string) => {
    const today = new Date();
    const expirationDate = new Date(dateString);
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationColor = (dateString: string) => {
    const days = getDaysUntilExpiration(dateString);
    if (days < 0) return '#ef4444'; // Expired - red
    if (days <= 3) return '#f97316'; // Expiring soon - orange
    if (days <= 7) return '#eab308'; // Within a week - yellow
    return '#22c55e'; // Fresh - green
  };

  // Group items by category
  const groupedItems = groceryItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  return (
    <div className="min-h-screen flex flex-col hide-scrollbar" style={{ background: 'linear-gradient(to bottom, #e1e5de 0%, #f0f2ef 50%, #ffffff 100%)' }}>
      <div className="flex-1 p-4 pb-20 overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' }}>
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg" style={{ color: '#5a6b54' }}>Grocery List</h1>
              <p className="text-xs text-slate-600">{groceryItems.length} items</p>
            </div>
          </div>

          {/* Tagline */}
          <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: '#f0f2ef' }}>
            <p className="text-sm text-center italic" style={{ color: '#5a6b54' }}>
              "Where convenience for your body and your life meets. Let's find what works best for you and your budget."
            </p>
          </div>

          {/* Intro text */}
          <p className="text-xs text-slate-600 text-center">
            {groceryItems.length > 0 
              ? "Here's a grocery list based on the recipes you've selected in your meal plan."
              : "Add meals to your calendar to automatically generate your grocery list."}
          </p>
        </div>

        {/* Empty state */}
        {groceryItems.length === 0 && !isAddingItem && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-4 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-sm mb-2" style={{ color: '#5a6b54' }}>No meals planned yet</h3>
            <p className="text-xs text-slate-500 mb-4">
              Go to your Calendar and add meals to your week to see ingredients here.
            </p>
            <Button
              onClick={() => onNavigate('calendar')}
              size="sm"
              className="text-white"
              style={{ background: 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' }}
            >
              Go to Calendar
            </Button>
          </div>
        )}

        {/* Add Item Button */}
        {!isAddingItem && groceryItems.length > 0 && (
          <Button
            onClick={() => setIsAddingItem(true)}
            className="w-full mb-4 text-white"
            style={{ background: 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}

        {/* Add Item Form */}
        {isAddingItem && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm" style={{ color: '#5a6b54' }}>Add New Item</h3>
              <button onClick={() => setIsAddingItem(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Item Name</Label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g., Chicken breast"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  placeholder="e.g., 2 lbs"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Expiration Date</Label>
                <Input
                  type="date"
                  value={newItemExpiration}
                  onChange={(e) => setNewItemExpiration(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsAddingItem(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddItem}
                  size="sm"
                  className="flex-1 text-white"
                  style={{ background: 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' }}
                  disabled={!newItemName || !newItemQuantity || !newItemExpiration}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Grocery Items by Category */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-4">
            <h2 className="text-xs uppercase tracking-wide mb-2 px-1" style={{ color: '#8a9a84' }}>
              {category}
            </h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-3"
                >
                  {editingItemId === item.id ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        value={editedQuantity}
                        onChange={(e) => setEditedQuantity(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        type="date"
                        value={editedExpiration}
                        onChange={(e) => setEditedExpiration(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveEdit(item.id)}
                          size="sm"
                          className="flex-1 h-7 text-xs text-white"
                          style={{ background: 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' }}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-sm text-slate-900">{item.name}</h3>
                        <p className="text-xs text-slate-600 mt-0.5">Qty: {item.quantity}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getExpirationColor(item.expirationDate) }}
                          />
                          <p className="text-xs text-slate-500">
                            Expires: {formatDate(item.expirationDate)}
                            {getDaysUntilExpiration(item.expirationDate) >= 0 && (
                              <span className="ml-1">
                                ({getDaysUntilExpiration(item.expirationDate)}d)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm p-3">
          <h3 className="text-xs mb-2" style={{ color: '#5a6b54' }}>Freshness Indicator</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-slate-600">Fresh (7+ days)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#eab308' }} />
              <span className="text-slate-600">Use soon (3-7 days)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316' }} />
              <span className="text-slate-600">Urgent (1-3 days)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-slate-600">Expired</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 safe-area-inset-bottom">
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
            className="flex flex-col items-center gap-1"
            style={{ color: '#8a9a84' }}
          >
            <ShoppingCart className="h-6 w-6" />
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
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
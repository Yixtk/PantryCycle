import { useState } from 'react';
import { Home, BookOpen, User, ShoppingCart, Plus, Trash2, Edit2, Save, X, Droplet } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface GroceryItem {
  id: number;
  name: string;
  quantity: string;
  expirationDate: string;
  category?: string;
}

interface GroceryListPageProps {
  onNavigate: (page: string) => void;
  recipes?: any[];
}

export function GroceryListPage({ onNavigate, recipes = [] }: GroceryListPageProps) {
  // Generate initial grocery items from recipes
  const generateGroceryItems = (): GroceryItem[] => {
    const items: GroceryItem[] = [
      { id: 1, name: 'Quinoa', quantity: '2 cups', expirationDate: '2025-12-31', category: 'Grains' },
      { id: 2, name: 'Chickpeas', quantity: '3 cans', expirationDate: '2026-06-15', category: 'Canned Goods' },
      { id: 3, name: 'Salmon fillets', quantity: '4 fillets (6 oz each)', expirationDate: '2025-11-25', category: 'Proteins' },
      { id: 4, name: 'Avocado', quantity: '4', expirationDate: '2025-11-22', category: 'Produce' },
      { id: 5, name: 'Spinach', quantity: '2 bags', expirationDate: '2025-11-24', category: 'Produce' },
      { id: 6, name: 'Sweet potatoes', quantity: '6 medium', expirationDate: '2025-12-05', category: 'Produce' },
      { id: 7, name: 'Eggs', quantity: '1 dozen', expirationDate: '2025-12-01', category: 'Dairy' },
      { id: 8, name: 'Almond milk', quantity: '1 carton', expirationDate: '2025-11-30', category: 'Dairy' },
      { id: 9, name: 'Cherry tomatoes', quantity: '2 pints', expirationDate: '2025-11-26', category: 'Produce' },
      { id: 10, name: 'Olive oil', quantity: '1 bottle', expirationDate: '2026-03-15', category: 'Pantry' },
      { id: 11, name: 'Garlic', quantity: '2 bulbs', expirationDate: '2025-12-10', category: 'Produce' },
      { id: 12, name: 'Broccoli', quantity: '2 heads', expirationDate: '2025-11-25', category: 'Produce' },
    ];
    return items;
  };

  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(generateGroceryItems());
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
            Here's a grocery list based on the recipes generated for your unique needs throughout your cycle.
          </p>
        </div>

        {/* Add Item Button */}
        {!isAddingItem && (
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
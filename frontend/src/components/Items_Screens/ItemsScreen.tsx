import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchItems, addItem, updateItem, deleteItem } from '../../services/service';
import type { Item } from '../../types';
import ScrollToTopButton from '../SalesReport/ScrollToTopButton';

// Format number with commas
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

interface ItemsScreenProps {
  items: Item[];
  onAddItem: (item: Item) => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (itemId: string) => void;
}

interface VariantItem {
  id?: string; // Added ID for tracking variants
  subVariant: string;
  price: number;
  stockPosition: number;
  minStock: number;
}

export default function ItemsScreen({ items, onAddItem, onEditItem, onDeleteItem }: ItemsScreenProps) {
  const [newItem, setNewItem] = useState<Partial<Item>>({
    category: '',
    available: true,
    userId: '',
    stockPosition: 0,
    minStock: 0,
    subVariant: '',
  });

  const [variants, setVariants] = useState<VariantItem[]>([
    {
      subVariant: '',
      price: 0,
      stockPosition: 0,
      minStock: 0,
    }
  ]);

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingVariants, setEditingVariants] = useState<VariantItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ index: number; value: string } | null>(null);
  const [backendItems, setBackendItems] = useState<Item[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [showNewItemForm, setShowNewItemForm] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [isMultiVariant, setIsMultiVariant] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userID');
    const loadItems = async () => {
      try {
        const fetchedItems = await fetchItems(userId || "");
        setBackendItems(fetchedItems);
        
        const uniqueCategories = [...new Set(fetchedItems.map(item => item.category))].filter(Boolean);
        const savedCategories = localStorage.getItem('userCategories');
        const existingCategories = savedCategories ? JSON.parse(savedCategories) : [];
        
        const mergedCategories = [...new Set([...existingCategories, ...uniqueCategories])];
        setCategories(mergedCategories);
        localStorage.setItem('userCategories', JSON.stringify(mergedCategories));
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };

    loadItems();
  }, []);

  useEffect(() => {
    if(notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const userId = localStorage.getItem('userID');
    if (userId) {
      setNewItem(prev => ({ ...prev, userId }));
    }
  }, [showNewItemForm]);

  // When editing an item, initialize variants
  useEffect(() => {
    if (editingItem) {
      // Find all items with the same name and category
      const relatedItems = backendItems.filter(
        item => item.name === editingItem.name && item.category === editingItem.category
      );
      
      const variants = relatedItems.map(item => ({
        id: item.id, // Keep track of the item ID for each variant
        subVariant: item.subVariant || '',
        price: item.price || 0,
        stockPosition: item.stockPosition || 0,
        minStock: item.minStock || 0,
      }));
      
      setEditingVariants(variants);
      setIsMultiVariant(variants.length > 1);
    }
  }, [editingItem, backendItems]);

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      localStorage.setItem('userCategories', JSON.stringify(updatedCategories));
      setNewCategory('');
      setNotification('Category added successfully');
    } else if (categories.includes(newCategory.trim())) {
      setNotification('Error: Category already exists');
    }
  };

  const handleEditCategory = (index: number) => {
    setEditingCategory({ index, value: categories[index] });
  };

  const handleUpdateCategory = () => {
    if (editingCategory && editingCategory.value.trim()) {
      const categoryExists = categories.some(
        (cat, idx) => idx !== editingCategory.index && cat === editingCategory.value.trim()
      );

      if (categoryExists) {
        setNotification('Error: Category name already exists');
        return;
      }

      const updatedCategories = [...categories];
      updatedCategories[editingCategory.index] = editingCategory.value;
      setCategories(updatedCategories);
      localStorage.setItem('userCategories', JSON.stringify(updatedCategories));
      
      const oldCategory = categories[editingCategory.index];
      setBackendItems(prevItems =>
        prevItems.map(item => 
          item.category === oldCategory 
            ? { ...item, category: editingCategory.value }
            : item
        )
      );
      
      setEditingCategory(null);
      setNotification('Category updated successfully');
    }
  };

  const handleDeleteCategory = (index: number) => {
    const categoryToDelete = categories[index];
    const itemsWithCategory = backendItems.filter(item => item.category === categoryToDelete);
    
    if (itemsWithCategory.length > 0) {
      setNotification('Error: Cannot delete category with existing items');
      return;
    }

    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
    localStorage.setItem('userCategories', JSON.stringify(updatedCategories));
    setNotification('Category deleted successfully');
  };

  const addVariant = () => {
    if (editingItem) {
      setEditingVariants([...editingVariants, {
        subVariant: '',
        price: 0,
        stockPosition: 0,
        minStock: 0,
      }]);
    } else {
      setVariants([...variants, {
        subVariant: '',
        price: 0,
        stockPosition: 0,
        minStock: 0,
      }]);
    }
  };

  const removeVariant = (index: number) => {
    if (editingItem) {
      const variantToRemove = editingVariants[index];
      if (variantToRemove.id) {
        handleDelete(variantToRemove.id);
      }
      if (editingVariants.length > 1) {
        setEditingVariants(editingVariants.filter((_, i) => i !== index));
      }
    } else if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: keyof VariantItem, value: string | number) => {
    if (editingItem) {
      const updatedVariants = editingVariants.map((variant, i) => {
        if (i === index) {
          return { ...variant, [field]: value };
        }
        return variant;
      });
      setEditingVariants(updatedVariants);
    } else {
      const updatedVariants = variants.map((variant, i) => {
        if (i === index) {
          return { ...variant, [field]: value };
        }
        return variant;
      });
      setVariants(updatedVariants);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    if (!newItem.category) {
      setNotification('Error: Please select a category');
      return;
    }
 
    if (newItem.name && newItem.category) {
      try {
        if (editingItem) {
          // Update existing variants
          const updatePromises = editingVariants.map(async variant => {
            if (variant.id) {
              const itemToUpdate = backendItems.find(item => item.id === variant.id);
              if (itemToUpdate) {
                const updatedItem = {
                  ...itemToUpdate,
                  ...newItem,
                  subVariant: variant.subVariant,
                  price: variant.price,
                  stockPosition: variant.stockPosition,
                  minStock: variant.minStock,
                };
                const updated = await updateItem(variant.id, updatedItem);
                onEditItem(updated);
                return updated;
              }
            }
            
            // If no ID, create new variant
            const newVariantItem = {
              ...newItem,
              subVariant: variant.subVariant,
              price: variant.price,
              stockPosition: variant.stockPosition,
              minStock: variant.minStock,
            };
            const added = await addItem(newVariantItem);
            onAddItem(added);
            return added;
          });

          const updatedItems = await Promise.all(updatePromises);
          setBackendItems(prevItems => {
            const itemsToKeep = prevItems.filter(item => 
              !editingVariants.some(variant => variant.id === item.id)
            );
            return [...itemsToKeep, ...updatedItems];
          });

          setNotification('Items updated successfully');
          resetForm();
        } else {
          // Handle new item creation (single or multi-variant)
          const variantsToAdd = isMultiVariant ? variants : [{
            subVariant: newItem.subVariant || '',
            price: newItem.price || 0,
            stockPosition: newItem.stockPosition || 0,
            minStock: newItem.minStock || 0,
          }];

          const addPromises = variantsToAdd.map(async variant => {
            const itemToAdd = {
              ...newItem,
              subVariant: variant.subVariant,
              price: variant.price,
              stockPosition: variant.stockPosition,
              minStock: variant.minStock,
            };
            const added = await addItem(itemToAdd);
            onAddItem(added);
            return added;
          });

          const addedItems = await Promise.all(addPromises);
          setBackendItems(prev => [...prev, ...addedItems]);
          setNotification('Items added successfully');
          resetForm();
        }
      } catch (error) {
        console.error('Error submitting item:', error);
        setNotification('Error: Failed to submit item');
      }
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setNewItem({
      ...item,
      image: item.image || '',
      subVariant: item.subVariant || '',
    });
    setShowNewItemForm(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      onDeleteItem(itemId);
      setBackendItems(prevItems => prevItems.filter(item => item.id !== itemId));
      setNotification('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      setNotification('Error: Failed to delete item');
    }
  };

  const resetForm = () => {
    setNewItem({ 
      category: '', 
      available: true,
      stockPosition: 0,
      minStock: 0,
      subVariant: '',
    });
    setVariants([{
      subVariant: '',
      price: 0,
      stockPosition: 0,
      minStock: 0,
    }]);
    setIsMultiVariant(false);
    setEditingItem(null);
    setEditingVariants([]);
    setShowNewItemForm(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
 
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setNewItem((prevItem) => ({ ...prevItem, image: base64Image }));
      };
 
      reader.readAsDataURL(file);
    }
  };

  const groupedItems = backendItems.reduce((acc: { [key: string]: Item[] }, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const renderVariantFields = (isEditing: boolean) => {
    const currentVariants = isEditing ? editingVariants : variants;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Variants</h3>
          <button
            type="button"
            onClick={addVariant}
            className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
          >
            <Plus size={16} className="mr-1" />
            Add Variant
          </button>
        </div>

        {currentVariants.map((variant, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Variant {index + 1}</h4>
              {currentVariants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Variant Size</label>
                <input
                  type="text"
                  value={variant.subVariant}
                  onChange={e => updateVariant(index, 'subVariant', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="e.g., 500ml"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price (Selling)</label>
                <input
                  type="number"
                  value={variant.price}
                  onChange={e => updateVariant(index, 'price', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Stock Position</label>
                <input
                  type="number"
                  value={variant.stockPosition}
                  onChange={e => updateVariant(index, 'stockPosition', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Stock</label>
                <input
                  type="number"
                  value={variant.minStock}
                  onChange={e => updateVariant(index, 'minStock', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4">
      {notification && (
        <div 
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 
            flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg 
            transition-all duration-300 ease-in-out z-50
            ${notification.toLowerCase().includes('error') 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'}`}
          style={{
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {notification.toLowerCase().includes('error') 
            ? <AlertCircle size={18} /> 
            : <CheckCircle size={18} />}
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <button
          onClick={() => setShowNewItemForm(!showNewItemForm)}
          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          disabled={categories.length === 0}
        >
          {showNewItemForm ? 'Cancel New Item' : 'Add New Item'}
        </button>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
        >
          Manage Categories
        </button>
      </div>

      {categories.length === 0 && !showCategoryModal && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 mb-4 text-sm">
          <p className="font-bold">No categories available</p>
          <p>Please add categories before creating items.</p>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Manage Categories</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={handleAddCategory}
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
              >
                <Plus size={20} />
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="text-center text-gray-500 py-3 text-sm">
                No categories added yet. Start by adding a category above.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto text-sm">
                {categories.map((category, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    {editingCategory?.index === index ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingCategory.value}
                          onChange={(e) => setEditingCategory({ ...editingCategory, value: e.target.value })}
                          className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                        />
                        <button
                          onClick={handleUpdateCategory}
                          className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">{category}</span>
                        <button
                          onClick={() => handleEditCategory(index)}
                          className="p-1 text-blue-500 hover:text-blue-700"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showNewItemForm && (
        <div className="mb-6 bg-white rounded-lg shadow p-4 text-sm">
          <h2 className="text-xl font-semibold mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
          
          {!editingItem && (
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isMultiVariant}
                  onChange={(e) => setIsMultiVariant(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Add multiple variants</span>
              </label>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newItem.name || ''}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  required
                  placeholder="e.g., Coca Cola"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newItem.category || ''}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Image</label>
                <input
                  type="file"
                  onChange={handleImageUpload}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  accept="image/*"
                />
                {newItem.image && !editingItem?.image && (
                  <div className="mt-2">
                    <img src={newItem.image} alt="Selected Image" className="w-24 h-24 object-cover" />
                  </div>
                )}
              </div>
            </div>

            {(isMultiVariant || editingItem) ? (
              renderVariantFields(!!editingItem)
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sub Variant</label>
                  <input
                    type="text"
                    value={newItem.subVariant || ''}
                    onChange={e => setNewItem({ ...newItem, subVariant: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    placeholder="e.g., 500ml"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price (Selling Price)</label>
                  <input
                    type="number"
                    value={newItem.price || ''}
                    onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stock Position</label>
                  <input
                    type="number"
                    value={newItem.stockPosition || 0}
                    onChange={e => setNewItem({ ...newItem, stockPosition: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    value={newItem.minStock || 0}
                    onChange={e => setNewItem({ ...newItem, minStock: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Available</label>
                  <select
                    value={newItem.available?.toString() || 'true'}
                    onChange={e => setNewItem({ ...newItem, available: e.target.value === 'true' })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                <Plus size={20} className="mr-2" />
                {editingItem ? 'Update Item' : isMultiVariant ? 'Add All Variants' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

<div className="space-y-4">
  {Object.keys(groupedItems).map((category) => (
    <div key={category}>
      <h3 className="text-lg font-semibold mb-2">{category}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
        {groupedItems[category].map((item) => (
          <div key={item.id} className="flex bg-white rounded-lg shadow-sm p-1.5 w-full max-w-md mx-auto transition-transform transform hover:scale-102 text-xs">
            <div className="w-1/2 pr-1.5 flex-shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded-lg" />
            </div>
            <div className="flex flex-col w-1/2 pl-2 justify-between">
              <h3 className="text-sm font-semibold text-gray-800 mb-0.5">{item.name}</h3>
              {item.subVariant && (
                <p className="text-xs text-gray-600 mb-0.5">Variant: {item.subVariant}</p>
              )}
              <p className="text-xs text-gray-600 mb-0.5">Category: {item.category}</p>
              <p className="text-sm font-semibold text-gray-800 mb-0.5">₹ {formatNumber(item.price)}</p>
              <p className="text-xs text-gray-600">Stock: {formatNumber(item.stockPosition || 0)}</p>
              {(item.stockPosition || 0) <= (item.minStock || 0) && (
                <p className="text-xs text-red-600 font-semibold">Low Stock Alert!</p>
              )}
              <div className="flex space-x-1 mt-1">
                <button
                  onClick={() => handleEdit(item)}
                  className="bg-blue-500 text-white px-1.5 py-0.5 rounded-md hover:bg-blue-600 transition-colors w-full sm:w-auto text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-red-500 text-white px-2 py-0.5 rounded-md hover:bg-red-600 transition-colors w-full sm:w-auto text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
<ScrollToTopButton />
    </div>
  );
}
import React, { useState } from 'react';
import { MenuItem, ExtraTopping } from '../../types/pos';
import { formatCurrency } from '../../services/calculator';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface MenuManagerProps {
  menuItems: MenuItem[];
  extrasList: ExtraTopping[];
  onSaveItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  onSaveExtra: (extra: ExtraTopping) => void;
  onDeleteExtra: (extraId: string) => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  extrasList,
  onSaveItem,
  onDeleteItem,
  onSaveExtra,
  onDeleteExtra,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for add/edit item
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    category: 'Pizza',
    isPizza: true,
    prices: { Small: 599, Medium: 1099, Large: 1599 },
    price: 250,
    enabled: true,
    description: '',
    image: '',
  });

  const categories = [
    'All',
    'Pizza',
    'Burger',
    'Pratha',
    'Shawarma',
    'Nuggets',
    'Hot Wings',
    'Fries',
    'Cold Drinks',
    'Extras',
  ];

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      prices: item.prices || { Small: 599, Medium: 1099, Large: 1599 },
    });
    setShowAddModal(true);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: `item-${Date.now()}`,
      name: '',
      category: 'Burger',
      isPizza: false,
      price: 250,
      enabled: true,
      description: '',
      image: '',
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const isPizza = formData.category === 'Pizza';

    const itemToSave: MenuItem = {
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category || 'Burger',
      isPizza,
      prices: isPizza ? formData.prices : undefined,
      price: !isPizza ? Number(formData.price) || 0 : undefined,
      enabled: formData.enabled ?? true,
      image: formData.image?.trim() || undefined,
      description: formData.description?.trim() || undefined,
    };

    onSaveItem(itemToSave);
    setShowAddModal(false);
  };

  const handleToggleEnable = (item: MenuItem) => {
    onSaveItem({ ...item, enabled: !item.enabled });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* Top Banner */}
      <div className="p-3.5 bg-[#141417] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Menu & Price Management
              <span className="text-xs font-mono text-zinc-400">({menuItems.length} Products)</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Configure product catalog, 3 pizza sizes pricing, availability, and images
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#141417] border-b border-[#27272a] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#d97706] text-white'
                  : 'bg-[#1e1e22] text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name..."
            className="w-full bg-[#1b1b1f] border border-[#2e2e33] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#d97706]"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141417] border-b border-[#27272a] text-zinc-400 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Price / Sizes</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filteredItems.map((item) => {
                const isPizza = item.isPizza && item.prices;
                return (
                  <tr key={item.id} className="hover:bg-[#1f1f23]/50 transition-colors">
                    {/* Status Toggle */}
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleToggleEnable(item)}
                        title={item.enabled ? 'Click to disable' : 'Click to enable'}
                        className={`p-1 rounded ${
                          item.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-600 hover:text-zinc-500'
                        }`}
                      >
                        {item.enabled ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Product Name & Description */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="w-7 h-7 rounded object-cover bg-zinc-800"
                          />
                        )}
                        <div>
                          <div className={`font-bold ${item.enabled ? 'text-white' : 'text-zinc-500 line-through'}`}>
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-[10px] text-zinc-500 line-clamp-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] text-zinc-400 bg-[#121215] px-2 py-0.5 rounded border border-[#27272a]">
                        {item.category}
                      </span>
                    </td>

                    {/* Price / Sizes */}
                    <td className="py-2.5 px-3 font-mono">
                      {isPizza ? (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span>
                            S: <strong className="text-[#fbbf24]">{formatCurrency(item.prices!.Small)}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            M: <strong className="text-[#fbbf24]">{formatCurrency(item.prices!.Medium)}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            L: <strong className="text-[#fbbf24]">{formatCurrency(item.prices!.Large)}</strong>
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-sm text-[#fbbf24] tabular-nums">
                          {formatCurrency(item.price || 0)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272a] rounded transition-colors"
                          title="Edit product & prices"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${item.name}"? Note: Historical orders will preserve their recorded prices.`)) {
                              onDeleteItem(item.id);
                            }
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-[#27272a] rounded transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-base font-bold text-white">
                {editingItem ? `Edit Product: ${editingItem.name}` : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Special Dubai Pizza"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setFormData({
                      ...formData,
                      category: cat,
                      isPizza: cat === 'Pizza',
                    });
                  }}
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                >
                  {categories
                    .filter((c) => c !== 'All' && c !== 'Deals')
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              {/* Pizza Sizes or Standard Price */}
              {formData.category === 'Pizza' ? (
                <div className="space-y-2 p-3 bg-[#121215] rounded-lg border border-[#27272a]">
                  <label className="text-xs font-bold text-[#fbbf24] block">
                    Configure 3 Pizza Size Prices (Rs.):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Small (7")</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.prices?.Small || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            prices: {
                              ...formData.prices!,
                              Small: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full bg-[#1b1b1f] border border-[#2e2e33] rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Medium (10")</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.prices?.Medium || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            prices: {
                              ...formData.prices!,
                              Medium: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full bg-[#1b1b1f] border border-[#2e2e33] rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Large (14")</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.prices?.Large || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            prices: {
                              ...formData.prices!,
                              Large: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full bg-[#1b1b1f] border border-[#2e2e33] rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">
                    Selling Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-[#d97706]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Image Path / URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/src/assets/images/... or https://..."
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients or description for receipt/menu..."
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-[#27272a] text-zinc-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#d97706] text-white text-xs font-bold rounded"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

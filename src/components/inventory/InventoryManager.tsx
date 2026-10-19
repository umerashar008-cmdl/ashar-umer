import React, { useState } from 'react';
import { InventoryItem } from '../../types/pos';
import { formatCurrency } from '../../services/calculator';
import { Package, Plus, AlertTriangle, CheckCircle, Search, Edit2 } from 'lucide-react';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateItem: (item: InventoryItem) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onUpdateItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [currentStock, setCurrentStock] = useState('50');
  const [minStockLevel, setMinStockLevel] = useState('15');
  const [costPerUnit, setCostPerUnit] = useState('200');
  const [category, setCategory] = useState('General');

  const filtered = inventory.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }
    return true;
  });

  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minStockLevel);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setUnit('kg');
    setCurrentStock('50');
    setMinStockLevel('15');
    setCostPerUnit('200');
    setCategory('General');
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setUnit(item.unit);
    setCurrentStock(item.currentStock.toString());
    setMinStockLevel(item.minStockLevel.toString());
    setCostPerUnit(item.costPerUnit.toString());
    setCategory(item.category);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const item: InventoryItem = {
      id: editingItem ? editingItem.id : `inv-${Date.now()}`,
      name: name.trim(),
      unit: unit.trim(),
      currentStock: parseFloat(currentStock) || 0,
      minStockLevel: parseFloat(minStockLevel) || 0,
      costPerUnit: parseFloat(costPerUnit) || 0,
      category: category.trim(),
      lastUpdated: new Date().toISOString(),
    };

    onUpdateItem(item);
    setShowAddModal(false);
  };

  const handleQuickAdjust = (item: InventoryItem, delta: number) => {
    const updated = {
      ...item,
      currentStock: Math.max(0, item.currentStock + delta),
      lastUpdated: new Date().toISOString(),
    };
    onUpdateItem(updated);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* Top Banner */}
      <div className="p-3.5 bg-[#141417] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center">
            <Package className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Kitchen Inventory & Stock Alerts
              <span className="text-xs font-mono text-zinc-400">({inventory.length} Items)</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Manage raw materials, packaging boxes, and monitor low stock warnings
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* Low stock alert badge if any */}
      {lowStockItems.length > 0 && (
        <div className="p-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs px-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Attention:</strong> {lowStockItems.length} inventory item(s) are below safety minimum stock levels (
            {lowStockItems.map((i) => i.name).join(', ')})
          </span>
        </div>
      )}

      {/* Search */}
      <div className="p-3 bg-[#141417] border-b border-[#27272a]">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock by name or category..."
            className="w-full bg-[#1b1b1f] border border-[#2e2e33] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#d97706]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141417] border-b border-[#27272a] text-zinc-400 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Current Stock</th>
                <th className="py-2.5 px-3">Min Level</th>
                <th className="py-2.5 px-3">Unit Cost</th>
                <th className="py-2.5 px-3">Quick Adjust</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filtered.map((item) => {
                const isLow = item.currentStock <= item.minStockLevel;
                return (
                  <tr key={item.id} className="hover:bg-[#1f1f23]/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        {isLow ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="text-[10px] text-zinc-400 bg-[#121215] px-2 py-0.5 rounded border border-[#27272a]">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span
                        className={`text-sm tabular-nums ${
                          isLow ? 'text-amber-400' : 'text-zinc-200'
                        }`}
                      >
                        {item.currentStock} {item.unit}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-zinc-400">
                      {item.minStockLevel} {item.unit}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-zinc-400">
                      {formatCurrency(item.costPerUnit)} / {item.unit}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 font-mono">
                        <button
                          onClick={() => handleQuickAdjust(item, -5)}
                          className="px-1.5 py-0.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 rounded text-[10px]"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item, -1)}
                          className="px-1.5 py-0.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 rounded text-[10px]"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item, 1)}
                          className="px-1.5 py-0.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 rounded text-[10px]"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item, 10)}
                          className="px-1.5 py-0.5 bg-[#d97706]/20 hover:bg-[#d97706]/30 text-[#fbbf24] rounded text-[10px] font-bold"
                        >
                          +10
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272a] rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {editingItem ? 'Edit Stock Item' : 'Add New Inventory Item'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mozzarella Cheese"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg, pcs, boxes"
                    className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Dairy, Meat, Bakery"
                    className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">
                    Min Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(e.target.value)}
                    className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Cost per Unit (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white font-mono"
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
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

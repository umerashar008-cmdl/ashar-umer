import React, { useState } from 'react';
import { DealItem, DealIngredient, MenuItem } from '../../types/pos';
import { formatCurrency } from '../../services/calculator';
import {
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Plus,
  Trash2,
  X,
  Check,
} from 'lucide-react';

interface DealsManagerProps {
  deals: DealItem[];
  menuItems: MenuItem[];
  onSaveDeal: (deal: DealItem) => void;
}

export const DealsManager: React.FC<DealsManagerProps> = ({
  deals,
  menuItems,
  onSaveDeal,
}) => {
  const [editingDeal, setEditingDeal] = useState<DealItem | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  const deal18 = deals.find((d) => d.dealNumber === 18);
  const isDeal18Unconfirmed = deal18 && (!deal18.isPriceConfirmed || deal18.price <= 0);

  const handleOpenEdit = (deal: DealItem) => {
    setEditingDeal(deal);
    setEditPrice(deal.price.toString());
    setEditName(deal.name);
    setEditDescription(deal.description || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;

    const parsedPrice = parseFloat(editPrice) || 0;
    const isNowConfirmed = editingDeal.dealNumber === 18 ? parsedPrice > 0 : true;

    const updated: DealItem = {
      ...editingDeal,
      name: editName.trim(),
      price: parsedPrice,
      isPriceConfirmed: isNowConfirmed,
      description: editDescription.trim(),
    };

    onSaveDeal(updated);
    setEditingDeal(null);
  };

  const handleToggleEnable = (deal: DealItem) => {
    onSaveDeal({ ...deal, enabled: !deal.enabled });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* Top Banner */}
      <div className="p-3.5 bg-[#141417] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center">
            <Tag className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              All 26 Deals Management
              <span className="text-xs font-mono text-zinc-400">({deals.length} Active Deals)</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Preserves exact deal recipes, special combos, and selling price configuration
            </p>
          </div>
        </div>
      </div>

      {/* DEAL 18 SPECIAL ALERT BANNER IF UNCONFIRMED */}
      {isDeal18Unconfirmed && (
        <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              ACTION REQUIRED: Deal 18 has an unconfirmed price (Rs. 0 in original POS database).
            </span>
          </div>
          <button
            onClick={() => handleOpenEdit(deal18)}
            className="px-3 py-1 bg-amber-500 text-zinc-950 font-bold rounded hover:bg-amber-400 transition-colors shrink-0"
          >
            Confirm Deal 18 Price Now
          </button>
        </div>
      )}

      {/* Deals Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 content-start">
        {deals.map((deal) => {
          const isUnconfirmed = !deal.isPriceConfirmed || deal.price <= 0;

          return (
            <div
              key={deal.id}
              className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                isUnconfirmed
                  ? 'bg-[#1b1912] border-amber-500/50 ring-1 ring-amber-500/20'
                  : !deal.enabled
                  ? 'bg-[#18181b]/50 border-zinc-800 opacity-60'
                  : 'bg-[#18181b] border-[#27272a] hover:border-[#d97706]/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-[#fbbf24] bg-[#d97706]/15 px-2 py-0.5 rounded border border-[#d97706]/30">
                      DEAL #{deal.dealNumber}
                    </span>
                    <button
                      onClick={() => handleToggleEnable(deal)}
                      title={deal.enabled ? 'Click to disable deal' : 'Click to enable deal'}
                      className={`p-0.5 rounded ${
                        deal.enabled ? 'text-emerald-400' : 'text-zinc-600'
                      }`}
                    >
                      {deal.enabled ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  </div>

                  {isUnconfirmed ? (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40 animate-pulse">
                      Price Unconfirmed
                    </span>
                  ) : (
                    <span className="font-mono font-extrabold text-sm text-[#fbbf24] tabular-nums">
                      {formatCurrency(deal.price)}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-white mb-2">{deal.name}</h4>

                {/* Ingredients List */}
                <div className="bg-[#121215] p-2.5 rounded-lg border border-[#27272a] space-y-1 text-xs">
                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">
                    Contents ({deal.ingredients.length} items):
                  </div>
                  {deal.ingredients.map((ing, idx) => (
                    <div key={idx} className="text-zinc-300 flex items-center justify-between">
                      <span>• {ing.productName} {ing.size ? `(${ing.size})` : ''}</span>
                      <span className="font-mono text-zinc-500 text-[10px]">Qty: {ing.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-2 border-t border-[#27272a] flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">
                  {deal.enabled ? 'Available in POS' : 'Disabled'}
                </span>
                <button
                  onClick={() => handleOpenEdit(deal)}
                  className="px-2.5 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-semibold rounded flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3 h-3 text-[#d97706]" />
                  <span>Edit Deal</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Deal Modal */}
      {editingDeal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-base font-bold text-white">
                Edit {editingDeal.name} (Deal #{editingDeal.dealNumber})
              </h3>
              <button onClick={() => setEditingDeal(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Deal Title
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Selling Price (Rs.) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="e.g. 1950"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Description / Subtitle
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  className="flex-1 py-2 bg-[#27272a] text-zinc-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#d97706] text-white text-xs font-bold rounded"
                >
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

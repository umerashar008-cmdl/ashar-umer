import React, { useState } from 'react';
import { MenuItem, PizzaSize, ExtraTopping } from '../../types/pos';
import { formatCurrency } from '../../services/calculator';
import { X, Plus, Minus, Check } from 'lucide-react';

interface PizzaSizeModalProps {
  item: MenuItem;
  extrasList: ExtraTopping[];
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    size: PizzaSize,
    quantity: number,
    selectedExtras: { name: string; price: number }[],
    notes: string
  ) => void;
}

export const PizzaSizeModal: React.FC<PizzaSizeModalProps> = ({
  item,
  extrasList,
  onClose,
  onAddToCart,
}) => {
  const [selectedSize, setSelectedSize] = useState<PizzaSize>('Medium');
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<{ [extraId: string]: boolean }>({});
  const [notes, setNotes] = useState('');

  if (!item.prices) return null;

  const basePrice = item.prices[selectedSize];

  // Calculate extra prices based on size
  const extrasWithPrices = extrasList.map((extra) => {
    let price = extra.price;
    if (extra.sizePrices && extra.sizePrices[selectedSize]) {
      price = extra.sizePrices[selectedSize];
    }
    return {
      ...extra,
      effectivePrice: price,
    };
  });

  const activeExtras = extrasWithPrices
    .filter((e) => selectedExtras[e.id])
    .map((e) => ({ name: e.name, price: e.effectivePrice }));

  const totalExtrasPrice = activeExtras.reduce((sum, e) => sum + e.price, 0);
  const unitPrice = basePrice + totalExtrasPrice;
  const totalPrice = unitPrice * quantity;

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddToCart(item, selectedSize, quantity, activeExtras, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#141417]">
          <div>
            <h3 className="text-base font-bold text-white">{item.name}</h3>
            <p className="text-xs text-[#d97706] font-medium">Select size and optional toppings</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Size Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">Pizza Size</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Small', 'Medium', 'Large'] as PizzaSize[]).map((size) => {
                const isSelected = selectedSize === size;
                const sizeLabel = size === 'Small' ? '7"' : size === 'Medium' ? '10"' : '14"';
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 px-2 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'bg-[#d97706]/15 border-[#d97706] text-white shadow-sm ring-1 ring-[#d97706]'
                        : 'bg-[#212124] border-[#2e2e33] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{size}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mb-1">{sizeLabel}</div>
                    <div className="text-xs font-mono font-bold text-[#fbbf24] tabular-nums">
                      {formatCurrency(item.prices![size])}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Extra Toppings */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">
              Add Extras / Toppings
            </label>
            <div className="space-y-1.5">
              {extrasWithPrices.map((extra) => {
                const isChecked = !!selectedExtras[extra.id];
                return (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                      isChecked
                        ? 'bg-[#d97706]/10 border-[#d97706]/60 text-white'
                        : 'bg-[#212124] border-[#2e2e33] text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked ? 'bg-[#d97706] border-[#d97706] text-white' : 'border-zinc-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{extra.name}</span>
                    </div>
                    <span className="font-mono text-zinc-400 tabular-nums">
                      +{formatCurrency(extra.effectivePrice)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Kitchen Instructions (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Crispy crust, less spice, cut in 8 slices"
              className="w-full bg-[#121215] border border-[#2e2e33] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#d97706]"
            />
          </div>

          {/* Quantity and Total Bar */}
          <div className="pt-2 border-t border-[#27272a] flex items-center justify-between gap-4">
            <div className="flex items-center border border-[#2e2e33] bg-[#121215] rounded-lg">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 text-zinc-400 hover:text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-xs font-mono font-bold text-white tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2 text-zinc-400 hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-zinc-500">Total Price</div>
              <div className="text-base font-bold font-mono text-[#fbbf24] tabular-nums">
                {formatCurrency(totalPrice)}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-white font-bold text-xs rounded-lg transition-all shadow-md active:scale-98"
          >
            Add to Order ({formatCurrency(totalPrice)})
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { DealItem, MenuItem, DealIngredient, UserRole } from '../../types/pos';
import { formatCurrency } from '../../services/calculator';
import { X, Plus, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

interface DealPickerModalProps {
  deal: DealItem;
  menuItems: MenuItem[];
  role: UserRole;
  onClose: () => void;
  onConfirmDealPrice?: (dealId: string, confirmedPrice: number) => void;
  onAddToCart: (
    deal: DealItem,
    quantity: number,
    configuredIngredients: DealIngredient[],
    price: number
  ) => void;
}

export const DealPickerModal: React.FC<DealPickerModalProps> = ({
  deal,
  menuItems,
  role,
  onClose,
  onConfirmDealPrice,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [adminPriceInput, setAdminPriceInput] = useState<string>(
    deal.price > 0 ? deal.price.toString() : ''
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available pizza flavors for deals with generic pizza
  const pizzaFlavors = menuItems.filter((m) => m.category === 'Pizza').map((p) => p.name);

  // Configure pizza flavors for each pizza ingredient in the deal
  const [ingredients, setIngredients] = useState<DealIngredient[]>(() => {
    return deal.ingredients.map((ing) => {
      const isPizza =
        ing.productName.toLowerCase().includes('pizza') ||
        ing.productName.toLowerCase().includes('steak');
      return {
        ...ing,
        selectedFlavor: isPizza ? ing.selectedFlavor || 'Special Dubai Pizza' : undefined,
      };
    });
  });

  const handleFlavorChange = (index: number, flavor: string) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], selectedFlavor: flavor };
      return copy;
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let effectivePrice = deal.price;

    // Check Deal 18 or 0 price
    if (!deal.isPriceConfirmed || effectivePrice <= 0) {
      const parsed = parseFloat(adminPriceInput);
      if (isNaN(parsed) || parsed <= 0) {
        setErrorMsg('Deal 18 price must be confirmed with a valid amount (greater than Rs. 0).');
        return;
      }
      effectivePrice = parsed;
      if (onConfirmDealPrice) {
        onConfirmDealPrice(deal.id, parsed);
      }
    }

    onAddToCart(deal, quantity, ingredients, effectivePrice);
    onClose();
  };

  const currentPrice =
    deal.isPriceConfirmed && deal.price > 0
      ? deal.price
      : parseFloat(adminPriceInput) || 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#141417]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{deal.name}</h3>
              {!deal.isPriceConfirmed && (
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Price Unconfirmed
                </span>
              )}
            </div>
            <p className="text-xs text-[#d97706] font-medium">Configure items and confirm deal</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleAdd} className="p-5 space-y-4">
          {/* Deal 18 Warning if not confirmed */}
          {(!deal.isPriceConfirmed || deal.price === 0) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Price Needs Confirmation</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                The original database stored this deal price as Rs. 0. Enter the approved selling price before adding to cart.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <label className="text-xs font-semibold text-white whitespace-nowrap">
                  Selling Price (Rs.):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adminPriceInput}
                  onChange={(e) => setAdminPriceInput(e.target.value)}
                  placeholder="Enter price e.g. 2350"
                  className="bg-[#121215] border border-amber-500/40 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-hidden focus:border-amber-400 w-36"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Deal Ingredients & Pizza Flavor Customization */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">
              Deal Items ({ingredients.length} components)
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {ingredients.map((ing, idx) => {
                const isGenericPizza =
                  ing.productName.toLowerCase().includes('pizza') ||
                  ing.productName.toLowerCase().includes('steak');

                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#212124] border border-[#2e2e33] rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-zinc-200">
                        {ing.quantity} × {ing.productName} {ing.size ? `(${ing.size})` : ''}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 bg-[#18181b] px-1.5 py-0.5 rounded border border-[#2e2e33]">
                        Qty: {ing.quantity * quantity}
                      </span>
                    </div>

                    {/* Flavor selection for generic pizza items */}
                    {isGenericPizza && (
                      <div className="mt-2 pt-2 border-t border-[#27272a] flex items-center gap-2">
                        <label className="text-[11px] text-zinc-400 whitespace-nowrap">
                          Select Flavor:
                        </label>
                        <select
                          value={ing.selectedFlavor || ''}
                          onChange={(e) => handleFlavorChange(idx, e.target.value)}
                          className="bg-[#141417] border border-[#3f3f46] text-white text-xs rounded px-2 py-1 flex-1 focus:outline-hidden focus:border-[#d97706]"
                        >
                          {pizzaFlavors.map((flavor) => (
                            <option key={flavor} value={flavor}>
                              {flavor}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quantity & Summary */}
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
              <div className="text-[10px] text-zinc-500">Deal Total</div>
              <div className="text-base font-bold font-mono text-[#fbbf24] tabular-nums">
                {formatCurrency(currentPrice * quantity)}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={currentPrice <= 0}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-all shadow-md active:scale-98"
          >
            Add Deal to Cart ({formatCurrency(currentPrice * quantity)})
          </button>
        </form>
      </div>
    </div>
  );
};

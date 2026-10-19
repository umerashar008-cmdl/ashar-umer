import React, { useState, useMemo } from 'react';
import {
  MenuItem,
  DealItem,
  CartItem,
  OrderType,
  PaymentMethod,
  Order,
  RestaurantTable,
  ShopSettings,
  ExtraTopping,
  UserRole,
} from '../../types/pos';
import { calculateOrderTotals, formatCurrency } from '../../services/calculator';
import { PizzaSizeModal } from './PizzaSizeModal';
import { DealPickerModal } from './DealPickerModal';
import {
  Search,
  Trash2,
  Plus,
  Minus,
  Printer,
  Save,
  CheckCircle2,
  ChefHat,
  RotateCcw,
  User,
  Phone,
  MapPin,
  Tag,
  CreditCard,
  Banknote,
  Building,
  UserCheck,
} from 'lucide-react';

interface BillingPOSProps {
  menuItems: MenuItem[];
  deals: DealItem[];
  tables: RestaurantTable[];
  extrasList: ExtraTopping[];
  settings: ShopSettings;
  role: UserRole;
  onSaveOrder: (order: Order, printReceipt: boolean, printKot: boolean) => void;
  onUpdateDealPrice?: (dealId: string, price: number) => void;
}

export const BillingPOS: React.FC<BillingPOSProps> = ({
  menuItems,
  deals,
  tables,
  extrasList,
  settings,
  role,
  onSaveOrder,
  onUpdateDealPrice,
}) => {
  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableNumber, setTableNumber] = useState<string>('1');

  // Customer details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');

  // Financial fields
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [deliveryCharges, setDeliveryCharges] = useState<number>(0);
  const [extraCharges, setExtraCharges] = useState<number>(0);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Modals
  const [activePizzaItem, setActivePizzaItem] = useState<MenuItem | null>(null);
  const [activeDealItem, setActiveDealItem] = useState<DealItem | null>(null);

  // Categories list
  const categories = [
    'All',
    'Deals',
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

  // Filtered products & deals
  const filteredProducts = useMemo(() => {
    let items = menuItems.filter((i) => i.enabled);
    if (selectedCategory !== 'All' && selectedCategory !== 'Deals') {
      items = items.filter((i) => i.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, selectedCategory, searchQuery]);

  const filteredDeals = useMemo(() => {
    if (selectedCategory !== 'All' && selectedCategory !== 'Deals') return [];
    let dList = deals.filter((d) => d.enabled);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      dList = dList.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          `deal ${d.dealNumber}`.includes(q)
      );
    }
    return dList;
  }, [deals, selectedCategory, searchQuery]);

  // Central calculations
  const totals = useMemo(() => {
    return calculateOrderTotals({
      items: cart,
      discount,
      discountType,
      deliveryCharges: orderType === 'DELIVERY' ? deliveryCharges : 0,
      extraCharges,
      receivedAmount,
    });
  }, [cart, discount, discountType, deliveryCharges, extraCharges, receivedAmount, orderType]);

  // When delivery is selected, default delivery fee
  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    if (type === 'DELIVERY' && deliveryCharges === 0) {
      setDeliveryCharges(settings.defaultDeliveryFee || 100);
    }
  };

  // Add standard non-pizza item
  const handleAddStandardItem = (item: MenuItem) => {
    if (item.isPizza) {
      setActivePizzaItem(item);
      return;
    }

    const price = item.price || 0;
    setCart((prev) => {
      const existingIdx = prev.findIndex((ci) => ci.itemId === item.id && !ci.extras?.length);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          cartItemId: `ci-${Date.now()}-${Math.random()}`,
          itemId: item.id,
          name: item.name,
          category: item.category,
          unitPrice: price,
          quantity: 1,
        },
      ];
    });
  };

  // Add pizza item from modal
  const handleAddPizzaToCart = (
    item: MenuItem,
    size: 'Small' | 'Medium' | 'Large',
    quantity: number,
    selectedExtras: { name: string; price: number }[],
    notes: string
  ) => {
    const basePrice = item.prices ? item.prices[size] : 0;
    const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
    const unitPrice = basePrice + extrasTotal;

    setCart((prev) => [
      ...prev,
      {
        cartItemId: `ci-${Date.now()}-${Math.random()}`,
        itemId: item.id,
        name: item.name,
        category: item.category,
        size,
        unitPrice,
        quantity,
        extras: selectedExtras,
        itemNotes: notes,
      },
    ]);
  };

  // Add deal from modal
  const handleAddDealToCart = (
    deal: DealItem,
    quantity: number,
    configuredIngredients: any[],
    effectivePrice: number
  ) => {
    setCart((prev) => [
      ...prev,
      {
        cartItemId: `ci-deal-${Date.now()}-${Math.random()}`,
        itemId: deal.id,
        name: deal.name,
        category: 'Deals',
        unitPrice: effectivePrice,
        quantity,
        isDeal: true,
        dealNumber: deal.dealNumber,
        dealIngredients: configuredIngredients,
      },
    ]);
  };

  // Cart item controls
  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.cartItemId === cartItemId) {
            const nextQty = ci.quantity + delta;
            return nextQty > 0 ? { ...ci, quantity: nextQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from current cart?')) {
      setCart([]);
      setDiscount(0);
      setExtraCharges(0);
      setReceivedAmount(0);
      setOrderNotes('');
    }
  };

  // Set quick cash amount
  const handleQuickCash = (amt: number) => {
    setReceivedAmount(amt);
  };

  // Build and submit order
  const handleCheckout = (isCompleted: boolean, printReceipt: boolean, printKot: boolean) => {
    if (cart.length === 0) {
      alert('Cart is empty. Please select products to create a bill.');
      return;
    }

    if (orderType === 'DELIVERY' && (!customerName.trim() || !customerPhone.trim())) {
      alert('Customer Name and Phone number are required for delivery orders.');
      return;
    }

    if (paymentMethod === 'CREDIT_UDHAAR' && !customerName.trim()) {
      alert('Customer Name is required when saving an order under Udhaar / Credit.');
      return;
    }

    const orderId = `ord-${Date.now()}`;
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}`;
    const billNumber = `BIL-${Date.now().toString().slice(-4)}`;
    const kotNumber = `KOT-${Date.now().toString().slice(-4)}`;

    const paymentStatus =
      totals.remainingAmount === 0
        ? 'PAID'
        : totals.receivedAmount > 0
        ? 'PARTIAL'
        : 'CREDIT_UDHAAR';

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      billNumber,
      kotNumber,
      orderType,
      status: isCompleted ? 'COMPLETED' : 'CONFIRMED',
      tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
      },
      items: cart,
      subtotal: totals.subtotal,
      discount,
      discountType,
      discountAmount: totals.discountAmount,
      deliveryCharges: orderType === 'DELIVERY' ? deliveryCharges : 0,
      extraCharges,
      grandTotal: totals.grandTotal,
      receivedAmount: totals.receivedAmount,
      remainingAmount: totals.remainingAmount,
      changeReturn: totals.changeReturn,
      paymentMethod,
      paymentStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: isCompleted ? new Date().toISOString() : undefined,
      cashierName: role === 'ADMIN' ? 'Admin' : 'Cashier',
      notes: orderNotes.trim(),
      kotPrintedCount: printKot ? 1 : 0,
      billPrintedCount: printReceipt ? 1 : 0,
    };

    onSaveOrder(newOrder, printReceipt, printKot);

    // Reset bill state
    setCart([]);
    setDiscount(0);
    setExtraCharges(0);
    setReceivedAmount(0);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setOrderNotes('');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* LEFT SECTION: Products & Deals Selection */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-[#27272a]">
        {/* Category Tabs & Search Bar */}
        <div className="p-3 bg-[#141417] border-b border-[#27272a] space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pizza, burgers, shawarma, or deals (e.g. Deal 1)..."
              className="w-full bg-[#1b1b1f] border border-[#2e2e33] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#d97706]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Categories Horizontal Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-[#d97706] text-white shadow-xs'
                      : 'bg-[#1e1e22] text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
          {/* DEALS FIRST if selected */}
          {(selectedCategory === 'All' || selectedCategory === 'Deals') &&
            filteredDeals.map((deal) => {
              const isUnconfirmed = !deal.isPriceConfirmed || deal.price === 0;
              return (
                <div
                  key={deal.id}
                  onClick={() => setActiveDealItem(deal)}
                  className="bg-[#18181b] border border-[#27272a] hover:border-[#d97706] rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg group relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#d97706]/15 text-[#fbbf24] border border-[#d97706]/30">
                        DEAL #{deal.dealNumber}
                      </span>
                      {isUnconfirmed ? (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30">
                          Needs Price
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-400">
                          {deal.ingredients.length} items
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-[#fbbf24] transition-colors leading-snug line-clamp-1">
                      {deal.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {deal.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#27272a] flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold text-[#fbbf24] tabular-nums">
                      {isUnconfirmed ? 'Confirm Price' : formatCurrency(deal.price)}
                    </span>
                    <span className="text-[10px] font-medium text-white bg-[#27272a] group-hover:bg-[#d97706] px-2 py-0.5 rounded transition-colors">
                      Select
                    </span>
                  </div>
                </div>
              );
            })}

          {/* MENU PRODUCTS */}
          {filteredProducts.map((item) => {
            const hasMultipleSizes = item.isPizza && item.prices;
            return (
              <div
                key={item.id}
                onClick={() => handleAddStandardItem(item)}
                className="bg-[#18181b] border border-[#27272a] hover:border-[#d97706] rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg group relative overflow-hidden"
              >
                {/* Optional Image */}
                {item.image && (
                  <div className="w-full h-24 mb-2 rounded-lg overflow-hidden bg-[#27272a]">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5 font-medium">
                    {item.category}
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#fbbf24] transition-colors leading-snug line-clamp-1">
                    {item.name}
                  </h4>
                  {item.description && (
                    <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-[#27272a] flex items-center justify-between">
                  {hasMultipleSizes ? (
                    <div>
                      <span className="text-[10px] text-zinc-400 block leading-none">From</span>
                      <span className="text-xs font-mono font-extrabold text-[#fbbf24] tabular-nums">
                        {formatCurrency(item.prices!.Small)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-extrabold text-[#fbbf24] tabular-nums">
                      {formatCurrency(item.price || 0)}
                    </span>
                  )}

                  <span className="text-[10px] font-medium text-white bg-[#27272a] group-hover:bg-[#d97706] px-2 py-0.5 rounded transition-colors">
                    {hasMultipleSizes ? 'Sizes' : '+ Add'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SECTION: Cart, Order Details & Calculations */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-[#141417] flex flex-col justify-between shrink-0 overflow-hidden border-t md:border-t-0 md:border-l border-[#27272a]">
        {/* Order Details Header */}
        <div className="p-3 border-b border-[#27272a] space-y-2 bg-[#18181b]">
          {/* Order Type Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#121215] rounded-lg border border-[#27272a]">
            {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as OrderType[]).map((type) => {
              const isSelected = orderType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleOrderTypeChange(type)}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                    isSelected
                      ? 'bg-[#d97706] text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {type === 'DINE_IN' ? 'Dine In' : type === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
                </button>
              );
            })}
          </div>

          {/* Order Type Specific Fields */}
          {orderType === 'DINE_IN' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400 font-semibold whitespace-nowrap">
                Select Table:
              </label>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="bg-[#121215] border border-[#2e2e33] text-white text-xs rounded-lg px-2.5 py-1.5 flex-1 focus:outline-hidden focus:border-[#d97706]"
              >
                {tables.map((tbl) => (
                  <option key={tbl.id} value={tbl.number}>
                    Table {tbl.number} ({tbl.name}) - {tbl.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer fields for Delivery or optional Takeaway */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={orderType === 'DELIVERY' ? 'Customer Name *' : 'Customer Name'}
                className="w-full bg-[#121215] border border-[#2e2e33] rounded-lg pl-7 pr-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#d97706]"
              />
            </div>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={orderType === 'DELIVERY' ? 'Phone Number *' : 'Phone Number'}
                className="w-full bg-[#121215] border border-[#2e2e33] rounded-lg pl-7 pr-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#d97706]"
              />
            </div>
          </div>

          {orderType === 'DELIVERY' && (
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Delivery Address (Street / House / Sector) *"
                className="w-full bg-[#121215] border border-[#2e2e33] rounded-lg pl-7 pr-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#d97706]"
              />
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <div className="w-12 h-12 rounded-full bg-[#1f1f23] flex items-center justify-center mb-2">
                <ChefHat className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-xs font-semibold text-zinc-400">Cart is empty</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Select items from the menu to build the order
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="p-2.5 bg-[#18181b] border border-[#27272a] rounded-lg text-xs space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {item.size && (
                        <span className="text-[10px] font-mono px-1 py-0.2 bg-[#27272a] text-[#fbbf24] rounded">
                          {item.size}
                        </span>
                      )}
                    </div>
                    {item.selectedPizzaFlavor && (
                      <div className="text-[10px] text-zinc-400">
                        Flavor: {item.selectedPizzaFlavor}
                      </div>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <div className="text-[10px] text-zinc-400">
                        + {item.extras.map((e) => e.name).join(', ')}
                      </div>
                    )}
                    {item.itemNotes && (
                      <div className="text-[10px] text-zinc-500 italic">"{item.itemNotes}"</div>
                    )}
                  </div>

                  <button
                    onClick={() => removeCartItem(item.cartItemId)}
                    className="text-zinc-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, -1)}
                      className="w-5 h-5 rounded bg-[#27272a] hover:bg-[#3f3f46] text-white flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-white w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, 1)}
                      className="w-5 h-5 rounded bg-[#27272a] hover:bg-[#3f3f46] text-white flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="font-mono text-right">
                    <span className="text-[10px] text-zinc-500 mr-2">
                      @{item.unitPrice}
                    </span>
                    <span className="font-bold text-[#fbbf24] tabular-nums">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Calculation Panel & Actions */}
        <div className="p-3 bg-[#18181b] border-t border-[#27272a] space-y-2.5">
          {/* Quick Financial Inputs: Discount, Delivery, Extra Rs */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Discount */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5">
                <span>Discount</span>
                <button
                  type="button"
                  onClick={() =>
                    setDiscountType((dt) => (dt === 'FIXED' ? 'PERCENT' : 'FIXED'))
                  }
                  className="text-[9px] font-mono text-[#d97706] hover:underline"
                >
                  {discountType === 'FIXED' ? 'Rs.' : '%'}
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-2 py-1 text-xs text-white font-mono text-right focus:outline-hidden focus:border-[#d97706]"
              />
            </div>

            {/* Extra Charges */}
            <div>
              <div className="text-[10px] text-zinc-400 mb-0.5">Extra Rs.</div>
              <input
                type="number"
                min="0"
                value={extraCharges || ''}
                onChange={(e) => setExtraCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-full bg-[#121215] border border-[#2e2e33] rounded px-2 py-1 text-xs text-white font-mono text-right focus:outline-hidden focus:border-[#d97706]"
              />
            </div>

            {/* Delivery Charges (if delivery) */}
            <div>
              <div className="text-[10px] text-zinc-400 mb-0.5">Delivery Fee</div>
              <input
                type="number"
                min="0"
                disabled={orderType !== 'DELIVERY'}
                value={orderType === 'DELIVERY' ? deliveryCharges : 0}
                onChange={(e) => setDeliveryCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#121215] border border-[#2e2e33] disabled:opacity-40 rounded px-2 py-1 text-xs text-white font-mono text-right focus:outline-hidden focus:border-[#d97706]"
              />
            </div>
          </div>

          {/* Summary Row */}
          <div className="space-y-1 text-xs border-t border-[#27272a] pt-2">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-mono text-zinc-200">{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span className="font-mono">- {formatCurrency(totals.discountAmount)}</span>
              </div>
            )}
            {orderType === 'DELIVERY' && totals.deliveryCharges > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Delivery:</span>
                <span className="font-mono">+ {formatCurrency(totals.deliveryCharges)}</span>
              </div>
            )}
            {totals.extraCharges > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Extra Charges:</span>
                <span className="font-mono">+ {formatCurrency(totals.extraCharges)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-black pt-1 border-t border-[#27272a]">
              <span className="text-white">Grand Total:</span>
              <span className="font-mono text-base text-[#fbbf24] tabular-nums">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'CASH' as PaymentMethod, label: 'Cash', icon: Banknote },
              { id: 'CARD' as PaymentMethod, label: 'Card', icon: CreditCard },
              { id: 'BANK_TRANSFER' as PaymentMethod, label: 'Bank', icon: Building },
              { id: 'CREDIT_UDHAAR' as PaymentMethod, label: 'Udhaar', icon: UserCheck },
            ].map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id)}
                className={`py-1 px-1.5 rounded text-[11px] font-semibold border flex items-center justify-center gap-1 transition-colors ${
                  paymentMethod === pm.id
                    ? 'bg-[#d97706] text-white border-[#b45309]'
                    : 'bg-[#121215] text-zinc-400 border-[#2e2e33] hover:text-white'
                }`}
              >
                <pm.icon className="w-3 h-3" />
                <span>{pm.label}</span>
              </button>
            ))}
          </div>

          {/* Received Amount & Remaining / Change */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-[#121215] p-2 rounded-lg border border-[#27272a]">
            <div>
              <div className="text-[10px] text-zinc-400 mb-0.5">Received (Rs.)</div>
              <input
                type="number"
                min="0"
                value={receivedAmount || ''}
                onChange={(e) => setReceivedAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-full bg-[#1b1b1f] border border-[#2e2e33] rounded px-2 py-1 text-xs text-white font-mono font-bold text-right focus:outline-hidden focus:border-[#d97706]"
              />
              {/* Quick Cash Buttons */}
              <div className="flex gap-1 mt-1">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="text-[9px] font-mono bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 px-1 py-0.5 rounded"
                  >
                    {amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleQuickCash(totals.grandTotal)}
                  className="text-[9px] font-mono bg-[#d97706]/20 text-[#fbbf24] px-1 py-0.5 rounded font-bold"
                >
                  Exact
                </button>
              </div>
            </div>

            <div className="text-right flex flex-col justify-center">
              {totals.remainingAmount > 0 ? (
                <div>
                  <div className="text-[10px] text-red-400 font-semibold">Remaining / Udhaar</div>
                  <div className="text-sm font-mono font-bold text-red-400 tabular-nums">
                    {formatCurrency(totals.remainingAmount)}
                  </div>
                </div>
              ) : totals.changeReturn > 0 ? (
                <div>
                  <div className="text-[10px] text-emerald-400 font-semibold">Change Return</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                    {formatCurrency(totals.changeReturn)}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] text-zinc-500">Balance</div>
                  <div className="text-xs font-mono text-zinc-400">Settled (0.00)</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: KOT, Save, Complete & Print */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {/* Print KOT */}
            <button
              type="button"
              onClick={() => handleCheckout(false, false, true)}
              disabled={cart.length === 0}
              className="py-2 px-2 bg-[#27272a] hover:bg-[#3f3f46] disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <ChefHat className="w-3.5 h-3.5 text-zinc-400" />
              <span>Print KOT</span>
            </button>

            {/* Save Bill */}
            <button
              type="button"
              onClick={() => handleCheckout(false, true, false)}
              disabled={cart.length === 0}
              className="py-2 px-2 bg-[#1f1f23] border border-[#2e2e33] hover:bg-[#27272a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-zinc-400" />
              <span>Save Bill</span>
            </button>

            {/* Complete & Print */}
            <button
              type="button"
              onClick={() => handleCheckout(true, true, settings.enableAutoPrintKOT)}
              disabled={cart.length === 0}
              className="py-2 px-2 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Complete & Print</span>
            </button>
          </div>

          {/* Clear Cart */}
          {cart.length > 0 && (
            <div className="text-center">
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Current Cart</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pizza Size Selection Modal */}
      {activePizzaItem && (
        <PizzaSizeModal
          item={activePizzaItem}
          extrasList={extrasList}
          onClose={() => setActivePizzaItem(null)}
          onAddToCart={handleAddPizzaToCart}
        />
      )}

      {/* Deal Flavor Selection Modal */}
      {activeDealItem && (
        <DealPickerModal
          deal={activeDealItem}
          menuItems={menuItems}
          role={role}
          onClose={() => setActiveDealItem(null)}
          onConfirmDealPrice={onUpdateDealPrice}
          onAddToCart={handleAddDealToCart}
        />
      )}
    </div>
  );
};

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'KITCHEN'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'CREDIT_UDHAAR'
  | 'MIXED';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'CREDIT_UDHAAR';

export type UserRole = 'ADMIN' | 'CASHIER';

export type PizzaSize = 'Small' | 'Medium' | 'Large';

export interface PizzaSizePrices {
  Small: number;
  Medium: number;
  Large: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  isPizza?: boolean;
  prices?: PizzaSizePrices; // For pizzas
  price?: number; // For non-pizza items
  image?: string;
  enabled: boolean;
  stockItemId?: string;
  description?: string;
}

export interface DealIngredient {
  productName: string;
  quantity: number;
  size?: PizzaSize;
  notes?: string;
  selectedFlavor?: string; // If item is generic pizza (e.g. Medium Pizza)
}

export interface DealItem {
  id: string;
  dealNumber: number;
  name: string;
  price: number;
  isPriceConfirmed: boolean; // false for Deal 18 initially
  ingredients: DealIngredient[];
  enabled: boolean;
  image?: string;
  description?: string;
}

export interface ExtraTopping {
  id: string;
  name: string;
  price: number;
  sizePrices?: { Small: number; Medium: number; Large: number };
}

export interface CartItem {
  cartItemId: string; // unique for this cart entry
  itemId: string;
  name: string;
  category: string;
  size?: PizzaSize;
  unitPrice: number;
  quantity: number;
  isDeal?: boolean;
  dealNumber?: number;
  dealIngredients?: DealIngredient[];
  selectedPizzaFlavor?: string;
  extras?: { name: string; price: number }[];
  itemNotes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  balance: number; // outstanding udhaar balance
  totalPurchases: number;
  totalPaid: number;
  createdAt: string;
}

export interface UdhaarPayment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  orderNumber?: string;
  notes?: string;
  receivedBy: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-1001
  billNumber: string; // e.g. BIL-1001
  kotNumber: string; // e.g. KOT-1001
  orderType: OrderType;
  status: OrderStatus;
  tableNumber?: string;
  customer?: {
    id?: string;
    name: string;
    phone: string;
    address?: string;
  };
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType: 'FIXED' | 'PERCENT';
  discountAmount: number;
  deliveryCharges: number;
  extraCharges: number; // Extra Rs. field
  grandTotal: number;
  receivedAmount: number;
  remainingAmount: number;
  changeReturn: number;
  paymentMethod: PaymentMethod;
  mixedPayments?: {
    cash?: number;
    card?: number;
    bankTransfer?: number;
    credit?: number;
  };
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cashierName: string;
  notes?: string;
  kotPrintedCount: number;
  billPrintedCount: number;
}

export interface RestaurantTable {
  id: string;
  number: string;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILL_REQUESTED';
  currentOrderId?: string;
  currentOrderNumber?: string;
  occupiedSince?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  costPerUnit: number;
  category: string;
  lastUpdated: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  recordedBy: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  location: string;
  phones: string[];
  footerMessage: string;
  receiptWidth: '80mm' | '55mm';
  defaultPrinter: string;
  kotPrinter: string;
  enableAutoPrintReceipt: boolean;
  enableAutoPrintKOT: boolean;
  showKOTPaymentInfo: boolean;
  currencySymbol: string;
  minOrderDelivery: number;
  defaultDeliveryFee: number;
  adminPin: string;
  cashierPin: string;
  logoUrl?: string;
  deal18ConfirmedPrice?: number;
}

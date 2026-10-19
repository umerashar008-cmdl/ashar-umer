import { CartItem } from '../types/pos';

export interface CalculationInput {
  items: CartItem[];
  discount: number;
  discountType: 'FIXED' | 'PERCENT';
  deliveryCharges: number;
  extraCharges: number; // Extra Rs. field
  receivedAmount: number;
}

export interface CalculationResult {
  subtotal: number;
  discountAmount: number;
  deliveryCharges: number;
  extraCharges: number;
  grandTotal: number;
  receivedAmount: number;
  remainingAmount: number;
  changeReturn: number;
  isValid: boolean;
  errors: string[];
}

export function calculateOrderTotals(input: CalculationInput): CalculationResult {
  const errors: string[] = [];

  // 1. Calculate subtotal
  let subtotal = 0;
  for (const item of input.items) {
    if (item.quantity <= 0) {
      errors.push(`Item "${item.name}" has invalid quantity ${item.quantity}`);
    }
    if (item.unitPrice < 0) {
      errors.push(`Item "${item.name}" has invalid unit price ${item.unitPrice}`);
    }
    const itemTotal = Math.max(0, item.unitPrice) * Math.max(0, item.quantity);
    subtotal += itemTotal;
  }

  // 2. Normalize and validate delivery and extra charges
  const deliveryCharges = Math.max(0, Number(input.deliveryCharges) || 0);
  const extraCharges = Math.max(0, Number(input.extraCharges) || 0);

  // 3. Calculate discount amount
  let discountAmount = 0;
  const rawDiscount = Math.max(0, Number(input.discount) || 0);
  if (input.discountType === 'PERCENT') {
    const percent = Math.min(100, rawDiscount);
    discountAmount = Math.round((subtotal * percent) / 100);
  } else {
    // Fixed amount cannot exceed subtotal
    discountAmount = Math.min(subtotal, rawDiscount);
  }

  // 4. Grand Total = Subtotal + Delivery Charges + Extra Rs. - Discount
  const grandTotal = Math.max(0, subtotal + deliveryCharges + extraCharges - discountAmount);

  // 5. Received Amount and Remaining/Change
  const receivedAmount = Math.max(0, Number(input.receivedAmount) || 0);
  const remainingAmount = Math.max(0, grandTotal - receivedAmount);
  const changeReturn = Math.max(0, receivedAmount - grandTotal);

  return {
    subtotal,
    discountAmount,
    deliveryCharges,
    extraCharges,
    grandTotal,
    receivedAmount,
    remainingAmount,
    changeReturn,
    isValid: errors.length === 0,
    errors,
  };
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `Rs. ${rounded.toLocaleString()}`;
}

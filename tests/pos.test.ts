/**
 * Automated Verification Test Suite for DUBAI PIZZA SHOP POS
 * Tests core financial calculations, menu catalog integrity, deal 1-26 verification,
 * KOT deal component expansion, and thermal receipt layouts.
 */

import { INITIAL_MENU_ITEMS, INITIAL_DEALS, INITIAL_EXTRAS } from '../src/data/initialData';
import { calculateOrderTotals, formatCurrency } from '../src/services/calculator';
import { generateReceiptHtml, generateKotHtml } from '../src/services/printer';
import { INITIAL_SHOP_SETTINGS } from '../src/data/initialData';
import { Order, CartItem } from '../src/types/pos';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    testsFailed++;
  }
}

console.log('=== STARTING AUTOMATED TEST SUITE: DUBAI PIZZA SHOP POS ===\n');

// 1. Menu Catalog Integrity (41 items)
assert(INITIAL_MENU_ITEMS.length === 41, 'Menu contains exactly 41 items');

// 2. Pizza items check (13 pizzas with exact prices)
const specialDubai = INITIAL_MENU_ITEMS.find((m) => m.name === 'Special Dubai Pizza');
assert(!!specialDubai && specialDubai.isPizza === true, 'Special Dubai Pizza exists');
assert(specialDubai?.prices?.Small === 699, 'Special Dubai Pizza Small is Rs. 699');
assert(specialDubai?.prices?.Medium === 1299, 'Special Dubai Pizza Medium is Rs. 1299');
assert(specialDubai?.prices?.Large === 1899, 'Special Dubai Pizza Large is Rs. 1899');

const chickenTikka = INITIAL_MENU_ITEMS.find((m) => m.name === 'Chicken Tikka Pizza');
assert(chickenTikka?.prices?.Small === 599, 'Chicken Tikka Pizza Small is Rs. 599');
assert(chickenTikka?.prices?.Medium === 1099, 'Chicken Tikka Pizza Medium is Rs. 1099');
assert(chickenTikka?.prices?.Large === 1599, 'Chicken Tikka Pizza Large is Rs. 1599');

// 3. Burgers exact pricing
const zingerBurger = INITIAL_MENU_ITEMS.find((m) => m.name === 'Zinger Burger');
assert(zingerBurger?.price === 280, 'Zinger Burger price is Rs. 280');
const towerBurger = INITIAL_MENU_ITEMS.find((m) => m.name === 'Tower Burger');
assert(towerBurger?.price === 499, 'Tower Burger price is Rs. 499');

// 4. Deals Verification (All 26 Deals)
assert(INITIAL_DEALS.length === 26, 'Catalog contains all 26 Deals');

const deal1 = INITIAL_DEALS.find((d) => d.dealNumber === 1);
assert(deal1?.price === 520, 'Deal 1 price is Rs. 520');
assert(deal1?.ingredients.length === 3, 'Deal 1 has 3 items (1x Zinger, 1x Regular Fries, 1x NR Drink)');

const deal13 = INITIAL_DEALS.find((d) => d.dealNumber === 13);
assert(deal13?.price === 4599, 'Deal 13 price is Rs. 4599');

const deal18 = INITIAL_DEALS.find((d) => d.dealNumber === 18);
assert(deal18?.price === 0, 'Deal 18 original recorded price is Rs. 0');
assert(deal18?.isPriceConfirmed === false, 'Deal 18 requires admin price confirmation (flagged false)');

const deal26 = INITIAL_DEALS.find((d) => d.dealNumber === 26);
assert(deal26?.price === 5949, 'Deal 26 price is Rs. 5949');

// 5. Central Calculation Engine
// Subtotal = item price * qty
// Grand Total = Subtotal + Delivery + Extra Rs - Discount
const testItems: CartItem[] = [
  {
    cartItemId: '1',
    itemId: 'p-special-dubai',
    name: 'Special Dubai Pizza',
    category: 'Pizza',
    size: 'Medium',
    unitPrice: 1299,
    quantity: 2,
  },
  {
    cartItemId: '2',
    itemId: 'b-zinger',
    name: 'Zinger Burger',
    category: 'Burger',
    unitPrice: 280,
    quantity: 3,
  },
];

// Subtotal = 1299*2 (2598) + 280*3 (840) = 3438
const calc1 = calculateOrderTotals({
  items: testItems,
  discount: 200,
  discountType: 'FIXED',
  deliveryCharges: 100,
  extraCharges: 50,
  receivedAmount: 4000,
});

assert(calc1.subtotal === 3438, `Subtotal is calculated correctly (Expected 3438, Got ${calc1.subtotal})`);
assert(calc1.discountAmount === 200, 'Fixed discount is Rs. 200');
assert(calc1.deliveryCharges === 100, 'Delivery charges are Rs. 100');
assert(calc1.extraCharges === 50, 'Extra Rs. charges are Rs. 50');
// Grand Total = 3438 + 100 + 50 - 200 = 3388
assert(calc1.grandTotal === 3388, `Grand Total calculated accurately (Expected 3388, Got ${calc1.grandTotal})`);
// Received = 4000, Remaining = 0, Change = 4000 - 3388 = 612
assert(calc1.remainingAmount === 0, 'Remaining balance is 0 on overpayment');
assert(calc1.changeReturn === 612, `Change Return is 612 (Got ${calc1.changeReturn})`);

// Percentage discount test: 10% on 3438 = 344
const calcPercent = calculateOrderTotals({
  items: testItems,
  discount: 10,
  discountType: 'PERCENT',
  deliveryCharges: 0,
  extraCharges: 0,
  receivedAmount: 3000,
});
assert(calcPercent.discountAmount === 344, `Percentage discount 10% of 3438 is 344 (Got ${calcPercent.discountAmount})`);
// Grand total = 3438 - 344 = 3094
assert(calcPercent.grandTotal === 3094, `Grand total with 10% discount is 3094 (Got ${calcPercent.grandTotal})`);
assert(calcPercent.remainingAmount === 94, `Remaining Udhaar is 94 (Got ${calcPercent.remainingAmount})`);
assert(calcPercent.changeReturn === 0, 'Change return is 0 on partial payment');

// 6. Test Thermal Bill & KOT Generation
const sampleOrder: Order = {
  id: 'ord-test-1',
  orderNumber: 'ORD-1001',
  billNumber: 'BIL-1001',
  kotNumber: 'KOT-1001',
  orderType: 'DINE_IN',
  status: 'CONFIRMED',
  tableNumber: '4',
  items: [
    {
      cartItemId: 'c1',
      itemId: 'deal-1',
      name: 'Deal 1',
      category: 'Deals',
      unitPrice: 520,
      quantity: 1,
      isDeal: true,
      dealIngredients: [
        { productName: 'Zinger Burger', quantity: 1 },
        { productName: 'Regular Fries', quantity: 1 },
        { productName: 'NR Drink', quantity: 1 },
      ],
    },
  ],
  subtotal: 520,
  discount: 0,
  discountType: 'FIXED',
  discountAmount: 0,
  deliveryCharges: 0,
  extraCharges: 0,
  grandTotal: 520,
  receivedAmount: 520,
  remainingAmount: 0,
  changeReturn: 0,
  paymentMethod: 'CASH',
  paymentStatus: 'PAID',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  cashierName: 'Staff',
  kotPrintedCount: 1,
  billPrintedCount: 1,
};

const receiptHtml = generateReceiptHtml(sampleOrder, INITIAL_SHOP_SETTINGS, { width: '80mm' });
assert(receiptHtml.includes('DUBAI PIZZA SHOP'), 'Thermal receipt includes Shop Name');
assert(receiptHtml.includes('BIL-1001'), 'Thermal receipt includes Bill number');
assert(receiptHtml.includes('0342-2562389'), 'Thermal receipt includes phone number');
assert(receiptHtml.includes('Thank You • Visit Again'), 'Thermal receipt includes footer message');

const kotHtml = generateKotHtml(sampleOrder, INITIAL_SHOP_SETTINGS, { width: '80mm' });
assert(kotHtml.includes('KITCHEN ORDER TICKET'), 'KOT contains KOT header');
assert(kotHtml.includes('KOT-1001'), 'KOT contains KOT number');
assert(kotHtml.includes('Zinger Burger') && kotHtml.includes('Regular Fries'), 'KOT expands deal component ingredients for kitchen staff');

console.log(`\n=== TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED ===`);
if (testsFailed > 0) {
  process.exit(1);
}

import {
  MenuItem,
  DealItem,
  Order,
  Customer,
  UdhaarPayment,
  RestaurantTable,
  InventoryItem,
  ExpenseRecord,
  ShopSettings,
  ExtraTopping,
  OrderStatus,
} from '../types/pos';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_DEALS,
  INITIAL_TABLES,
  INITIAL_INVENTORY,
  INITIAL_SHOP_SETTINGS,
  INITIAL_EXTRAS,
} from '../data/initialData';

const STORAGE_KEYS = {
  MENU: 'dubai_pos_menu_v2',
  DEALS: 'dubai_pos_deals_v2',
  ORDERS: 'dubai_pos_orders_v2',
  CUSTOMERS: 'dubai_pos_customers_v2',
  PAYMENTS: 'dubai_pos_payments_v2',
  TABLES: 'dubai_pos_tables_v2',
  INVENTORY: 'dubai_pos_inventory_v2',
  EXPENSES: 'dubai_pos_expenses_v2',
  SETTINGS: 'dubai_pos_settings_v2',
  EXTRAS: 'dubai_pos_extras_v2',
  COUNTERS: 'dubai_pos_counters_v2',
  SAFETY_BACKUP: 'dubai_pos_safety_backup_v2',
};

export interface POSDatabase {
  menu: MenuItem[];
  deals: DealItem[];
  orders: Order[];
  customers: Customer[];
  payments: UdhaarPayment[];
  tables: RestaurantTable[];
  inventory: InventoryItem[];
  expenses: ExpenseRecord[];
  settings: ShopSettings;
  extras: ExtraTopping[];
  counters: {
    orderSeq: number;
    billSeq: number;
    kotSeq: number;
  };
  version: string;
  exportedAt?: string;
}

class StorageService {
  private inMemoryCache: POSDatabase | null = null;

  constructor() {
    this.initDatabase();
  }

  public initDatabase(): POSDatabase {
    try {
      const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!existingSettings) {
        // First-time initialize with full Dubai Pizza Shop initial dataset
        const initialDb: POSDatabase = {
          menu: INITIAL_MENU_ITEMS,
          deals: INITIAL_DEALS,
          orders: [],
          customers: [],
          payments: [],
          tables: INITIAL_TABLES,
          inventory: INITIAL_INVENTORY,
          expenses: [],
          settings: INITIAL_SHOP_SETTINGS,
          extras: INITIAL_EXTRAS,
          counters: { orderSeq: 1000, billSeq: 1000, kotSeq: 1000 },
          version: '2.0.0',
        };
        this.saveAll(initialDb);
        this.inMemoryCache = initialDb;
        return initialDb;
      }

      // Load existing records
      const db: POSDatabase = {
        menu: this.loadJson(STORAGE_KEYS.MENU, INITIAL_MENU_ITEMS),
        deals: this.loadJson(STORAGE_KEYS.DEALS, INITIAL_DEALS),
        orders: this.loadJson(STORAGE_KEYS.ORDERS, []),
        customers: this.loadJson(STORAGE_KEYS.CUSTOMERS, []),
        payments: this.loadJson(STORAGE_KEYS.PAYMENTS, []),
        tables: this.loadJson(STORAGE_KEYS.TABLES, INITIAL_TABLES),
        inventory: this.loadJson(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY),
        expenses: this.loadJson(STORAGE_KEYS.EXPENSES, []),
        settings: this.loadJson(STORAGE_KEYS.SETTINGS, INITIAL_SHOP_SETTINGS),
        extras: this.loadJson(STORAGE_KEYS.EXTRAS, INITIAL_EXTRAS),
        counters: this.loadJson(STORAGE_KEYS.COUNTERS, { orderSeq: 1000, billSeq: 1000, kotSeq: 1000 }),
        version: '2.0.0',
      };
      this.inMemoryCache = db;
      return db;
    } catch (e) {
      console.error('Failed to initialize local database:', e);
      const fallback: POSDatabase = {
        menu: INITIAL_MENU_ITEMS,
        deals: INITIAL_DEALS,
        orders: [],
        customers: [],
        payments: [],
        tables: INITIAL_TABLES,
        inventory: INITIAL_INVENTORY,
        expenses: [],
        settings: INITIAL_SHOP_SETTINGS,
        extras: INITIAL_EXTRAS,
        counters: { orderSeq: 1000, billSeq: 1000, kotSeq: 1000 },
        version: '2.0.0',
      };
      this.inMemoryCache = fallback;
      return fallback;
    }
  }

  private loadJson<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  public getDatabase(): POSDatabase {
    if (!this.inMemoryCache) {
      return this.initDatabase();
    }
    return this.inMemoryCache;
  }

  public saveAll(db: POSDatabase): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(db.menu));
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(db.deals));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(db.orders));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(db.customers));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(db.payments));
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(db.tables));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(db.inventory));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(db.expenses));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(db.settings));
      localStorage.setItem(STORAGE_KEYS.EXTRAS, JSON.stringify(db.extras));
      localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(db.counters));
      this.inMemoryCache = db;
    } catch (e) {
      console.error('Storage write error:', e);
      throw new Error('Local disk storage quota exceeded or storage unavailable.');
    }
  }

  // Generate next unique sequence numbers safely
  public generateNextNumbers(): { orderNumber: string; billNumber: string; kotNumber: string } {
    const db = this.getDatabase();
    db.counters.orderSeq += 1;
    db.counters.billSeq += 1;
    db.counters.kotSeq += 1;

    const orderNumber = `ORD-${db.counters.orderSeq}`;
    const billNumber = `BIL-${db.counters.billSeq}`;
    const kotNumber = `KOT-${db.counters.kotSeq}`;

    localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(db.counters));
    return { orderNumber, billNumber, kotNumber };
  }

  // Transactionally save or update an order
  public saveOrder(order: Order): Order {
    const db = this.getDatabase();
    // Safety backup of existing state
    this.createSafetySnapshot();

    const existingIndex = db.orders.findIndex((o) => o.id === order.id || o.orderNumber === order.orderNumber);
    if (existingIndex >= 0) {
      db.orders[existingIndex] = { ...order, updatedAt: new Date().toISOString() };
    } else {
      db.orders.unshift(order);
    }

    // Update customer credit/udhar balance if order has remaining amount or credit
    if (order.customer && order.customer.name) {
      let cust = db.customers.find(
        (c) => c.phone === order.customer?.phone || (c.name.toLowerCase() === order.customer?.name.toLowerCase() && c.phone)
      );
      if (!cust) {
        cust = {
          id: `cust-${Date.now()}`,
          name: order.customer.name,
          phone: order.customer.phone || '',
          address: order.customer.address || '',
          balance: 0,
          totalPurchases: 0,
          totalPaid: 0,
          createdAt: new Date().toISOString(),
        };
        db.customers.push(cust);
      }
      cust.totalPurchases += order.grandTotal;
      cust.totalPaid += order.receivedAmount;
      cust.balance = Math.max(0, cust.balance + order.remainingAmount);
      if (order.customer.address) cust.address = order.customer.address;
    }

    // Update restaurant table state if dine-in
    if (order.orderType === 'DINE_IN' && order.tableNumber) {
      const table = db.tables.find((t) => t.number === order.tableNumber);
      if (table) {
        if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
          table.status = 'AVAILABLE';
          table.currentOrderId = undefined;
          table.currentOrderNumber = undefined;
        } else {
          table.status = 'OCCUPIED';
          table.currentOrderId = order.id;
          table.currentOrderNumber = order.orderNumber;
          table.occupiedSince = table.occupiedSince || new Date().toISOString();
        }
      }
    }

    this.saveAll(db);
    return order;
  }

  // Update order status safely
  public updateOrderStatus(orderId: string, status: OrderStatus): void {
    const db = this.getDatabase();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) return;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (status === 'COMPLETED') {
      order.completedAt = new Date().toISOString();
    }

    // Free table if completed or cancelled
    if ((status === 'COMPLETED' || status === 'CANCELLED') && order.tableNumber) {
      const table = db.tables.find((t) => t.number === order.tableNumber);
      if (table && table.currentOrderId === order.id) {
        table.status = 'AVAILABLE';
        table.currentOrderId = undefined;
        table.currentOrderNumber = undefined;
      }
    }

    this.saveAll(db);
  }

  // Record an Udhaar payment
  public recordUdhaarPayment(payment: UdhaarPayment): void {
    const db = this.getDatabase();
    this.createSafetySnapshot();

    db.payments.unshift(payment);

    const cust = db.customers.find((c) => c.id === payment.customerId);
    if (cust) {
      cust.totalPaid += payment.amount;
      cust.balance = Math.max(0, cust.balance - payment.amount);
    }

    this.saveAll(db);
  }

  // Menu item operations
  public saveMenuItem(item: MenuItem): void {
    const db = this.getDatabase();
    const idx = db.menu.findIndex((m) => m.id === item.id);
    if (idx >= 0) {
      db.menu[idx] = item;
    } else {
      db.menu.push(item);
    }
    this.saveAll(db);
  }

  public deleteMenuItem(itemId: string): void {
    const db = this.getDatabase();
    db.menu = db.menu.filter((m) => m.id !== itemId);
    this.saveAll(db);
  }

  // Deals operations
  public saveDeal(deal: DealItem): void {
    const db = this.getDatabase();
    const idx = db.deals.findIndex((d) => d.id === deal.id || d.dealNumber === deal.dealNumber);
    if (idx >= 0) {
      db.deals[idx] = deal;
    } else {
      db.deals.push(deal);
    }
    this.saveAll(db);
  }

  // Settings operations
  public saveSettings(settings: ShopSettings): void {
    const db = this.getDatabase();
    db.settings = settings;
    this.saveAll(db);
  }

  // Expenses operations
  public addExpense(expense: ExpenseRecord): void {
    const db = this.getDatabase();
    db.expenses.unshift(expense);
    this.saveAll(db);
  }

  public deleteExpense(id: string): void {
    const db = this.getDatabase();
    db.expenses = db.expenses.filter((e) => e.id !== id);
    this.saveAll(db);
  }

  // Inventory adjustment
  public updateInventoryItem(item: InventoryItem): void {
    const db = this.getDatabase();
    const idx = db.inventory.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      db.inventory[idx] = { ...item, lastUpdated: new Date().toISOString() };
    } else {
      db.inventory.push({ ...item, lastUpdated: new Date().toISOString() });
    }
    this.saveAll(db);
  }

  // Customer operations
  public saveCustomer(customer: Customer): void {
    const db = this.getDatabase();
    const idx = db.customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      db.customers[idx] = customer;
    } else {
      db.customers.push(customer);
    }
    this.saveAll(db);
  }

  // Table operations
  public saveTable(table: RestaurantTable): void {
    const db = this.getDatabase();
    const idx = db.tables.findIndex((t) => t.id === table.id);
    if (idx >= 0) {
      db.tables[idx] = table;
    } else {
      db.tables.push(table);
    }
    this.saveAll(db);
  }

  // Safety snapshot creation
  public createSafetySnapshot(): void {
    try {
      const current = this.getDatabase();
      localStorage.setItem(STORAGE_KEYS.SAFETY_BACKUP, JSON.stringify(current));
    } catch (e) {
      console.warn('Could not create safety snapshot:', e);
    }
  }

  public restoreSafetySnapshot(): boolean {
    try {
      const snapshot = localStorage.getItem(STORAGE_KEYS.SAFETY_BACKUP);
      if (!snapshot) return false;
      const parsed = JSON.parse(snapshot) as POSDatabase;
      this.saveAll(parsed);
      return true;
    } catch {
      return false;
    }
  }

  // Export full JSON database
  public exportDatabaseJson(): string {
    const db = this.getDatabase();
    const exportPayload: POSDatabase = {
      ...db,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportPayload, null, 2);
  }

  // Import and validate JSON database
  public importDatabaseJson(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString) as Partial<POSDatabase>;

      // Validation
      if (!parsed.menu || !Array.isArray(parsed.menu)) {
        return { success: false, message: 'Invalid backup file: missing menu catalog.' };
      }
      if (!parsed.deals || !Array.isArray(parsed.deals)) {
        return { success: false, message: 'Invalid backup file: missing deals data.' };
      }
      if (!parsed.settings || typeof parsed.settings.shopName !== 'string') {
        return { success: false, message: 'Invalid backup file: missing shop settings.' };
      }

      // Automatically create safety backup before restoration
      this.createSafetySnapshot();

      const restored: POSDatabase = {
        menu: parsed.menu,
        deals: parsed.deals,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        tables: Array.isArray(parsed.tables) ? parsed.tables : INITIAL_TABLES,
        inventory: Array.isArray(parsed.inventory) ? parsed.inventory : INITIAL_INVENTORY,
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        settings: { ...INITIAL_SHOP_SETTINGS, ...parsed.settings },
        extras: Array.isArray(parsed.extras) ? parsed.extras : INITIAL_EXTRAS,
        counters: parsed.counters || { orderSeq: 1000, billSeq: 1000, kotSeq: 1000 },
        version: parsed.version || '2.0.0',
      };

      this.saveAll(restored);
      return { success: true, message: `Successfully restored database with ${restored.menu.length} menu items, ${restored.deals.length} deals, and ${restored.orders.length} orders.` };
    } catch (e: any) {
      return { success: false, message: `Failed to import file: ${e.message || 'Syntax error'}` };
    }
  }
}

export const storage = new StorageService();

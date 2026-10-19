import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  UserRole,
  OrderStatus,
} from './types/pos';
import { storage } from './services/storage';
import { printThermalDocument, generateReceiptHtml, generateKotHtml } from './services/printer';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { PinModal } from './components/common/PinModal';
import { BillingPOS } from './components/pos/BillingPOS';
import { CurrentOrders } from './components/orders/CurrentOrders';
import { KitchenOrders } from './components/kot/KitchenOrders';
import { TableManagement } from './components/tables/TableManagement';
import { MenuManager } from './components/menu/MenuManager';
import { DealsManager } from './components/deals/DealsManager';
import { CustomerUdhaar } from './components/customers/CustomerUdhaar';
import { InventoryManager } from './components/inventory/InventoryManager';
import { ExpenseManager } from './components/expenses/ExpenseManager';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsManager } from './components/settings/SettingsManager';
import { DesktopInstallerModal } from './components/desktop/DesktopInstallerModal';
import { ThermalReceiptModal } from './components/print/ThermalReceiptModal';

export default function App() {
  // Database state
  const [db, setDb] = useState(() => storage.getDatabase());
  const [activeTab, setActiveTab] = useState<NavTab>('pos');
  const [role, setRole] = useState<UserRole>('ADMIN');

  // Modals state
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [receiptModalType, setReceiptModalType] = useState<'BILL' | 'KOT'>('BILL');

  // Sync state helper
  const refreshDb = useCallback(() => {
    setDb({ ...storage.getDatabase() });
  }, []);

  // Today's metrics
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayOrders = useMemo(() => {
    return db.orders.filter((o) => o.createdAt.startsWith(todayStr) && o.status !== 'CANCELLED');
  }, [db.orders, todayStr]);

  const todaySales = useMemo(() => {
    return todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  }, [todayOrders]);

  const pendingOrdersCount = useMemo(() => {
    return db.orders.filter(
      (o) => !['COMPLETED', 'CANCELLED'].includes(o.status)
    ).length;
  }, [db.orders]);

  const lowStockCount = useMemo(() => {
    return db.inventory.filter((i) => i.currentStock <= i.minStockLevel).length;
  }, [db.inventory]);

  const deal18 = db.deals.find((d) => d.dealNumber === 18);
  const deal18Unconfirmed = !deal18 || !deal18.isPriceConfirmed || deal18.price <= 0;

  // Keyboard shortcuts (F1: POS, F2: Orders, F3: Tables, F4: KOT, Esc: Close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('orders');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('tables');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('kot');
      } else if (e.key === 'Escape') {
        setShowPinModal(false);
        setShowDesktopModal(false);
        setActiveReceiptOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Order Handlers
  const handleSaveOrder = (order: Order, printReceipt: boolean, printKot: boolean) => {
    storage.saveOrder(order);
    refreshDb();

    // Thermal auto-print or modal display
    if (printReceipt) {
      const html = generateReceiptHtml(order, db.settings, {
        width: db.settings.receiptWidth,
      });
      printThermalDocument(html);
    }

    if (printKot) {
      const kotHtml = generateKotHtml(order, db.settings, {
        width: db.settings.receiptWidth,
      });
      printThermalDocument(kotHtml);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    storage.updateOrderStatus(orderId, status);
    refreshDb();
  };

  const handleReprintBill = (order: Order) => {
    setActiveReceiptOrder(order);
    setReceiptModalType('BILL');
  };

  const handleReprintKot = (order: Order) => {
    setActiveReceiptOrder(order);
    setReceiptModalType('KOT');
  };

  const handleReprintLastBill = () => {
    if (db.orders.length === 0) {
      alert('No previous orders found to reprint.');
      return;
    }
    const last = db.orders[0];
    handleReprintBill(last);
  };

  // Table Handlers
  const handleSelectTableForOrder = (tblNum: string) => {
    setActiveTab('pos');
  };

  const handleUpdateTableStatus = (
    tableId: string,
    status: 'AVAILABLE' | 'OCCUPIED' | 'BILL_REQUESTED'
  ) => {
    const tbl = db.tables.find((t) => t.id === tableId);
    if (tbl) {
      storage.saveTable({ ...tbl, status });
      refreshDb();
    }
  };

  const handleTransferTable = (fromTableNumber: string, toTableNumber: string) => {
    const fromOrder = db.orders.find(
      (o) =>
        o.tableNumber === fromTableNumber &&
        o.orderType === 'DINE_IN' &&
        o.status !== 'COMPLETED' &&
        o.status !== 'CANCELLED'
    );
    if (!fromOrder) return;

    // Update order with new table
    const updatedOrder: Order = {
      ...fromOrder,
      tableNumber: toTableNumber,
      updatedAt: new Date().toISOString(),
    };
    storage.saveOrder(updatedOrder);

    // Free old table and occupy new
    const oldTbl = db.tables.find((t) => t.number === fromTableNumber);
    const newTbl = db.tables.find((t) => t.number === toTableNumber);
    if (oldTbl) {
      oldTbl.status = 'AVAILABLE';
      oldTbl.currentOrderId = undefined;
      oldTbl.currentOrderNumber = undefined;
      storage.saveTable(oldTbl);
    }
    if (newTbl) {
      newTbl.status = 'OCCUPIED';
      newTbl.currentOrderId = updatedOrder.id;
      newTbl.currentOrderNumber = updatedOrder.orderNumber;
      storage.saveTable(newTbl);
    }
    refreshDb();
  };

  const handleAddTable = (tbl: RestaurantTable) => {
    storage.saveTable(tbl);
    refreshDb();
  };

  // Menu Handlers
  const handleSaveMenuItem = (item: MenuItem) => {
    storage.saveMenuItem(item);
    refreshDb();
  };

  const handleDeleteMenuItem = (itemId: string) => {
    storage.deleteMenuItem(itemId);
    refreshDb();
  };

  // Deals Handlers
  const handleSaveDeal = (deal: DealItem) => {
    storage.saveDeal(deal);
    refreshDb();
  };

  const handleUpdateDealPrice = (dealId: string, price: number) => {
    const deal = db.deals.find((d) => d.id === dealId);
    if (deal) {
      storage.saveDeal({
        ...deal,
        price,
        isPriceConfirmed: true,
      });
      refreshDb();
    }
  };

  // Customers & Udhaar Handlers
  const handleSaveCustomer = (cust: Customer) => {
    storage.saveCustomer(cust);
    refreshDb();
  };

  const handleRecordUdhaarPayment = (payment: UdhaarPayment) => {
    storage.recordUdhaarPayment(payment);
    refreshDb();
  };

  const handlePrintPaymentReceipt = (payment: UdhaarPayment, customer: Customer) => {
    const voucherHtml = `
      <div style="width: 290px; margin: 0 auto; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; text-align: left;">
        <div style="text-align: center; margin-bottom: 6px;">
          <div style="font-size: 15px; font-weight: bold;">${db.settings.shopName}</div>
          <div style="font-size: 10px;">${db.settings.location} · Tel: ${db.settings.phones.join(', ')}</div>
          <div style="font-weight: bold; border: 1px solid #000; padding: 2px; margin-top: 4px;">
            *** UDHAAR PAYMENT RECEIPT ***
          </div>
        </div>
        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
        <div><strong>Receipt #:</strong> ${payment.id}</div>
        <div><strong>Date:</strong> ${new Date(payment.date).toLocaleString('en-PK')}</div>
        <div><strong>Customer:</strong> ${customer.name} (${customer.phone || 'No phone'})</div>
        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
        <div style="font-size: 14px; font-weight: bold;">
          Amount Paid: Rs. ${payment.amount.toLocaleString()}
        </div>
        <div>Payment Method: ${payment.paymentMethod}</div>
        <div style="border-top: 1px solid #000; margin-top: 6px; padding-top: 4px;">
          <strong>Remaining Balance:</strong> Rs. ${customer.balance.toLocaleString()}
        </div>
        ${payment.notes ? `<div>Note: ${payment.notes}</div>` : ''}
        <div style="text-align: center; margin-top: 8px; font-size: 10px;">
          Thank You · Dubai Pizza Shop
        </div>
      </div>
    `;
    printThermalDocument(voucherHtml);
  };

  // Inventory Handlers
  const handleUpdateInventory = (item: InventoryItem) => {
    storage.updateInventoryItem(item);
    refreshDb();
  };

  // Expense Handlers
  const handleAddExpense = (exp: ExpenseRecord) => {
    storage.addExpense(exp);
    refreshDb();
  };

  const handleDeleteExpense = (id: string) => {
    storage.deleteExpense(id);
    refreshDb();
  };

  // Settings & Backup Handlers
  const handleSaveSettings = (settings: ShopSettings) => {
    storage.saveSettings(settings);
    refreshDb();
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DubaiPizzaShop_Backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (fileContent: string) => {
    const result = storage.importDatabaseJson(fileContent);
    alert(result.message);
    if (result.success) {
      refreshDb();
    }
  };

  const handleRestoreSafetySnapshot = () => {
    const success = storage.restoreSafetySnapshot();
    if (success) {
      alert('Safety backup restored successfully.');
      refreshDb();
    } else {
      alert('No safety snapshot found.');
    }
  };

  // Role switching with PIN
  const targetRole = role === 'ADMIN' ? 'CASHIER' : 'ADMIN';
  const targetPin = targetRole === 'ADMIN' ? db.settings.adminPin : db.settings.cashierPin;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f0f11] text-[#f4f4f5] overflow-hidden select-none">
      {/* Top Bar Contract (Wordmark - Stats/Clock - Role/Fullscreen) */}
      <Header
        shopName={db.settings.shopName}
        role={role}
        onToggleRole={() => setShowPinModal(true)}
        todaySales={todaySales}
        todayOrdersCount={todayOrders.length}
        onOpenDesktopModal={() => setShowDesktopModal(true)}
        onReprintLast={handleReprintLastBill}
      />

      {/* Main Workspace: Sidebar Navigation + Active Screen */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          role={role}
          pendingOrdersCount={pendingOrdersCount}
          deal18Unconfirmed={deal18Unconfirmed}
          lowStockCount={lowStockCount}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'pos' && (
            <BillingPOS
              menuItems={db.menu}
              deals={db.deals}
              tables={db.tables}
              extrasList={db.extras}
              settings={db.settings}
              role={role}
              onSaveOrder={handleSaveOrder}
              onUpdateDealPrice={handleUpdateDealPrice}
            />
          )}

          {activeTab === 'orders' && (
            <CurrentOrders
              orders={db.orders}
              settings={db.settings}
              onUpdateStatus={handleUpdateOrderStatus}
              onReprintBill={handleReprintBill}
              onReprintKot={handleReprintKot}
            />
          )}

          {activeTab === 'tables' && (
            <TableManagement
              tables={db.tables}
              orders={db.orders}
              onSelectTableForOrder={handleSelectTableForOrder}
              onUpdateTableStatus={handleUpdateTableStatus}
              onTransferTable={handleTransferTable}
              onAddTable={handleAddTable}
            />
          )}

          {activeTab === 'kot' && (
            <KitchenOrders
              orders={db.orders}
              onUpdateStatus={handleUpdateOrderStatus}
              onReprintKot={handleReprintKot}
            />
          )}

          {activeTab === 'menu' && (
            <MenuManager
              menuItems={db.menu}
              extrasList={db.extras}
              onSaveItem={handleSaveMenuItem}
              onDeleteItem={handleDeleteMenuItem}
              onSaveExtra={(extra) => {
                const idx = db.extras.findIndex((e) => e.id === extra.id);
                if (idx >= 0) db.extras[idx] = extra;
                else db.extras.push(extra);
                storage.saveAll(db);
                refreshDb();
              }}
              onDeleteExtra={(extraId) => {
                db.extras = db.extras.filter((e) => e.id !== extraId);
                storage.saveAll(db);
                refreshDb();
              }}
            />
          )}

          {activeTab === 'deals' && (
            <DealsManager
              deals={db.deals}
              menuItems={db.menu}
              onSaveDeal={handleSaveDeal}
            />
          )}

          {activeTab === 'udhaar' && (
            <CustomerUdhaar
              customers={db.customers}
              payments={db.payments}
              settings={db.settings}
              onSaveCustomer={handleSaveCustomer}
              onRecordPayment={handleRecordUdhaarPayment}
              onPrintPaymentReceipt={handlePrintPaymentReceipt}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManager
              inventory={db.inventory}
              onUpdateItem={handleUpdateInventory}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseManager
              expenses={db.expenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              orders={db.orders}
              expenses={db.expenses}
              settings={db.settings}
            />
          )}

          {activeTab === 'backup' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-4">
                <h2 className="text-lg font-bold text-white">Database Backup &amp; Restore</h2>
                <p className="text-xs text-zinc-400">
                  Export complete verified database containing all 41 menu items, 26 deals, past orders, customer ledger, and expenses.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleExportBackup}
                    className="p-4 bg-[#18181b] border border-[#27272a] hover:border-[#d97706] rounded-xl text-left transition-all"
                  >
                    <div className="font-bold text-white text-sm mb-1">Export Full Backup</div>
                    <div className="text-xs text-zinc-400">
                      Download complete database as a portable JSON file
                    </div>
                  </button>
                  <label className="p-4 bg-[#18181b] border border-[#27272a] hover:border-[#fbbf24] rounded-xl text-left transition-all cursor-pointer">
                    <div className="font-bold text-white text-sm mb-1">Restore from Backup</div>
                    <div className="text-xs text-zinc-400">
                      Upload an existing backup file to restore records
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              handleImportBackup(ev.target.result as string);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsManager
              settings={db.settings}
              onSaveSettings={handleSaveSettings}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onRestoreSafetySnapshot={handleRestoreSafetySnapshot}
              onOpenDesktopModal={() => setShowDesktopModal(true)}
            />
          )}
        </main>
      </div>

      {/* Role PIN Security Modal */}
      {showPinModal && (
        <PinModal
          targetRole={targetRole}
          correctPin={targetPin}
          onSuccess={() => {
            setRole(targetRole);
            setShowPinModal(false);
          }}
          onClose={() => setShowPinModal(false)}
        />
      )}

      {/* Windows Desktop App Modal */}
      {showDesktopModal && (
        <DesktopInstallerModal onClose={() => setShowDesktopModal(false)} />
      )}

      {/* Thermal Receipt & KOT Preview Modal */}
      {activeReceiptOrder && (
        <ThermalReceiptModal
          order={activeReceiptOrder}
          settings={db.settings}
          initialType={receiptModalType}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}
    </div>
  );
}

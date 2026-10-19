import React, { useState, useMemo } from 'react';
import { Customer, UdhaarPayment, PaymentMethod, ShopSettings } from '../../types/pos';
import { formatCurrency } from '../../services/calculator';
import {
  Users,
  Search,
  Plus,
  ArrowDownLeft,
  Printer,
  Phone,
  MapPin,
  Calendar,
  X,
  CreditCard,
  CheckCircle,
} from 'lucide-react';

interface CustomerUdhaarProps {
  customers: Customer[];
  payments: UdhaarPayment[];
  settings: ShopSettings;
  onSaveCustomer: (customer: Customer) => void;
  onRecordPayment: (payment: UdhaarPayment) => void;
  onPrintPaymentReceipt: (payment: UdhaarPayment, customer: Customer) => void;
}

export const CustomerUdhaar: React.FC<CustomerUdhaarProps> = ({
  customers,
  payments,
  settings,
  onSaveCustomer,
  onRecordPayment,
  onPrintPaymentReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUdhaarOnly, setFilterUdhaarOnly] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form states
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (filterUdhaarOnly && c.balance <= 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.address && c.address.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [customers, filterUdhaarOnly, searchQuery]);

  const customerPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    return payments.filter((p) => p.customerId === selectedCustomer.id);
  }, [payments, selectedCustomer]);

  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  }, [customers]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim() || undefined,
      notes: newCustNotes.trim() || undefined,
      balance: 0,
      totalPurchases: 0,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
    };

    onSaveCustomer(newCust);
    setSelectedCustomer(newCust);
    setShowAddCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustNotes('');
  };

  const handleReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;

    const payment: UdhaarPayment = {
      id: `pay-${Date.now()}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      amount: amt,
      paymentMethod,
      date: new Date().toISOString(),
      notes: paymentNotes.trim() || undefined,
      receivedBy: 'Admin / Cashier',
    };

    onRecordPayment(payment);
    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentNotes('');

    // Trigger payment receipt print
    onPrintPaymentReceipt(payment, selectedCustomer);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* LEFT: Customers & Udhaar List */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-[#27272a]">
        {/* Top Header */}
        <div className="p-3.5 bg-[#141417] border-b border-[#27272a] space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d97706]" />
                <span>Customers & Udhaar Ledger</span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Track customer credit, outstanding debts, and payment receipts
              </p>
            </div>

            <button
              onClick={() => setShowAddCustomer(true)}
              className="px-3 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Customer</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center justify-between p-2.5 bg-[#18181b] rounded-lg border border-[#27272a] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Total Outstanding Udhaar:</span>
              <span className="font-mono font-bold text-sm text-red-400 tabular-nums">
                {formatCurrency(totalOutstanding)}
              </span>
            </div>

            <button
              onClick={() => setFilterUdhaarOnly(!filterUdhaarOnly)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                filterUdhaarOnly
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-[#27272a] text-zinc-300 hover:text-white'
              }`}
            >
              {filterUdhaarOnly ? 'Showing Udhaar Balances Only' : 'Filter Outstanding Udhaar'}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer by name, phone, or address..."
              className="w-full bg-[#1b1b1f] border border-[#2e2e33] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#d97706]"
            />
          </div>
        </div>

        {/* Customer Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredCustomers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-500">
              <Users className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-xs font-medium">No customers found</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              const hasDebt = cust.balance > 0;

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1f1f23] border-[#d97706] shadow-md'
                      : 'bg-[#18181b] border-[#27272a] hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-white">{cust.name}</span>
                    <span
                      className={`text-xs font-mono font-black tabular-nums px-2 py-0.5 rounded border ${
                        hasDebt
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {hasDebt ? `Udhaar: ${formatCurrency(cust.balance)}` : 'Cleared (Rs. 0)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-3">
                      {cust.phone && (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {cust.phone}
                        </span>
                      )}
                      {cust.address && (
                        <span className="flex items-center gap-1 text-[11px] line-clamp-1 max-w-[200px]">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                          {cust.address}
                        </span>
                      )}
                    </div>

                    <div className="text-right text-[11px] font-mono text-zinc-500">
                      Total Bought: {formatCurrency(cust.totalPurchases)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Selected Customer Ledger & Receive Money */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-[#141417] flex flex-col justify-between shrink-0 overflow-y-auto p-4 space-y-4">
        {selectedCustomer ? (
          <>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedCustomer.name}</h3>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    {selectedCustomer.phone || 'No phone provided'}
                  </div>
                  {selectedCustomer.address && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {selectedCustomer.address}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-zinc-500">Current Balance</div>
                  <div className="text-lg font-mono font-black text-red-400 tabular-nums">
                    {formatCurrency(selectedCustomer.balance)}
                  </div>
                </div>
              </div>

              {/* Receive Money Action */}
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full mt-3 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Receive Money / Settle Udhaar</span>
              </button>
            </div>

            {/* Financial Ledger Summary */}
            <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Total Lifetime Purchases:</span>
                <span className="font-mono text-white">
                  {formatCurrency(selectedCustomer.totalPurchases)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Received Payments:</span>
                <span className="font-mono text-emerald-400">
                  {formatCurrency(selectedCustomer.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-300 font-bold border-t border-[#27272a] pt-1">
                <span>Outstanding Due:</span>
                <span className="font-mono text-red-400">
                  {formatCurrency(selectedCustomer.balance)}
                </span>
              </div>
            </div>

            {/* Recent Payment History */}
            <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl space-y-2 flex-1">
              <div className="text-xs font-bold text-white border-b border-[#27272a] pb-1 flex items-center justify-between">
                <span>Payment Receipts History</span>
                <span className="text-[10px] font-mono text-zinc-500">
                  ({customerPayments.length} records)
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {customerPayments.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 text-center py-4">
                    No payment history recorded yet
                  </p>
                ) : (
                  customerPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-2 bg-[#121215] border border-[#27272a] rounded-lg text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-emerald-400">
                          +{formatCurrency(pay.amount)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {new Date(pay.date).toLocaleDateString('en-PK')} · {pay.paymentMethod}
                        </div>
                      </div>

                      <button
                        onClick={() => onPrintPaymentReceipt(pay, selectedCustomer)}
                        title="Print payment voucher receipt"
                        className="p-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 rounded"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500">
            <Users className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs font-semibold text-zinc-400">Select customer</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              Click any customer on the left to view ledger, payment history, and record cash receipts
            </p>
          </div>
        )}
      </div>

      {/* New Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
              <h3 className="text-base font-bold text-white">Add New Customer</h3>
              <button onClick={() => setShowAddCustomer(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 0300-1234567"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Street / House address"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="flex-1 py-2 bg-[#27272a] text-zinc-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#d97706] text-white text-xs font-bold rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
              <h3 className="text-base font-bold text-white">Receive Udhaar Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2.5 bg-[#121215] rounded-lg border border-[#27272a] text-xs">
              <div className="text-zinc-400">Customer: <strong className="text-white">{selectedCustomer.name}</strong></div>
              <div className="text-zinc-400 mt-0.5">
                Current Due: <strong className="text-red-400 font-mono">{formatCurrency(selectedCustomer.balance)}</strong>
              </div>
            </div>

            <form onSubmit={handleReceivePayment} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Received Amount (Rs.) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max due: ${selectedCustomer.balance}`}
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Payment Notes (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cleared bill for family dinner"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 bg-[#27272a] text-zinc-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded"
                >
                  Confirm & Print Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

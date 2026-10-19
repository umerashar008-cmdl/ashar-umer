import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, ShopSettings } from '../../types/pos';
import { formatCurrency } from '../../services/calculator';
import {
  Search,
  Filter,
  Printer,
  ChefHat,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface CurrentOrdersProps {
  orders: Order[];
  settings: ShopSettings;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onReprintBill: (order: Order) => void;
  onReprintKot: (order: Order) => void;
}

export const CurrentOrders: React.FC<CurrentOrdersProps> = ({
  orders,
  settings,
  onUpdateStatus,
  onReprintBill,
  onReprintKot,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Filter by status
      if (statusFilter === 'ACTIVE') {
        if (o.status === 'COMPLETED' || o.status === 'CANCELLED') return false;
      } else if (statusFilter !== 'ALL') {
        if (o.status !== statusFilter) return false;
      }

      // Filter by search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesOrder = o.orderNumber.toLowerCase().includes(q);
        const matchesBill = o.billNumber.toLowerCase().includes(q);
        const matchesCust = o.customer?.name?.toLowerCase().includes(q) || false;
        const matchesPhone = o.customer?.phone?.includes(q) || false;
        const matchesTable = o.tableNumber?.toLowerCase().includes(q) || false;
        return matchesOrder || matchesBill || matchesCust || matchesPhone || matchesTable;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CONFIRMED':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'KITCHEN':
      case 'PREPARING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'READY':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'OUT_FOR_DELIVERY':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* LEFT: Orders List */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-[#27272a]">
        {/* Top Filter and Search Bar */}
        <div className="p-3 bg-[#141417] border-b border-[#27272a] space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d97706]" />
              <span>Orders Management</span>
              <span className="text-xs font-mono text-zinc-500">({filteredOrders.length})</span>
            </h2>

            {/* Quick Status Filters */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'ACTIVE', label: 'Active' },
                { id: 'ALL', label: 'All Orders' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'CANCELLED', label: 'Cancelled' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === filter.id
                      ? 'bg-[#d97706] text-white'
                      : 'bg-[#1e1e22] text-zinc-400 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, bill #, customer name, phone, or table..."
              className="w-full bg-[#1b1b1f] border border-[#2e2e33] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#d97706]"
            />
          </div>
        </div>

        {/* Orders Table / List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-500">
              <Clock className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-xs font-medium">No orders found for selected filter</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              const timeStr = new Date(order.createdAt).toLocaleTimeString('en-PK', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1f1f23] border-[#d97706] shadow-md'
                      : 'bg-[#18181b] border-[#27272a] hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-zinc-400">· {order.billNumber}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">({timeStr})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-[#121215] px-1.5 py-0.2 rounded border border-[#27272a]">
                        {order.orderType}
                        {order.tableNumber ? ` #${order.tableNumber}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="text-zinc-300">
                      <span className="font-semibold">{order.items.length} items:</span>{' '}
                      <span className="text-zinc-400">
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ').slice(0, 45)}
                        {order.items.length > 2 ? '...' : ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-[#fbbf24] tabular-nums">
                        {formatCurrency(order.grandTotal)}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {order.paymentStatus}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Order Details & Status Actions */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-[#141417] flex flex-col justify-between shrink-0 overflow-y-auto p-4 space-y-4">
        {selectedOrder ? (
          <>
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedOrder.orderNumber}</h3>
                  <p className="text-xs text-zinc-400 font-mono">{selectedOrder.billNumber}</p>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                    selectedOrder.status
                  )}`}
                >
                  {selectedOrder.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mt-2 text-xs text-zinc-400 space-y-0.5">
                <div>
                  <strong>Order Type:</strong> {selectedOrder.orderType}{' '}
                  {selectedOrder.tableNumber ? `(Table ${selectedOrder.tableNumber})` : ''}
                </div>
                <div>
                  <strong>Time:</strong> {new Date(selectedOrder.createdAt).toLocaleString('en-PK')}
                </div>
                {selectedOrder.customer?.name && (
                  <div>
                    <strong>Customer:</strong> {selectedOrder.customer.name} (
                    {selectedOrder.customer.phone || 'No phone'})
                  </div>
                )}
                {selectedOrder.customer?.address && (
                  <div>
                    <strong>Address:</strong> {selectedOrder.customer.address}
                  </div>
                )}
              </div>
            </div>

            {/* Status Transition Buttons */}
            <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Update Order Status:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    'NEW',
                    'CONFIRMED',
                    'KITCHEN',
                    'PREPARING',
                    'READY',
                    'OUT_FOR_DELIVERY',
                    'COMPLETED',
                    'CANCELLED',
                  ] as OrderStatus[]
                ).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      if (st === 'CANCELLED') {
                        if (window.confirm('Cancel this order? It will remain in history.')) {
                          onUpdateStatus(selectedOrder.id, st);
                        }
                      } else {
                        onUpdateStatus(selectedOrder.id, st);
                      }
                    }}
                    className={`py-1.5 px-2 rounded text-[11px] font-bold border transition-colors ${
                      selectedOrder.status === st
                        ? 'bg-[#d97706] text-white border-[#b45309]'
                        : 'bg-[#121215] text-zinc-400 border-[#2e2e33] hover:text-white'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Itemized List */}
            <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl space-y-2">
              <div className="text-xs font-bold text-white border-b border-[#27272a] pb-1">
                Ordered Items ({selectedOrder.items.length})
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white">
                        {item.quantity}x {item.name} {item.size ? `(${item.size})` : ''}
                      </span>
                      {item.selectedPizzaFlavor && (
                        <div className="text-[10px] text-zinc-400">
                          Flavor: {item.selectedPizzaFlavor}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-zinc-300">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Snapshot */}
              <div className="border-t border-[#27272a] pt-2 space-y-1 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                {selectedOrder.deliveryCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span className="font-mono">+ {formatCurrency(selectedOrder.deliveryCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white border-t border-[#27272a] pt-1">
                  <span>Grand Total:</span>
                  <span className="font-mono text-[#fbbf24]">{formatCurrency(selectedOrder.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Paid: {formatCurrency(selectedOrder.receivedAmount)}</span>
                  <span className="font-mono text-red-400">
                    Remaining: {formatCurrency(selectedOrder.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Reprint Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => onReprintBill(selectedOrder)}
                className="py-2.5 px-3 bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-[#d97706]" />
                <span>Reprint Bill</span>
              </button>

              <button
                onClick={() => onReprintKot(selectedOrder)}
                className="py-2.5 px-3 bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <ChefHat className="w-4 h-4 text-[#d97706]" />
                <span>Reprint KOT</span>
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500">
            <Eye className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs font-semibold text-zinc-400">Select an order</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              Click any order from the left list to view details and reprint receipts
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

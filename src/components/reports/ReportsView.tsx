import React, { useState, useMemo } from 'react';
import { Order, ExpenseRecord, ShopSettings } from '../../types/pos';
import { formatCurrency } from '../../services/calculator';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  DollarSign,
  Download,
  Printer,
  ShoppingBag,
  CreditCard,
  Ban,
  ArrowUpRight,
} from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  expenses: ExpenseRecord[];
  settings: ShopSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  expenses,
  settings,
}) => {
  const [timeRange, setTimeRange] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL'>('TODAY');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Date filtering logic
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return orders.filter((o) => {
      const orderDate = o.createdAt.split('T')[0];

      if (customStartDate && customEndDate) {
        return orderDate >= customStartDate && orderDate <= customEndDate;
      }

      if (timeRange === 'TODAY') {
        return orderDate === todayStr;
      } else if (timeRange === 'THIS_WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(o.createdAt) >= weekAgo;
      } else if (timeRange === 'THIS_MONTH') {
        return orderDate.startsWith(todayStr.slice(0, 7));
      }
      return true;
    });
  }, [orders, timeRange, customStartDate, customEndDate]);

  // Valid non-cancelled orders
  const validOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status !== 'CANCELLED');
  }, [filteredOrders]);

  const cancelledOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'CANCELLED');
  }, [filteredOrders]);

  // Financial aggregates
  const totalGrossSales = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  }, [validOrders]);

  const totalCollectedCash = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + o.receivedAmount, 0);
  }, [validOrders]);

  const totalOutstandingUdhaar = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + o.remainingAmount, 0);
  }, [validOrders]);

  const totalDiscounts = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  }, [validOrders]);

  const totalDeliveryCharges = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + (o.deliveryCharges || 0), 0);
  }, [validOrders]);

  const totalExtraCharges = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + (o.extraCharges || 0), 0);
  }, [validOrders]);

  // Expenses in filtered timeframe
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return expenses.filter((e) => {
      const expDate = e.date.split('T')[0];
      if (customStartDate && customEndDate) {
        return expDate >= customStartDate && expDate <= customEndDate;
      }
      if (timeRange === 'TODAY') {
        return expDate === todayStr;
      } else if (timeRange === 'THIS_WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(e.date) >= weekAgo;
      } else if (timeRange === 'THIS_MONTH') {
        return expDate.startsWith(todayStr.slice(0, 7));
      }
      return true;
    });
  }, [expenses, timeRange, customStartDate, customEndDate]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Net Profit
  const netProfit = totalGrossSales - totalExpensesAmount;

  // Breakdown by Order Type
  const orderTypeBreakdown = useMemo(() => {
    const counts = { DINE_IN: 0, TAKEAWAY: 0, DELIVERY: 0 };
    const amounts = { DINE_IN: 0, TAKEAWAY: 0, DELIVERY: 0 };

    validOrders.forEach((o) => {
      if (counts[o.orderType] !== undefined) {
        counts[o.orderType] += 1;
        amounts[o.orderType] += o.grandTotal;
      }
    });

    return { counts, amounts };
  }, [validOrders]);

  // Breakdown by Pizza Sizes
  const pizzaSizeBreakdown = useMemo(() => {
    const sizes: Record<string, { count: number; revenue: number }> = {
      Small: { count: 0, revenue: 0 },
      Medium: { count: 0, revenue: 0 },
      Large: { count: 0, revenue: 0 },
    };

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.size && sizes[item.size]) {
          sizes[item.size].count += item.quantity;
          sizes[item.size].revenue += item.unitPrice * item.quantity;
        }
      });
    });

    return sizes;
  }, [validOrders]);

  // Top Selling Items
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.name;
        const existing = map.get(key) || { name: key, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += item.unitPrice * item.quantity;
        map.set(key, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [validOrders]);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Order Number',
      'Bill Number',
      'Date',
      'Order Type',
      'Customer',
      'Items Count',
      'Subtotal',
      'Discount',
      'Delivery',
      'Grand Total',
      'Received',
      'Remaining',
      'Payment Status',
      'Order Status',
    ];

    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.billNumber,
      new Date(o.createdAt).toLocaleString('en-PK'),
      o.orderType,
      `"${o.customer?.name || ''}"`,
      o.items.length,
      o.subtotal,
      o.discountAmount,
      o.deliveryCharges,
      o.grandTotal,
      o.receivedAmount,
      o.remainingAmount,
      o.paymentStatus,
      o.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DubaiPizzaShop_Report_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* Header & Date Range Selection */}
      <div className="p-3.5 bg-[#141417] border-b border-[#27272a] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Sales Reports & Financial Analytics
            </h2>
            <p className="text-[11px] text-zinc-400">
              Verified figures calculated from actual saved order transactions
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
            {(
              [
                { id: 'TODAY', label: 'Today' },
                { id: 'THIS_WEEK', label: 'This Week' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'ALL', label: 'All Time' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTimeRange(t.id);
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeRange === t.id && !customStartDate
                    ? 'bg-[#d97706] text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            disabled={filteredOrders.length === 0}
            className="px-3 py-1.5 bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Content Dashboard */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Gross Sales */}
          <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl">
            <span className="text-[11px] text-zinc-400">Total Gross Sales</span>
            <div className="text-lg font-mono font-black text-[#fbbf24] mt-1 tabular-nums">
              {formatCurrency(totalGrossSales)}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
              {validOrders.length} valid orders
            </span>
          </div>

          {/* Collected Cash */}
          <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl">
            <span className="text-[11px] text-zinc-400">Collected Payments</span>
            <div className="text-lg font-mono font-black text-emerald-400 mt-1 tabular-nums">
              {formatCurrency(totalCollectedCash)}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
              In hand / bank
            </span>
          </div>

          {/* Outstanding Udhaar */}
          <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl">
            <span className="text-[11px] text-zinc-400">Outstanding Udhaar</span>
            <div className="text-lg font-mono font-black text-red-400 mt-1 tabular-nums">
              {formatCurrency(totalOutstandingUdhaar)}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
              Unsettled credit
            </span>
          </div>

          {/* Expenses */}
          <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl">
            <span className="text-[11px] text-zinc-400">Total Expenses</span>
            <div className="text-lg font-mono font-black text-amber-400 mt-1 tabular-nums">
              {formatCurrency(totalExpensesAmount)}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
              {filteredExpenses.length} entries
            </span>
          </div>

          {/* Net Profit */}
          <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl">
            <span className="text-[11px] text-zinc-400">Net Estimated Profit</span>
            <div
              className={`text-lg font-mono font-black mt-1 tabular-nums ${
                netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {formatCurrency(netProfit)}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
              Sales - Expenses
            </span>
          </div>

          {/* Cancelled Orders */}
          <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl">
            <span className="text-[11px] text-zinc-400">Cancelled Orders</span>
            <div className="text-lg font-mono font-black text-zinc-400 mt-1 tabular-nums">
              {cancelledOrders.length}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
              Not counted in sales
            </span>
          </div>
        </div>

        {/* Middle Row: Order Types & Pizza Sizes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Order Types */}
          <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Sales by Order Type
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-[#121215] rounded-lg border border-[#27272a] text-center">
                <div className="text-[11px] text-zinc-400">Dine In</div>
                <div className="text-base font-mono font-bold text-white mt-1">
                  {formatCurrency(orderTypeBreakdown.amounts.DINE_IN)}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {orderTypeBreakdown.counts.DINE_IN} orders
                </div>
              </div>

              <div className="p-3 bg-[#121215] rounded-lg border border-[#27272a] text-center">
                <div className="text-[11px] text-zinc-400">Takeaway</div>
                <div className="text-base font-mono font-bold text-white mt-1">
                  {formatCurrency(orderTypeBreakdown.amounts.TAKEAWAY)}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {orderTypeBreakdown.counts.TAKEAWAY} orders
                </div>
              </div>

              <div className="p-3 bg-[#121215] rounded-lg border border-[#27272a] text-center">
                <div className="text-[11px] text-zinc-400">Delivery</div>
                <div className="text-base font-mono font-bold text-white mt-1">
                  {formatCurrency(orderTypeBreakdown.amounts.DELIVERY)}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {orderTypeBreakdown.counts.DELIVERY} orders
                </div>
              </div>
            </div>
          </div>

          {/* Pizza Sizes Breakdown */}
          <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Pizza Size-wise Sales
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-[#121215] rounded-lg border border-[#27272a] text-center">
                <div className="text-[11px] text-zinc-400">Small (7")</div>
                <div className="text-base font-mono font-bold text-[#fbbf24] mt-1">
                  {pizzaSizeBreakdown.Small.count} sold
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {formatCurrency(pizzaSizeBreakdown.Small.revenue)}
                </div>
              </div>

              <div className="p-3 bg-[#121215] rounded-lg border border-[#27272a] text-center">
                <div className="text-[11px] text-zinc-400">Medium (10")</div>
                <div className="text-base font-mono font-bold text-[#fbbf24] mt-1">
                  {pizzaSizeBreakdown.Medium.count} sold
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {formatCurrency(pizzaSizeBreakdown.Medium.revenue)}
                </div>
              </div>

              <div className="p-3 bg-[#121215] rounded-lg border border-[#27272a] text-center">
                <div className="text-[11px] text-zinc-400">Large (14")</div>
                <div className="text-base font-mono font-bold text-[#fbbf24] mt-1">
                  {pizzaSizeBreakdown.Large.count} sold
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {formatCurrency(pizzaSizeBreakdown.Large.revenue)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Top Performing Items & Revenue
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {topProducts.length === 0 ? (
              <p className="col-span-full text-xs text-zinc-500 text-center py-4">
                No items sold yet in this period
              </p>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#121215] rounded-lg border border-[#27272a] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-white line-clamp-1">{p.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{p.qty} units sold</div>
                  </div>
                  <div className="text-right font-mono text-xs font-bold text-[#fbbf24] tabular-nums">
                    {formatCurrency(p.revenue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

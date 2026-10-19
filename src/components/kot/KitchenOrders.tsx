import React from 'react';
import { Order, OrderStatus } from '../../types/pos';
import { ChefHat, Clock, CheckCircle, Printer, RefreshCw } from 'lucide-react';

interface KitchenOrdersProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onReprintKot: (order: Order) => void;
}

export const KitchenOrders: React.FC<KitchenOrdersProps> = ({
  orders,
  onUpdateStatus,
  onReprintKot,
}) => {
  // Show only orders that need kitchen preparation
  const kitchenOrders = orders.filter((o) =>
    ['CONFIRMED', 'KITCHEN', 'PREPARING', 'READY'].includes(o.status)
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* Top Banner */}
      <div className="p-3.5 bg-[#141417] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Kitchen Order Tickets (KOT)
              <span className="text-xs font-mono text-[#fbbf24] bg-[#d97706]/20 px-2 py-0.5 rounded border border-[#d97706]/30">
                {kitchenOrders.length} Active Tickets
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">Live order queue for kitchen food preparation</p>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 content-start">
        {kitchenOrders.length === 0 ? (
          <div className="col-span-full h-80 flex flex-col items-center justify-center text-center text-zinc-500">
            <ChefHat className="w-12 h-12 text-zinc-600 mb-2" />
            <h3 className="text-sm font-bold text-zinc-300">Kitchen Queue Clear</h3>
            <p className="text-xs text-zinc-500 mt-1">No active kitchen orders waiting to be prepared</p>
          </div>
        ) : (
          kitchenOrders.map((order) => {
            const timeAgoMin = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            const isReady = order.status === 'READY';
            const isPreparing = order.status === 'PREPARING';

            return (
              <div
                key={order.id}
                className={`rounded-xl border flex flex-col justify-between overflow-hidden shadow-lg transition-all ${
                  isReady
                    ? 'bg-[#141915] border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : isPreparing
                    ? 'bg-[#1b1914] border-amber-500/40'
                    : 'bg-[#18181b] border-[#27272a]'
                }`}
              >
                {/* Header */}
                <div className="p-3 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-sm text-white">
                        {order.kotNumber}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        ({order.orderNumber})
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{timeAgoMin} min ago</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#27272a] text-zinc-200 border border-[#3f3f46]">
                      {order.orderType}
                    </span>
                    {order.tableNumber && (
                      <div className="text-xs font-bold text-[#fbbf24] mt-0.5">
                        Table {order.tableNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="p-3 space-y-2 flex-1 max-h-60 overflow-y-auto">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="border-b border-[#27272a] pb-2 last:border-b-0">
                      <div className="flex items-start gap-2">
                        <span className="font-mono font-black text-sm text-[#fbbf24] bg-[#27272a] px-1.5 py-0.2 rounded shrink-0">
                          {item.quantity}x
                        </span>
                        <div className="flex-1">
                          <div className="font-bold text-xs text-white">
                            {item.name} {item.size ? `(${item.size})` : ''}
                          </div>
                          {item.selectedPizzaFlavor && (
                            <div className="text-[11px] font-semibold text-amber-300">
                              Flavor: {item.selectedPizzaFlavor}
                            </div>
                          )}
                          {item.extras && item.extras.length > 0 && (
                            <div className="text-[10px] text-zinc-300">
                              + {item.extras.map((e) => e.name).join(', ')}
                            </div>
                          )}
                          {item.itemNotes && (
                            <div className="text-[10px] text-zinc-400 italic">
                              "{item.itemNotes}"
                            </div>
                          )}

                          {/* Deal Kitchen Ingredients breakdown */}
                          {item.isDeal && item.dealIngredients && item.dealIngredients.length > 0 && (
                            <div className="mt-1 text-[10px] text-zinc-300 bg-[#121215] p-1.5 rounded border border-[#27272a] space-y-0.5">
                              <span className="text-[9px] font-semibold text-zinc-400 block">
                                Deal Components:
                              </span>
                              {item.dealIngredients.map((d, dIdx) => (
                                <div key={dIdx}>
                                  • {d.quantity * item.quantity}x {d.productName}{' '}
                                  {d.size ? `(${d.size})` : ''}{' '}
                                  {d.selectedFlavor ? `[${d.selectedFlavor}]` : ''}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {order.notes && (
                    <div className="p-1.5 bg-[#121215] border border-amber-500/20 text-amber-300 text-[10px] rounded">
                      <strong>Note:</strong> {order.notes}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-2.5 border-t border-[#27272a] bg-[#121215] flex items-center justify-between gap-2">
                  <button
                    onClick={() => onReprintKot(order)}
                    title="Reprint Kitchen Ticket"
                    className="p-2 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 rounded-lg text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    {order.status !== 'PREPARING' && order.status !== 'READY' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors flex-1"
                      >
                        Start Cooking
                      </button>
                    )}

                    {order.status !== 'READY' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'READY')}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex-1"
                      >
                        Mark Ready
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                        className="px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs rounded-lg transition-colors flex-1"
                      >
                        Done & Served
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

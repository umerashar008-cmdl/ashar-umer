import React, { useState } from 'react';
import { RestaurantTable, Order } from '../../types/pos';
import { formatCurrency } from '../../services/calculator';
import { Layers, Users, Clock, ArrowRightLeft, CheckCircle2, Plus } from 'lucide-react';

interface TableManagementProps {
  tables: RestaurantTable[];
  orders: Order[];
  onSelectTableForOrder: (tableNumber: string) => void;
  onUpdateTableStatus: (tableId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'BILL_REQUESTED') => void;
  onTransferTable: (fromTableNumber: string, toTableNumber: string) => void;
  onAddTable: (table: RestaurantTable) => void;
}

export const TableManagement: React.FC<TableManagementProps> = ({
  tables,
  orders,
  onSelectTableForOrder,
  onUpdateTableStatus,
  onTransferTable,
  onAddTable,
}) => {
  const [transferFrom, setTransferFrom] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  const activeOrdersMap = new Map<string, Order>();
  orders
    .filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.tableNumber)
    .forEach((o) => {
      activeOrdersMap.set(o.tableNumber!, o);
    });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;

    onAddTable({
      id: `tbl-${Date.now()}`,
      number: newTableNumber.trim(),
      name: newTableName.trim() || `Table ${newTableNumber.trim()}`,
      capacity: newTableCapacity,
      status: 'AVAILABLE',
    });

    setNewTableNumber('');
    setNewTableName('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* Top Bar */}
      <div className="p-3.5 bg-[#141417] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center">
            <Layers className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Restaurant Table Floor Management
              <span className="text-xs font-mono text-zinc-400">({tables.length} Tables)</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Live status, dine-in table assignment and order transfers
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 text-[#d97706]" />
          <span>Add New Table</span>
        </button>
      </div>

      {/* Transfer Notification Banner if in transfer mode */}
      {transferFrom && (
        <div className="p-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            <span>
              Transferring Table #{transferFrom} order. Click any AVAILABLE table below to complete transfer.
            </span>
          </div>
          <button
            onClick={() => setTransferFrom(null)}
            className="text-xs font-bold underline text-amber-200 hover:text-white"
          >
            Cancel Transfer
          </button>
        </div>
      )}

      {/* Tables Floor Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 content-start">
        {tables.map((table) => {
          const activeOrder = activeOrdersMap.get(table.number);
          const isOccupied = table.status === 'OCCUPIED' || !!activeOrder;
          const isBillRequested = table.status === 'BILL_REQUESTED';

          return (
            <div
              key={table.id}
              className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all relative ${
                isBillRequested
                  ? 'bg-[#1b1522] border-purple-500/40 ring-1 ring-purple-500/30'
                  : isOccupied
                  ? 'bg-[#1e1913] border-amber-500/40'
                  : 'bg-[#18181b] border-[#27272a] hover:border-zinc-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-black text-sm text-white">
                    Table #{table.number}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      isBillRequested
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : isOccupied
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {isBillRequested ? 'Bill Requested' : isOccupied ? 'Occupied' : 'Available'}
                  </span>
                </div>

                <div className="text-xs text-zinc-300 font-medium mb-1">{table.name}</div>
                <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Seats: {table.capacity}</span>
                </div>

                {/* Active Order Preview */}
                {activeOrder ? (
                  <div className="mt-3 pt-2 border-t border-[#27272a] space-y-1 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Order:</span>
                      <span className="font-mono text-white font-bold">
                        {activeOrder.orderNumber}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Items:</span>
                      <span>{activeOrder.items.length} items</span>
                    </div>
                    <div className="flex justify-between font-bold text-white">
                      <span>Total:</span>
                      <span className="font-mono text-[#fbbf24]">
                        {formatCurrency(activeOrder.grandTotal)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-2 border-t border-[#27272a] text-[11px] text-zinc-500 text-center">
                    Ready for customers
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-2 border-t border-[#27272a] flex items-center gap-1.5">
                {isOccupied ? (
                  <>
                    <button
                      onClick={() => onSelectTableForOrder(table.number)}
                      className="flex-1 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-lg transition-colors text-center"
                    >
                      View / Bill
                    </button>
                    <button
                      onClick={() => setTransferFrom(table.number)}
                      title="Transfer order to another table"
                      className="p-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 rounded-lg text-xs"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateTableStatus(table.id, 'AVAILABLE')}
                      title="Mark table as available / clean"
                      className="p-1.5 bg-[#27272a] hover:bg-emerald-600/30 text-zinc-300 rounded-lg text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : transferFrom ? (
                  <button
                    onClick={() => {
                      onTransferTable(transferFrom, table.number);
                      setTransferFrom(null);
                    }}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors text-center"
                  >
                    Transfer Here
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectTableForOrder(table.number)}
                    className="w-full py-1.5 bg-[#27272a] hover:bg-[#d97706] hover:text-white text-zinc-300 text-xs font-semibold rounded-lg transition-colors text-center"
                  >
                    New Dine-in Order
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white">Add New Restaurant Table</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">
                  Table Number *
                </label>
                <input
                  type="text"
                  required
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g. 11 or 12"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">
                  Table Name / Section
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g. Family Hall Table 11"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-[#27272a] text-zinc-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#d97706] text-white text-xs font-bold rounded"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

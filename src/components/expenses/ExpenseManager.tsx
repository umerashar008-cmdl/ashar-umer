import React, { useState, useMemo } from 'react';
import { ExpenseRecord } from '../../types/pos';
import { formatCurrency } from '../../services/calculator';
import { Receipt, Plus, Trash2, Calendar, DollarSign } from 'lucide-react';

interface ExpenseManagerProps {
  expenses: ExpenseRecord[];
  onAddExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Ingredients / Vegetables');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const expenseCategories = [
    'Ingredients / Vegetables',
    'Dairy & Meat',
    'Packaging & Boxes',
    'Electricity / Gas / Utility',
    'Staff Salaries & Daily Wages',
    'Shop Maintenance',
    'Marketing & Printing',
    'Other Expenses',
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);

  const todayTotal = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(todayStr))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  const monthTotal = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(currentMonthStr))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, currentMonthStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!title.trim() || isNaN(amt) || amt <= 0) return;

    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      title: title.trim(),
      amount: amt,
      category,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
      recordedBy: 'Admin / Manager',
    };

    onAddExpense(newExpense);
    setShowAddModal(false);
    setTitle('');
    setAmount('');
    setNotes('');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0f0f11]">
      {/* Top Banner */}
      <div className="p-3.5 bg-[#141417] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Restaurant Expenses & Cash Outflow
            </h2>
            <p className="text-[11px] text-zinc-400">
              Track daily food supplies, utilities, maintenance, and staff expenses
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#141417] border-b border-[#27272a]">
        <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl">
          <div className="text-[11px] text-zinc-400">Today's Expenses</div>
          <div className="text-base font-mono font-bold text-red-400 mt-0.5 tabular-nums">
            {formatCurrency(todayTotal)}
          </div>
        </div>

        <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl">
          <div className="text-[11px] text-zinc-400">This Month's Total</div>
          <div className="text-base font-mono font-bold text-[#fbbf24] mt-0.5 tabular-nums">
            {formatCurrency(monthTotal)}
          </div>
        </div>

        <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl">
          <div className="text-[11px] text-zinc-400">Total Records</div>
          <div className="text-base font-mono font-bold text-white mt-0.5 tabular-nums">
            {expenses.length}
          </div>
        </div>

        <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl">
          <div className="text-[11px] text-zinc-400">Active Month</div>
          <div className="text-xs font-mono font-semibold text-zinc-300 mt-1">
            {new Date().toLocaleString('en-PK', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Expense Entries Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141417] border-b border-[#27272a] text-zinc-400 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Recorded By</th>
                <th className="py-2.5 px-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No expense records entered yet
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#1f1f23]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-zinc-400">
                      {new Date(exp.date).toLocaleDateString('en-PK', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      <div>{exp.title}</div>
                      {exp.notes && <div className="text-[10px] text-zinc-500">{exp.notes}</div>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] text-zinc-400 bg-[#121215] px-2 py-0.5 rounded border border-[#27272a]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-red-400 tabular-nums">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500">{exp.recordedBy}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete expense "${exp.title}"?`)) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="p-1 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Record Restaurant Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 10kg Chicken Tikka chunks"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Amount (Rs.) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-[#d97706]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#d97706]"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-semibold block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Receipt number or vendor name..."
                  className="w-full bg-[#121215] border border-[#2e2e33] rounded px-3 py-1.5 text-xs text-white"
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

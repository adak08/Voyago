import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowRight, IndianRupee, X } from "lucide-react";
import { useTripStore } from "../store/tripStore";
import { useAuthStore } from "../store/authStore";
import { expenseService } from "../services/expenseService";
import { format } from "date-fns";

const CATEGORY_EMOJI = {
  food: "🍔", transport: "🚗", accommodation: "🏨",
  activity: "🎯", shopping: "🛍️", other: "💳",
};

const CATEGORY_PILL = {
  food:          "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  transport:     "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  accommodation: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  activity:      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  shopping:      "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400",
  other:         "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export default function ExpenseWidget({ tripId, trip }) {
  const { expenses, fetchExpenses, fetchBalances, balances, addExpense } = useTripStore();
  const { user } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const [activeView, setActiveView] = useState("list");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", amount: "", category: "other", splitType: "equal", notes: "",
  });

  useEffect(() => {
    fetchExpenses(tripId);
    fetchBalances(tripId);
  }, [tripId]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await expenseService.addExpense({
        ...form, tripId, amount: parseFloat(form.amount),
      });
      addExpense(data.expense);
      fetchBalances(tripId);
      setShowAdd(false);
      setForm({ title: "", amount: "", category: "other", splitType: "equal", notes: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add expense");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    await expenseService.deleteExpense(id);
    fetchExpenses(tripId);
    fetchBalances(tripId);
  };

  const getUserName = (id) =>
    trip.members?.find((m) => m.user?._id === id)?.user?.name || id;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-title">Expenses</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Total: <span className="font-semibold text-gray-800 dark:text-gray-200">₹{total.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <div className="flex bg-gray-100 dark:bg-surface-850 rounded-xl p-1 gap-0.5">
            {["list", "balances"].map((v) => (
              <button key={v} onClick={() => setActiveView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === v
                    ? "bg-white dark:bg-surface-800 shadow-sm text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}>
                {v === "list" ? "Expenses" : "Balances"}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm">
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Add Expense Modal-like card */}
      {showAdd && (
        <div className="card p-5 mb-5 border border-primary-100 dark:border-primary-900/40 bg-primary-50/30 dark:bg-primary-900/10 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Add Expense</h3>
            <button onClick={() => setShowAdd(false)} className="btn-ghost p-1.5">
              <X size={15} />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Title</label>
                <input className="input-field" placeholder="Hotel booking"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Amount (₹)</label>
                <input className="input-field" type="number" placeholder="1500" min="0"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
                <select className="input-field" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.keys(CATEGORY_EMOJI).map((c) => (
                    <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Split</label>
                <select className="input-field" value={form.splitType}
                  onChange={(e) => setForm({ ...form, splitType: e.target.value })}>
                  <option value="equal">Equal split</option>
                  <option value="unequal">Custom split</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary text-sm">
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding…
                  </span>
                ) : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense list */}
      {activeView === "list" && (
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="card p-12 text-center">
              <IndianRupee size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="font-medium text-gray-400 dark:text-gray-600 text-sm">No expenses yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Add the first expense above</p>
            </div>
          ) : expenses.map((expense) => (
            <div key={expense._id}
              className="card p-4 flex items-center justify-between hover:shadow-md dark:hover:shadow-black/20 transition-shadow group">
              <div className="flex items-center gap-3.5">
                <span className="text-2xl w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-surface-850 rounded-xl">
                  {CATEGORY_EMOJI[expense.category] || "💳"}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{expense.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`badge text-[10px] ${CATEGORY_PILL[expense.category] || CATEGORY_PILL.other}`}>
                      {expense.category}
                    </span>
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                      Paid by {expense.paidBy?.name} · {format(new Date(expense.date), "MMM d")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900 dark:text-gray-100">₹{expense.amount.toLocaleString()}</span>
                {expense.paidBy?._id === user?.id && (
                  <button onClick={() => handleDelete(expense._id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-all p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Balances */}
      {activeView === "balances" && (
        <div className="space-y-3">
          {balances.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">🎉</p>
              <p className="font-semibold text-gray-600 dark:text-gray-400">All settled up!</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">No pending balances</p>
            </div>
          ) : balances.map((b, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              {/* From */}
              <div className="flex items-center gap-2 flex-1">
                <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-sm font-bold text-red-600 dark:text-red-400">
                  {getUserName(b.from)?.[0]?.toUpperCase()}
                </div>
                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{getUserName(b.from)}</p>
              </div>

              {/* Arrow + amount */}
              <div className="flex flex-col items-center">
                <span className="font-bold text-red-500 dark:text-red-400 text-sm">₹{b.amount}</span>
                <ArrowRight size={16} className="text-gray-300 dark:text-gray-700 mt-0.5" />
              </div>

              {/* To */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{getUserName(b.to)}</p>
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {getUserName(b.to)?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

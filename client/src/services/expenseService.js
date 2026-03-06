import api from "./api";

export const expenseService = {
  addExpense: async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (key === "splits") formData.append(key, JSON.stringify(val));
      else if (val !== undefined) formData.append(key, val);
    });
    const res = await api.post("/expenses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  getTripExpenses: async (tripId) => {
    const res = await api.get(`/expenses/${tripId}`);
    return res.data;
  },
  getTripBalances: async (tripId) => {
    const res = await api.get(`/expenses/${tripId}/balances`);
    return res.data;
  },
  getTripSettlements: async (tripId) => {
    const res = await api.get(`/expenses/${tripId}/settlements`);
    return res.data;
  },
  deleteExpense: async (id) => {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  },
  createSettlement: async (data) => {
    const res = await api.post("/expenses/settle", data);
    return res.data;
  },
};

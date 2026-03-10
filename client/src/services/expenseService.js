import api from "./api";

export const expenseService = {
  addExpense: async (data) => {
    const formData = new FormData();

    // Handle splits separately to avoid stringification
    const { splits, ...otherData } = data;

    // Add all other fields
    Object.entries(otherData).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        formData.append(key, val);
      }
    });

    // Add splits as individual form entries if they exist
    if (Array.isArray(splits) && splits.length > 0) {
      splits.forEach((split, idx) => {
        formData.append(`splits[${idx}][user]`, split.user);
        formData.append(`splits[${idx}][amount]`, split.amount);
        formData.append(`splits[${idx}][paid]`, split.paid);
      });
    }

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

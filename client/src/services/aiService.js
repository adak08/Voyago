import api from "./api";

export const aiService = {
  planTrip: async (params) => {
    const response = await api.post("/ai/plan-trip", params, {
      timeout: 120000,
    });
    return response.data;
  },

  getAgentStatus: async () => {
    const response = await api.get("/ai/agents/status");
    return response.data;
  },
};

export default aiService;
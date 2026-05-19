import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  region?: string;
}) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

export const getPlots = async () => {
  const { data } = await api.get("/plots");
  return data;
};

export const getCrops = async () => {
  const { data } = await api.get("/crops");
  return data;
};

export const getRecommendations = async () => {
  const { data } = await api.get("/recommendations");
  return data;
};

export const getForecasts = async () => {
  const { data } = await api.get("/forecasts");
  return data;
};

export const getMoistureHistory = async (cropId: number) => {
  const { data } = await api.get(`/moisture/${cropId}/history`);
  return data;
};

export const getWeatherHistory = async (plotId: number) => {
  const { data } = await api.get(`/weather/${plotId}/history`);
  return data;
};
export const createPlot = async (payload: {
  name: string;
  area: number;
  region: string;
  latitude: number;
  longitude: number;
  soilType?: string;
}) => {
  const { data } = await api.post("/plots", payload);
  return data;
};
export const createCrop = async (payload: {
  name: string;
  plantingDate: string;
  growthStage?: string;
  expectedHarvestDate?: string;
  plotId: number;
  optimalMoistureMin?: number;
  optimalMoistureMax?: number;
  baseYield?: number;
}) => {
  const { data } = await api.post("/crops", payload);
  return data;
};
export const createMoistureRecord = async (payload: {
  cropId: number;
  value: number;
  source?: string;
}) => {
  const { data } = await api.post("/moisture", payload);
  return data;
};

export const runMonitoringNow = async () => {
  const { data } = await api.post("/system/run-monitoring");
  return data;
};
export const generateForecast = async (cropId: number) => {
  const { data } = await api.post(`/forecasts/${cropId}/generate`);
  return data;
};
export const getCropById = async (id: number) => {
  const { data } = await api.get(`/crops/${id}`);
  return data;
};
export const getPlotById = async (id: number) => {
  const { data } = await api.get(`/plots/${id}`);
  return data;
};
export const fillMissingData = async (payload: {
  region?: string;
  latitude?: number;
  longitude?: number;
  cropName?: string;
  missingFields: string[];
}) => {
  const { data } = await api.post("/ai/fill-missing", payload);
  return data;
};
export const detectCoordinates = async (payload: {
  region?: string;
  city?: string;
}) => {
  const { data } = await api.post("/geocoding/detect-coordinates", payload);
  return data;
};
export const detectCropReference = async (payload: {
  name: string;
  plantingDate?: string;
  region?: string;
  soilType?: string;
}) => {
  const { data } = await api.post("/crop-reference/detect", payload);
  return data;
};

export const getCropCatalog = async () => {
  const { data } = await api.get("/crop-reference/catalog");
  return data;
};

export const getRecommendationHint = async (recommendationId: number) => {
  const { data } = await api.get(`/recommendation-ai/${recommendationId}/hint`);
  return data;
};

export const createCropReferenceWithAI = async (payload: {
  name: string;
  region?: string;
  soilType?: string;
}) => {
  const { data } = await api.post("/crop-references/ai-create", payload);
  return data;
};

export const getCropReferences = async () => {
  const { data } = await api.get("/crop-references");
  return data;
};

export const createCropReference = async (payload: any) => {
  const { data } = await api.post("/crop-references", payload);
  return data;
};

export const deleteCropReference = async (id: number) => {
  const { data } = await api.delete(`/crop-references/${id}`);
  return data;
};

export const findCropReferenceByName = async (name: string) => {
  const { data } = await api.get("/crop-references/search", {
    params: { name },
  });

  return data;
};

export const generateForecastsForAllCrops = async () => {
  const { data } = await api.post("/forecasts/generate-all");
  return data;
};

export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};

export const markNotificationAsRead = async (id: number) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsAsRead = async () => {
  const { data } = await api.patch("/notifications/read-all");
  return data;
};

export const getIoTSensors = async () => {
  const { data } = await api.get("/iot/sensors");
  return data;
};

export const createIoTSensor = async (payload: {
  cropId: number;
  name?: string;
  mode?: "simulated" | "physical";
}) => {
  const { data } = await api.post("/iot/sensors", payload);
  return data;
};

export const disableIoTSensor = async (id: number) => {
  const { data } = await api.patch(`/iot/sensors/${id}/disable`);
  return data;
};

export const createTestIoTReading = async (id: number, value?: number) => {
  const { data } = await api.post(`/iot/sensors/${id}/test-reading`, {
    value,
  });
  return data;
};

export const getAdminOverview = async () => {
  const { data } = await api.get("/admin/overview");
  return data;
};

export const getAdminUsers = async () => {
  const { data } = await api.get("/admin/users");
  return data;
};
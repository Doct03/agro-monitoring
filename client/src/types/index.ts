export type User = {
  id: number;
  name: string;
  email: string;
  region?: string;
};

export type Plot = {
  id: number;
  name: string;
  area: number;
  region: string;
  latitude: number;
  longitude: number;
  soilType?: string;
  userId: number;
};

export type Crop = {
  id: number;
  name: string;
  plantingDate: string;
  growthStage?: string;
  expectedHarvestDate?: string;
  plotId: number;
  optimalMoistureMin?: number | null;
  optimalMoistureMax?: number | null;
  baseYield?: number | null;
  isCustom?: boolean;
};

export type Recommendation = {
  id: number;
  message: string;
  recommendationType: string;
  irrigationVolume?: number | null;
  createdAt: string;
};

export type Forecast = {
  id: number;
  expectedYield: number;
  confidenceLevel?: number | null;
  notes?: string | null;
  createdAt: string;
};

export type MoistureRecord = {
  id: number;
  value: number;
  source: string;
  recordedAt: string;
  cropId: number;
};

export type WeatherRecord = {
  id: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed?: number;
  recordedAt: string;
  plotId: number;
};
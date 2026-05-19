type ForecastInput = {
  cropName: string;
  area: number;
  soilType?: string | null;
  moisture: number;
  temperature: number;
  rainfall: number;
  baseYield?: number | null;
  optimalMoistureMin?: number | null;
  optimalMoistureMax?: number | null;
};

const getFallbackBaseYield = (cropName: string): number => {
  const crop = cropName.toLowerCase();

  if (crop.includes("tomato") || crop.includes("томат")) return 25;
  if (crop.includes("potato") || crop.includes("картоп")) return 30;
  if (crop.includes("cucumber") || crop.includes("огір")) return 20;
  if (crop.includes("pepper") || crop.includes("перець")) return 18;

  return 15;
};

const getSoilFactor = (soilType?: string | null): number => {
  if (!soilType) return 1.0;

  const soil = soilType.toLowerCase();

  if (
    soil.includes("чорнозем") ||
    soil.includes("chernozem") ||
    soil.includes("chernozems")
  ) {
    return 1.2;
  }

  if (
    soil.includes("суглин") ||
    soil.includes("loam") ||
    soil.includes("cambisols")
  ) {
    return 1.0;
  }

  if (
    soil.includes("піщ") ||
    soil.includes("sand") ||
    soil.includes("arenosols")
  ) {
    return 0.8;
  }

  return 1.0;
};

const getMoistureFactor = (
  moisture: number,
  optimalMin?: number | null,
  optimalMax?: number | null
): number => {
  const min = optimalMin ?? 60;
  const max = optimalMax ?? 75;

  if (moisture >= min && moisture <= max) {
    return 1.0;
  }

  if (moisture < min) {
    const deficit = min - moisture;

    if (deficit <= 5) return 0.9;
    if (deficit <= 15) return 0.75;
    return 0.6;
  }

  if (moisture > max) {
    const excess = moisture - max;

    if (excess <= 5) return 0.92;
    if (excess <= 15) return 0.8;
    return 0.65;
  }

  return 0.85;
};

const getWeatherFactor = (temperature: number, rainfall: number): number => {
  let factor = 1.0;

  if (temperature < 10) factor -= 0.2;
  else if (temperature > 32) factor -= 0.15;

  if (rainfall > 0 && rainfall < 10) factor += 0.05;
  if (rainfall >= 20) factor -= 0.1;

  return Math.max(0.6, factor);
};

export const calculateYieldForecast = ({
  cropName,
  area,
  soilType,
  moisture,
  temperature,
  rainfall,
  baseYield,
  optimalMoistureMin,
  optimalMoistureMax,
}: ForecastInput) => {
  const resolvedBaseYield = baseYield ?? getFallbackBaseYield(cropName);
  const soilFactor = getSoilFactor(soilType);
  const moistureFactor = getMoistureFactor(
    moisture,
    optimalMoistureMin,
    optimalMoistureMax
  );
  const weatherFactor = getWeatherFactor(temperature, rainfall);

  const expectedYield =
    resolvedBaseYield * area * soilFactor * moistureFactor * weatherFactor;

  return {
    expectedYield: Number(expectedYield.toFixed(2)),
    confidenceLevel: 0.78,
    notes:
      "Розрахунок виконано на основі площі, типу ґрунту, рівня вологості, погодних умов та базових параметрів культури.",
  };
};
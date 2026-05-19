type CropFallbackResult = {
  averageDaysToHarvest: number;
  optimalMoistureMin: number;
  optimalMoistureMax: number;
  baseYield: number;
  reason: string;
};

export const suggestUnknownCropParams = (cropName: string): CropFallbackResult => {
  const name = cropName.trim().toLowerCase();

  // Невелика евристика за ключовими словами
  if (name.includes("ягод") || name.includes("berry")) {
    return {
      averageDaysToHarvest: 80,
      optimalMoistureMin: 65,
      optimalMoistureMax: 80,
      baseYield: 12,
      reason:
        "Для невідомої ягідної культури застосовано усереднені параметри з помірно підвищеною потребою у волозі.",
    };
  }

  if (
    name.includes("капуст") ||
    name.includes("cabbage") ||
    name.includes("лист")
  ) {
    return {
      averageDaysToHarvest: 90,
      optimalMoistureMin: 70,
      optimalMoistureMax: 85,
      baseYield: 18,
      reason:
        "Для невідомої листової або капустяної культури використано орієнтовні параметри з підвищеним рівнем вологості.",
    };
  }

  if (
    name.includes("перець") ||
    name.includes("томат") ||
    name.includes("огір") ||
    name.includes("овоч") ||
    name.includes("vegetable")
  ) {
    return {
      averageDaysToHarvest: 85,
      optimalMoistureMin: 60,
      optimalMoistureMax: 75,
      baseYield: 16,
      reason:
        "Для невідомої овочевої культури використано узагальнені параметри овочевої групи.",
    };
  }

  if (
    name.includes("зерн") ||
    name.includes("wheat") ||
    name.includes("barley") ||
    name.includes("corn")
  ) {
    return {
      averageDaysToHarvest: 120,
      optimalMoistureMin: 50,
      optimalMoistureMax: 65,
      baseYield: 10,
      reason:
        "Для невідомої зернової культури використано узагальнені параметри для польових культур.",
    };
  }

  return {
    averageDaysToHarvest: 90,
    optimalMoistureMin: 60,
    optimalMoistureMax: 70,
    baseYield: 15,
    reason:
      "Культура відсутня у довіднику, тому використано усереднені параметри для рослин загального призначення.",
  };
};
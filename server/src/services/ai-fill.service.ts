type MissingFieldInput = {
  region?: string;
  latitude?: number;
  longitude?: number;
  cropName?: string;
};

export const suggestSoilType = ({ region }: MissingFieldInput) => {
  if (!region) {
    return {
      field: "soilType",
      suggestedValue: "суглинок",
      confidence: 0.4,
      reason: "Регіон не вказано, тому використано нейтральне припущення.",
    };
  }

  const normalizedRegion = region.toLowerCase();

  if (
    normalizedRegion.includes("дніпро") ||
    normalizedRegion.includes("запор") ||
    normalizedRegion.includes("киров") ||
    normalizedRegion.includes("кропив")
  ) {
    return {
      field: "soilType",
      suggestedValue: "чорнозем",
      confidence: 0.8,
      reason: "Для цього регіону поширені чорноземні ґрунти.",
    };
  }

  if (
    normalizedRegion.includes("львів") ||
    normalizedRegion.includes("івано") ||
    normalizedRegion.includes("терноп")
  ) {
    return {
      field: "soilType",
      suggestedValue: "суглинок",
      confidence: 0.7,
      reason: "Для цього регіону часто зустрічаються суглинкові ґрунти.",
    };
  }

  return {
    field: "soilType",
    suggestedValue: "суглинок",
    confidence: 0.5,
    reason: "Для вказаного регіону використано типове припущення.",
  };
};

export const suggestOptimalMoisture = ({ cropName }: MissingFieldInput) => {
  const crop = (cropName || "").toLowerCase();

  if (crop.includes("томат") || crop.includes("tomato")) {
    return {
      field: "optimalMoisture",
      suggestedValue: "60-75%",
      confidence: 0.8,
      reason: "Для томатів доцільно підтримувати помірно вологий ґрунт.",
    };
  }

  if (crop.includes("огір") || crop.includes("cucumber")) {
    return {
      field: "optimalMoisture",
      suggestedValue: "70-85%",
      confidence: 0.8,
      reason: "Огірки потребують підвищеного рівня вологості.",
    };
  }

  if (crop.includes("картоп") || crop.includes("potato")) {
    return {
      field: "optimalMoisture",
      suggestedValue: "65-80%",
      confidence: 0.75,
      reason: "Для картоплі важливий стабільний рівень зволоження ґрунту.",
    };
  }

  return {
    field: "optimalMoisture",
    suggestedValue: "60-70%",
    confidence: 0.5,
    reason: "Застосовано узагальнене значення для овочевих культур.",
  };
};

export const suggestBaseYield = ({ cropName }: MissingFieldInput) => {
  const crop = (cropName || "").toLowerCase();

  if (crop.includes("томат") || crop.includes("tomato")) {
    return {
      field: "baseYield",
      suggestedValue: 25,
      confidence: 0.8,
      reason: "Для томатів використано типове базове значення урожайності.",
    };
  }

  if (crop.includes("огір") || crop.includes("cucumber")) {
    return {
      field: "baseYield",
      suggestedValue: 20,
      confidence: 0.75,
      reason: "Для огірків використано орієнтовне базове значення урожайності.",
    };
  }

  if (crop.includes("картоп") || crop.includes("potato")) {
    return {
      field: "baseYield",
      suggestedValue: 30,
      confidence: 0.8,
      reason: "Для картоплі використано типове базове значення урожайності.",
    };
  }

  return {
    field: "baseYield",
    suggestedValue: 15,
    confidence: 0.5,
    reason: "Застосовано узагальнене базове значення урожайності.",
  };
};
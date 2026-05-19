type SoilAdvisorInput = {
  soilType: string;
  confidence: number;
  latitude: number;
  longitude: number;
  source: string;
};

export const buildSoilSuggestionExplanation = ({
  soilType,
  confidence,
  latitude,
  longitude,
  source,
}: SoilAdvisorInput) => {
  const percent = Math.round(confidence * 100);

  return {
    field: "soilType",
    suggestedValue: soilType,
    confidence,
    reason: `Тип ґрунту визначено на основі зовнішнього джерела ${source} за координатами ${latitude}, ${longitude}. Орієнтовний рівень впевненості: ${percent}%.`,
  };
};
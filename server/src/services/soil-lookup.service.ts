import axios from "axios";

type SoilLookupResult = {
  source: string;
  soilType: string;
  confidence: number;
  raw?: unknown;
};

const extractSoilClass = (data: any): { soilType: string; confidence: number } => {
  /**
   * Оскільки API може повертати структуру з вкладеними полями,
   * робимо обережний пошук найімовірнішого ґрунтового класу.
   */

  // Найбільш типова логіка для класифікаційних відповідей:
  // шукаємо "most probable class" або перший клас у списку.
  if (data?.wrb_class_name) {
    return {
      soilType: String(data.wrb_class_name),
      confidence: Number(data.confidence ?? 0.7),
    };
  }

  if (data?.classification?.wrb_class_name) {
    return {
      soilType: String(data.classification.wrb_class_name),
      confidence: Number(data.classification.confidence ?? 0.7),
    };
  }

  if (Array.isArray(data?.classification) && data.classification.length > 0) {
    const first = data.classification[0];
    return {
      soilType: String(
        first?.wrb_class_name ??
        first?.name ??
        first?.class ??
        "невизначено"
      ),
      confidence: Number(first?.probability ?? first?.confidence ?? 0.6),
    };
  }

  if (Array.isArray(data?.classes) && data.classes.length > 0) {
    const first = data.classes[0];
    return {
      soilType: String(
        first?.wrb_class_name ??
        first?.name ??
        first?.class ??
        "невизначено"
      ),
      confidence: Number(first?.probability ?? first?.confidence ?? 0.6),
    };
  }

  return {
    soilType: "невизначено",
    confidence: 0,
  };
};

export const lookupSoilTypeByCoordinates = async (
  latitude: number,
  longitude: number
): Promise<SoilLookupResult> => {
  if (latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }

  const response = await axios.get(
    "https://rest.isric.org/soilgrids/v2.0/classification/query",
    {
      params: {
        lat: latitude,
        lon: longitude,
      },
      timeout: 15000,
    }
  );

  const parsed = extractSoilClass(response.data);

return {
  source: "SoilGrids",
  soilType: localizeSoilType(parsed.soilType),
  confidence: parsed.confidence,
  raw: response.data,
};
};

const soilTypeTranslations: Record<string, string> = {
  Cambisols: "Камбісоли",
  Chernozems: "Чорноземи",
  Phaeozems: "Феоземи",
  Luvisols: "Лювісоли",
  Podzols: "Підзоли",
  Arenosols: "Ареносоли",
  Fluvisols: "Флювісоли",
  Kastanozems: "Кастаноземи",
  Leptosols: "Лептосоли",
  Regosols: "Регосоли",
  Gleysols: "Глейсоли",
  Histosols: "Гістосоли",
};

const localizeSoilType = (soilType: string) => {
  return soilTypeTranslations[soilType] || soilType;
};
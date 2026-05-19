import axios from "axios";

type GeocodingResult = {
  latitude: number;
  longitude: number;
  displayName: string;
  source: string;
};

export const geocodeLocation = async (
  region: string,
  city?: string
): Promise<GeocodingResult> => {
  const query = [city, region].filter(Boolean).join(", ");

  if (!query.trim()) {
    throw new Error("Region or city is required for geocoding");
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not set");
  }

  const response = await axios.get(
    "http://api.openweathermap.org/geo/1.0/direct",
    {
      params: {
        q: query,
        limit: 1,
        appid: apiKey,
      },
      timeout: 15000,
    }
  );

  const data = response.data;

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Location not found");
  }

  const first = data[0];

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    displayName: [first.name, first.state, first.country]
      .filter(Boolean)
      .join(", "),
    source: "OpenWeather Geocoding API",
  };
};
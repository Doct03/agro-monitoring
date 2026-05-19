import axios from "axios";


export const fetchWeatherByCoordinates = async (latitude: number, longitude: number) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not set");
  }

  const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
    params: {
      lat: latitude,
      lon: longitude,
      appid: apiKey,
      units: "metric",
    },
  });

  const data = response.data;

  return {
    temperature: data.main.temp,
    humidity: data.main.humidity,
    rainfall: data.rain?.["1h"] ?? 0,
    windSpeed: data.wind?.speed ?? 0,
  };
};

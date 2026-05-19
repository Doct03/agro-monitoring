import { useEffect, useMemo, useState } from "react";
import { getPlots, getWeatherHistory, runMonitoringNow } from "../api/api";
import type { Plot, WeatherRecord } from "../types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const cardStyle: React.CSSProperties = {
  background: "white",
  padding: 20,
  borderRadius: 16,
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const statCardStyle: React.CSSProperties = {
  background: "white",
  padding: 18,
  borderRadius: 16,
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const WeatherChartPage = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadPlots = async () => {
      try {
        const data = await getPlots();
        setPlots(data);

        if (data.length > 0) {
          setSelectedPlotId(String(data[0].id));
        }
      } catch (error) {
        console.error("Plots load error:", error);
      }
    };

    loadPlots();
  }, []);

  useEffect(() => {
    const loadWeather = async () => {
      if (!selectedPlotId) return;

      setLoading(true);
      try {
        const history = await getWeatherHistory(Number(selectedPlotId));
        setWeatherData([...history].reverse());
      } catch (error) {
        console.error("Weather history load error:", error);
        setWeatherData([]);
      } finally {
        setLoading(false);
      }
    };

    loadWeather();
  }, [selectedPlotId]);

  const selectedPlot = useMemo(
    () => plots.find((plot) => plot.id === Number(selectedPlotId)),
    [plots, selectedPlotId]
  );

  const latestWeather =
    weatherData.length > 0 ? weatherData[weatherData.length - 1] : null;

  const chartData = weatherData.map((item) => ({
    time: new Date(item.recordedAt).toLocaleString(),
    temperature: item.temperature,
    rainfall: item.rainfall,
    humidity: item.humidity,
    windSpeed: item.windSpeed ?? 0,
  }));

  const handleRefreshWeather = async () => {
    try {
      setMessage("");
      const result = await runMonitoringNow();
      setMessage(result.message || "Моніторинг виконано");

      if (selectedPlotId) {
        const history = await getWeatherHistory(Number(selectedPlotId));
        setWeatherData([...history].reverse());
      }
    } catch (error) {
      console.error(error);
      setMessage("Помилка під час оновлення погодних даних");
    }
  };

  return (
    <div style={{color:"black"}}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 42, marginBottom: 8 }}>Моніторинг погодних умов</h1>
        <p style={{ color: "#475569", fontSize: 16 }}>
          Перегляд погодних показників для обраної ділянки.
        </p>
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "end",
          justifyContent: "space-between",
        }}
      >
        <div style={{ minWidth: 280, flex: 1 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Оберіть ділянку
          </label>
          <select
            value={selectedPlotId}
            onChange={(e) => setSelectedPlotId(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "white",
              color:"black",
            }}
          >
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name} ({plot.region})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRefreshWeather}
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            border: "none",
            background: "#16a34a",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Оновити дані
        </button>
      </div>

      {selectedPlot && (
        <div
          style={{
            ...cardStyle,
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginBottom: 12 }}>Інформація про ділянку</h3>
          <p style={{ margin: "6px 0" }}>
            <strong>Назва:</strong> {selectedPlot.name}
          </p>
          <p style={{ margin: "6px 0" }}>
            <strong>Регіон:</strong> {selectedPlot.region}
          </p>
          <p style={{ margin: "6px 0" }}>
            <strong>Тип ґрунту:</strong> {selectedPlot.soilType || "не вказано"}
          </p>
          <p style={{ margin: "6px 0" }}>
            <strong>Площа:</strong> {selectedPlot.area}
          </p>
        </div>
      )}

      {message && (
        <div
          style={{
            ...cardStyle,
            marginBottom: 20,
            border: "1px solid #d1fae5",
            background: "#f0fdf4",
            color: "#166534",
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div style={cardStyle}>
          <p>Завантаження погодних даних...</p>
        </div>
      ) : weatherData.length === 0 ? (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 12 }}>Немає погодних даних</h3>
          <p style={{ color: "#475569" }}>
            Для обраної ділянки ще немає погодних записів. Запусти оновлення даних,
            щоб побачити графіки температури та опадів.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div style={statCardStyle}>
              <div style={{ color: "#64748b", marginBottom: 8 }}>Температура</div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>
                {latestWeather?.temperature ?? "-"} °C
              </div>
            </div>

            <div style={statCardStyle}>
              <div style={{ color: "#64748b", marginBottom: 8 }}>Вологість повітря</div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>
                {latestWeather?.humidity ?? "-"} %
              </div>
            </div>

            <div style={statCardStyle}>
              <div style={{ color: "#64748b", marginBottom: 8 }}>Опади</div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>
                {latestWeather?.rainfall ?? "-"} мм
              </div>
            </div>

            <div style={statCardStyle}>
              <div style={{ color: "#64748b", marginBottom: 8 }}>Швидкість вітру</div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>
                {latestWeather?.windSpeed ?? "-"} м/с
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16 }}>Температура</h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" hide />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#2563eb"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginBottom: 16 }}>Опади</h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rainfall" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherChartPage;
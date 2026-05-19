import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCrops,
  getPlots,
  getRecommendations,
  getForecasts,
  runMonitoringNow,
} from "../api/api";

type DashboardStats = {
  plots: number;
  crops: number;
  recommendations: number;
  forecasts: number;
};

type Plot = {
  id: number;
  name: string;
  region?: string | null;
  soilType?: string | null;
  weatherRecords?: WeatherRecord[];
};

type WeatherRecord = {
  id: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  recordedAt: string;
};

type Recommendation = {
  id: number;
  message: string;
  recommendationType: string;
  createdAt: string;
  crop?: {
    name: string;
  } | null;
  plot?: {
    name: string;
    region?: string | null;
  } | null;
};

const getRecommendationTitle = (item: Recommendation) => {
  if (
    item.message &&
    item.message !== "irrigation" &&
    item.message !== "no_action" &&
    item.message !== "delay_irrigation"
  ) {
    return item.message;
  }

  if (item.recommendationType === "irrigation") return "Полив потрібен";
  if (item.recommendationType === "no_action")
    return "Додаткових дій не потрібно";
  if (item.recommendationType === "delay_irrigation")
    return "Полив варто відкласти";

  return "Рекомендація системи";
};

const getPriorityClass = (type: string) => {
  if (type === "irrigation") return "priority-high";
  if (type === "delay_irrigation") return "priority-medium";
  return "priority-low";
};

const getPriorityText = (type: string) => {
  if (type === "irrigation") return "Високий пріоритет";
  if (type === "delay_irrigation") return "Середній пріоритет";
  return "Низький пріоритет";
};

const getNumberValue = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "не вказано";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "не вказано";
  }

  return date.toLocaleString();
};

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    plots: 0,
    crops: 0,
    recommendations: 0,
    forecasts: 0,
  });

  const [plots, setPlots] = useState<Plot[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [message, setMessage] = useState("");

  const latestWeather = useMemo(() => {
    const weatherRecords = plots
      .flatMap((plot) =>
        (plot.weatherRecords || []).map((record) => ({
          ...record,
          plotName: plot.name,
          plotRegion: plot.region,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );

    return weatherRecords[0] || null;
  }, [plots]);

  const updates = useMemo(() => {
    const items: { title: string; time: string }[] = [];

    if (latestWeather) {
      items.push({
        title: "Оновлено погодні дані",
        time: formatDateTime(latestWeather.recordedAt),
      });
    }

    if (recommendations.length > 0) {
      items.push({
        title: "Сформовано рекомендації для культур",
        time: formatDateTime(recommendations[0].createdAt),
      });
    }

    if (stats.forecasts > 0) {
      items.push({
        title: "Сформовано прогнози урожайності",
        time: "Дані доступні на сторінці прогнозів",
      });
    }

    return items;
  }, [latestWeather, recommendations, stats.forecasts]);

  const loadDashboard = async () => {
    try {
      const [plotsData, crops, recommendationsData, forecasts] =
        await Promise.all([
          getPlots(),
          getCrops(),
          getRecommendations(),
          getForecasts(),
        ]);

      setPlots(plotsData);

      setStats({
        plots: plotsData.length,
        crops: crops.length,
        recommendations: recommendationsData.length,
        forecasts: forecasts.length,
      });

      setRecommendations(recommendationsData.slice(0, 3));
    } catch (error) {
      console.error("Dashboard load error:", error);
      setMessage("Не вдалося завантажити дані панелі.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRunMonitoring = async () => {
    if (stats.plots === 0) {
      setMessage("Спочатку додайте ділянку, щоб оновити погоду та рекомендації.");
      return;
    }

    try {
      setMonitoringLoading(true);
      setMessage("");

      await runMonitoringNow();
      await loadDashboard();

      setMessage("Погодні дані та рекомендації оновлено.");
    } catch (error) {
      console.error("Monitoring error:", error);
      setMessage("Помилка під час оновлення моніторингу.");
    } finally {
      setMonitoringLoading(false);
    }
  };

  if (loading) {
    return <p>Завантаження панелі...</p>;
  }

  return (
    <div className="dashboard-grid">
      <div className="page-header">
        <div>
          <h1 className="page-title">Панель моніторингу</h1>
          <p className="page-subtitle">
            Огляд стану системи агро-моніторингу.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={handleRunMonitoring}
          disabled={monitoringLoading || stats.plots === 0}
          title={
            stats.plots === 0
              ? "Спочатку додайте ділянку"
              : "Оновити погоду та рекомендації"
          }
        >
          {monitoringLoading
            ? "Оновлення..."
            : "↻ Оновити погоду та рекомендації"}
        </button>
      </div>

      {message && (
        <div
          style={{
            background: "#ecfdf5",
            color: "#166534",
            border: "1px solid #bbf7d0",
            padding: "12px 16px",
            borderRadius: 12,
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">▧</div>
          <div>
            <div className="stat-label">Кількість ділянок</div>
            <div className="stat-value">{stats.plots}</div>
            <div className="stat-note">
              {stats.plots > 0 ? "додано до системи" : "додайте першу ділянку"}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">♧</div>
          <div>
            <div className="stat-label">Кількість культур</div>
            <div className="stat-value">{stats.crops}</div>
            <div className="stat-note">
              {stats.crops > 0 ? "культури в обліку" : "культури відсутні"}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">◌</div>
          <div>
            <div className="stat-label">Рекомендації</div>
            <div className="stat-value">{stats.recommendations}</div>
            <div
              className="stat-note"
              style={{ color: stats.recommendations > 0 ? "#15803d" : "#64748b" }}
            >
              {stats.recommendations > 0
                ? "актуальні записи"
                : "поки відсутні"}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⌁</div>
          <div>
            <div className="stat-label">Прогнози врожайності</div>
            <div className="stat-value">{stats.forecasts}</div>
            <div
              className="stat-note"
              style={{ color: stats.forecasts > 0 ? "#15803d" : "#64748b" }}
            >
              {stats.forecasts > 0
                ? "сформовано прогнозів"
                : "прогнозів немає"}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-columns">
        <div className="panel-card">
          <div className="panel-header">
            <h3 className="panel-title">Останні рекомендації</h3>
            <Link to="/recommendations" className="secondary-button">
              Переглянути всі
            </Link>
          </div>

          <div className="recommendation-list">
            {recommendations.length === 0 ? (
              <div style={{ padding: "22px 0", color: "#64748b" }}>
                Рекомендації поки відсутні.
              </div>
            ) : (
              recommendations.map((item) => (
                <div className="recommendation-item" key={item.id}>
                  <div className="recommendation-icon">
                    {item.recommendationType === "irrigation" ? "💧" : "🌿"}
                  </div>

                  <div>
                    <div className="recommendation-name">
                      {item.crop?.name || "Культура не вказана"}
                    </div>
                    <div className="recommendation-text">
                      {getRecommendationTitle(item)}
                    </div>
                    <span
                      className={`priority-pill ${getPriorityClass(
                        item.recommendationType
                      )}`}
                    >
                      {getPriorityText(item.recommendationType)}
                    </span>
                  </div>

                  <div className="recommendation-date">
                    {new Date(item.createdAt).toLocaleDateString()}
                    <br />
                    {item.plot?.name || "Ділянка"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3 className="panel-title">Погодні умови</h3>
            <span style={{ color: "#64748b", fontSize: 14 }}>
              📍 {latestWeather?.plotName || "Поточна ділянка"}
            </span>
          </div>

          {latestWeather ? (
            <div className="weather-card-body">
              <div className="weather-main">
                <div>
                  <div className="weather-temp">
                    {getNumberValue(latestWeather.temperature)?.toFixed(0)}°C
                  </div>
                  <div className="weather-desc">
                    {latestWeather.plotRegion || "Останні погодні дані"}
                  </div>
                </div>

                <div className="weather-emoji">⛅</div>
              </div>

              <div className="weather-metrics">
                <div className="weather-metric">
                  <div className="weather-metric-label">Вологість</div>
                  <div className="weather-metric-value">
                    {getNumberValue(latestWeather.humidity)?.toFixed(0)}%
                  </div>
                </div>

                <div className="weather-metric">
                  <div className="weather-metric-label">Опади</div>
                  <div className="weather-metric-value">
                    {getNumberValue(latestWeather.rainfall)?.toFixed(1)} мм
                  </div>
                </div>

                <div className="weather-metric">
                  <div className="weather-metric-label">Вітер</div>
                  <div className="weather-metric-value">
                    {getNumberValue(latestWeather.windSpeed)?.toFixed(1)} м/с
                  </div>
                </div>

                <div className="weather-metric">
                  <div className="weather-metric-label">Джерело</div>
                  <div className="weather-metric-value">API</div>
                </div>
              </div>

              <div className="weather-updated">
                Оновлено: {formatDateTime(latestWeather.recordedAt)}
              </div>
            </div>
          ) : (
            <div style={{ padding: 22, color: "#64748b", lineHeight: 1.6 }}>
              Дані про погоду відсутні. Додайте ділянку та запустіть оновлення
              моніторингу.
            </div>
          )}
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3 className="panel-title">Швидкі дії</h3>
          </div>

          <div className="side-panel-body">
            <div className="quick-actions">
              <Link to="/plots/create" className="quick-action">
                ＋ Додати ділянку
              </Link>

              <Link to="/crops/create" className="quick-action">
                ＋ Додати культуру
              </Link>
            </div>

            <h3 className="panel-title" style={{ marginBottom: 14 }}>
              Останні оновлення
            </h3>

            <div className="update-list">
              {updates.length === 0 ? (
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  Оновлень поки немає. Додайте ділянку та запустіть моніторинг.
                </div>
              ) : (
                updates.map((item) => (
                  <div className="update-item" key={`${item.title}-${item.time}`}>
                    <div className="update-dot" />
                    <div>
                      <div className="update-title">{item.title}</div>
                      <div className="update-time">{item.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlotById } from "../api/api";

const formatDate = (value?: string | null) => {
  if (!value) return "не вказано";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "не вказано";
  }

  return date.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "не вказано";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "не вказано";
  }

  return date.toLocaleString();
};

const PlotDetailsPage = () => {
  const { id } = useParams();

  const [plot, setPlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadPlot = async () => {
      try {
        setLoading(true);
        setMessage("");

        const data = await getPlotById(Number(id));

        setPlot({
          ...data,
          crops: data.crops || [],
          weatherRecords: data.weatherRecords || [],
          recommendations: data.recommendations || [],
        });
      } catch (error: any) {
        console.error("Plot details load error:", error);
        setMessage(
          error?.response?.data?.message ||
            "Не вдалося завантажити детальну інформацію про ділянку."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPlot();
    }
  }, [id]);

  const latestWeather = plot?.weatherRecords?.[0] || null;

  const latestRecommendations = useMemo(() => {
    return plot?.recommendations?.slice(0, 5) || [];
  }, [plot]);

  const averageMoisture = useMemo(() => {
    const crops = plot?.crops || [];

    const values = crops
      .map((crop: any) => crop.moistureRecords?.[0]?.value)
      .filter((value: any) => value !== null && value !== undefined)
      .map(Number);

    if (values.length === 0) {
      return null;
    }

    return Math.round(
      values.reduce((sum: number, value: number) => sum + value, 0) /
        values.length
    );
  }, [plot]);

  if (loading) {
    return (
      <div className="details-page">
        <div className="details-loading">Завантаження...</div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="details-page">
        <h1 className="page-title">Детальна інформація про ділянку</h1>
        <div className="details-alert details-alert-error">{message}</div>
      </div>
    );
  }

  if (!plot) {
    return (
      <div className="details-page">
        <h1 className="page-title">Детальна інформація про ділянку</h1>
        <div className="details-alert">Ділянку не знайдено.</div>
      </div>
    );
  }

  return (
    <div className="details-page">
      <div className="details-hero plot-hero">
        <div>
          <div className="details-kicker">Детальна інформація про ділянку</div>
          <h1>{plot.name}</h1>

          <div className="details-meta">
            <span>📍 {plot.region || "регіон не вказано"}</span>
            <span>🌱 {plot.soilType || "тип ґрунту не вказано"}</span>
            <span>📐 {plot.area ?? "—"} га</span>
          </div>
        </div>

        <div className="details-hero-badge">
          <span>Координати</span>
          <strong>
            {plot.latitude && plot.longitude
              ? `${plot.latitude}, ${plot.longitude}`
              : "не вказано"}
          </strong>
        </div>
      </div>

      <div className="details-stats-grid">
        <div className="details-stat-card">
          <span>Кількість культур</span>
          <strong>{plot.crops.length}</strong>
          <p>культури на ділянці</p>
        </div>

        <div className="details-stat-card">
          <span>Середня вологість</span>
          <strong>{averageMoisture !== null ? `${averageMoisture}%` : "—"}</strong>
          <p>за останніми записами культур</p>
        </div>

        <div className="details-stat-card">
          <span>Поточна температура</span>
          <strong>
            {latestWeather ? `${latestWeather.temperature}°C` : "—"}
          </strong>
          <p>останні погодні дані</p>
        </div>

        <div className="details-stat-card">
          <span>Рекомендації</span>
          <strong>{plot.recommendations.length}</strong>
          <p>сформовані поради</p>
        </div>
      </div>

      <div className="details-grid details-grid-two">
        <section className="details-card">
          <div className="details-card-header">
            <div>
              <h3>Погодні умови</h3>
              <p>Останні отримані погодні дані для цієї ділянки.</p>
            </div>
            <span className="details-pill">API</span>
          </div>

          {latestWeather ? (
            <div className="weather-details-grid">
              <div>
                <span>Температура</span>
                <strong>{latestWeather.temperature} °C</strong>
              </div>

              <div>
                <span>Вологість повітря</span>
                <strong>{latestWeather.humidity} %</strong>
              </div>

              <div>
                <span>Опади</span>
                <strong>{latestWeather.rainfall} мм</strong>
              </div>

              <div>
                <span>Вітер</span>
                <strong>{latestWeather.windSpeed ?? 0} м/с</strong>
              </div>
            </div>
          ) : (
            <div className="details-empty">
              Погодні дані відсутні. Запустіть оновлення моніторингу.
            </div>
          )}

          {latestWeather && (
            <div className="details-card-footer">
              Оновлено: {formatDateTime(latestWeather.recordedAt)}
            </div>
          )}
        </section>

        <section className="details-card">
          <div className="details-card-header">
            <div>
              <h3>Останні рекомендації</h3>
              <p>Поради, сформовані системою моніторингу.</p>
            </div>
            <Link className="details-link" to="/recommendations">
              Усі
            </Link>
          </div>

          {latestRecommendations.length === 0 ? (
            <div className="details-empty">Рекомендації відсутні.</div>
          ) : (
            <div className="details-list">
              {latestRecommendations.map((item: any) => (
                <div className="details-list-item" key={item.id}>
                  <div className="details-list-icon">💧</div>

                  <div>
                    <strong>{item.title || item.recommendationType}</strong>
                    <p>{item.message || item.advice || "Опис відсутній"}</p>
                    <small>{formatDateTime(item.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="details-card">
        <div className="details-card-header">
          <div>
            <h3>Культури на ділянці</h3>
            <p>Перелік культур, які закріплені за цією ділянкою.</p>
          </div>

          <Link className="primary-button details-header-button" to="/crops/create">
            + Додати культуру
          </Link>
        </div>

        {plot.crops.length === 0 ? (
          <div className="details-empty">
            На цій ділянці ще не створено культур.
          </div>
        ) : (
          <div className="crop-details-grid">
            {plot.crops.map((crop: any) => {
              const latestMoisture = crop.moistureRecords?.[0];

              return (
                <Link
                  to={`/crops/${crop.id}`}
                  className="crop-mini-card"
                  key={crop.id}
                >
                  <div className="crop-mini-icon">🌿</div>

                  <div className="crop-mini-body">
                    <strong>{crop.name}</strong>
                    <span>Посадка: {formatDate(crop.plantingDate)}</span>
                    <span>Стадія: {crop.growthStage || "не вказано"}</span>
                  </div>

                  <div className="crop-mini-side">
                    <span>Вологість</span>
                    <strong>
                      {latestMoisture ? `${latestMoisture.value}%` : "—"}
                    </strong>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default PlotDetailsPage;
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { generateForecastsForAllCrops, getForecasts } from "../api/api";

type Forecast = {
  id: number;
  expectedYield: number;
  confidence?: number | string | null;
  confidenceLevel?: number | string | null;
  confidenceScore?: number | string | null;
  explanation?: string | null;
  notes?: string | null;
  createdAt: string;
  crop?: {
    id: number;
    name: string;
    baseYield?: number | null;
    optimalMoistureMin?: number | null;
    optimalMoistureMax?: number | null;
    moistureRecords?: {
      id: number;
      value: number;
      source?: string | null;
      recordedAt: string;
    }[];
    plot?: {
      id: number;
      name: string;
      region?: string | null;
      soilType?: string | null;
      area?: number | null;
      weatherRecords?: {
        id: number;
        temperature: number;
        humidity: number;
        rainfall: number;
        windSpeed: number;
        recordedAt: string;
      }[];
    } | null;
  } | null;
  plot?: {
    id: number;
    name: string;
    region?: string | null;
    soilType?: string | null;
    area?: number | null;
  } | null;
};

const getConfidenceValue = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const resolveForecastConfidence = (forecast: Forecast) => {
  return getConfidenceValue(
    forecast.confidence ??
      forecast.confidenceLevel ??
      forecast.confidenceScore
  );
};

const getYieldValue = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const formatNumber = (value: unknown, digits = 1) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(digits) : "—";
};

const formatDate = (value?: string | null) => {
  if (!value) return "не вказано";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "не вказано";
  }

  return date.toLocaleString();
};

const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 0.8) return "Висока";
  if (confidence >= 0.6) return "Середня";
  return "Низька";
};

const getConfidenceClass = (confidence: number) => {
  if (confidence >= 0.8) return "forecast-confidence-high";
  if (confidence >= 0.6) return "forecast-confidence-medium";
  return "forecast-confidence-low";
};

const getLatestMoisture = (forecast: Forecast) => {
  return forecast.crop?.moistureRecords?.[0] || null;
};

const getLatestWeather = (forecast: Forecast) => {
  return forecast.crop?.plot?.weatherRecords?.[0] || null;
};

const getForecastPlot = (forecast: Forecast) => {
  return forecast.plot || forecast.crop?.plot || null;
};

const getMoistureStatus = (
  moisture: number | null | undefined,
  min?: number | null,
  max?: number | null
) => {
  if (moisture === null || moisture === undefined) {
    return "Дані відсутні";
  }

  if (min !== null && min !== undefined && moisture < min) {
    return "Нижче оптимуму";
  }

  if (max !== null && max !== undefined && moisture > max) {
    return "Вище оптимуму";
  }

  return "У межах норми";
};

const getForecastAdvice = (forecast: Forecast, confidence: number) => {
  const moistureRecord = getLatestMoisture(forecast);
  const weather = getLatestWeather(forecast);
  const moisture = moistureRecord?.value;

  const min = forecast.crop?.optimalMoistureMin;

  if (confidence < 0.6) {
    return "Для підвищення точності бажано додати більше даних про вологість ґрунту та погодні умови.";
  }

  if (
    moisture !== undefined &&
    min !== undefined &&
    min !== null &&
    moisture < min
  ) {
    return "Рівень вологості нижчий за оптимальний. Варто перевірити потребу в поливі.";
  }

  if (weather && Number(weather.rainfall) > 5) {
    return "Зафіксовано опади, тому додатковий полив може бути недоцільним.";
  }

  return "Прогноз можна використовувати як орієнтовну оцінку для планування робіт.";
};

const ForecastsPage = () => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedPlot, setSelectedPlot] = useState("all");
  const [selectedCrop, setSelectedCrop] = useState("all");
  const [selectedConfidence, setSelectedConfidence] = useState("all");

  const loadForecasts = async () => {
    try {
      const data = await getForecasts();
      setForecasts(data);
    } catch (error) {
      console.error("Forecasts load error:", error);
      setMessage("Не вдалося завантажити прогнози.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecasts();
  }, []);

  const plotOptions = useMemo(() => {
    const map = new Map<number, string>();

    forecasts.forEach((forecast) => {
      const plot = getForecastPlot(forecast);

      if (plot?.id) {
        map.set(plot.id, plot.name);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [forecasts]);

  const cropOptions = useMemo(() => {
    const map = new Map<number, string>();

    forecasts.forEach((forecast) => {
      if (forecast.crop?.id) {
        map.set(forecast.crop.id, forecast.crop.name);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [forecasts]);

  const filteredForecasts = useMemo(() => {
    return forecasts.filter((forecast) => {
      const plot = getForecastPlot(forecast);
      const confidence = resolveForecastConfidence(forecast);

      const plotMatches =
        selectedPlot === "all" || String(plot?.id) === selectedPlot;

      const cropMatches =
        selectedCrop === "all" || String(forecast.crop?.id) === selectedCrop;

      const confidenceMatches =
        selectedConfidence === "all" ||
        (selectedConfidence === "high" && confidence >= 0.8) ||
        (selectedConfidence === "medium" &&
          confidence >= 0.6 &&
          confidence < 0.8) ||
        (selectedConfidence === "low" && confidence < 0.6);

      return plotMatches && cropMatches && confidenceMatches;
    });
  }, [forecasts, selectedPlot, selectedCrop, selectedConfidence]);

  const metrics = useMemo(() => {
    const total = filteredForecasts.length;

    const averageYield =
      total > 0
        ? filteredForecasts.reduce(
            (sum, item) => sum + getYieldValue(item.expectedYield),
            0
          ) / total
        : 0;

    const averageConfidence =
      total > 0
        ? filteredForecasts.reduce(
            (sum, item) => sum + resolveForecastConfidence(item),
            0
          ) / total
        : 0;

    const maxYield =
      total > 0
        ? Math.max(
            ...filteredForecasts.map((item) =>
              getYieldValue(item.expectedYield)
            )
          )
        : 0;

    return {
      total,
      averageYield,
      averageConfidence,
      maxYield,
    };
  }, [filteredForecasts]);

  const resetFilters = () => {
    setSelectedPlot("all");
    setSelectedCrop("all");
    setSelectedConfidence("all");
  };

  const handleGenerateForecasts = async () => {
    try {
      setGenerating(true);
      setMessage("");

      const result = await generateForecastsForAllCrops();

      setMessage(
        result?.created !== undefined
          ? `Сформовано прогнозів: ${result.created}`
          : "Прогнози урожайності сформовано."
      );

      await loadForecasts();
    } catch (error: any) {
      console.error("Generate forecasts error:", error);

      setMessage(
        error?.response?.data?.message ||
          "Не вдалося сформувати прогнози урожайності."
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <p>Завантаження прогнозів...</p>;
  }

  return (
    <div>
      <div className="resource-header">
        <div>
          <h1 className="page-title">Прогнози урожайності</h1>
          <p className="page-subtitle">
            Аналіз очікуваної врожайності з можливістю фільтрації за ділянками
            та культурами.
          </p>
        </div>

        <div className="resource-actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleGenerateForecasts}
            disabled={generating}
          >
            {generating ? "Формування..." : "+ Сформувати прогнози"}
          </button>
        </div>
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
            marginBottom: 20,
          }}
        >
          {message}
        </div>
      )}

      <div className="forecast-filters panel-card">
        <div className="forecast-filter-item">
          <label>Ділянка</label>
          <select
            value={selectedPlot}
            onChange={(event) => setSelectedPlot(event.target.value)}
          >
            <option value="all">Усі ділянки</option>
            {plotOptions.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name}
              </option>
            ))}
          </select>
        </div>

        <div className="forecast-filter-item">
          <label>Культура</label>
          <select
            value={selectedCrop}
            onChange={(event) => setSelectedCrop(event.target.value)}
          >
            <option value="all">Усі культури</option>
            {cropOptions.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </select>
        </div>

        <div className="forecast-filter-item">
          <label>Рівень впевненості</label>
          <select
            value={selectedConfidence}
            onChange={(event) => setSelectedConfidence(event.target.value)}
          >
            <option value="all">Усі рівні</option>
            <option value="high">Висока</option>
            <option value="medium">Середня</option>
            <option value="low">Низька</option>
          </select>
        </div>

        <div className="forecast-filter-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={resetFilters}
          >
            ↻ Скинути фільтри
          </button>
        </div>
      </div>

      <div className="forecast-metrics">
        <div className="stat-card">
          <div className="stat-icon">⌁</div>
          <div>
            <div className="stat-label">Кількість прогнозів</div>
            <div className="stat-value">{metrics.total}</div>
            <div className="stat-note">за поточним фільтром</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🌾</div>
          <div>
            <div className="stat-label">Середня врожайність</div>
            <div className="stat-value">{metrics.averageYield.toFixed(1)}</div>
            <div className="stat-note">орієнтовне значення</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div>
            <div className="stat-label">Середня впевненість</div>
            <div className="stat-value">
              {(metrics.averageConfidence * 100).toFixed(0)}%
            </div>
            <div className="stat-note">за прогнозами</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↑</div>
          <div>
            <div className="stat-label">Найвищий прогноз</div>
            <div className="stat-value">{metrics.maxYield.toFixed(1)}</div>
            <div className="stat-note">максимальне значення</div>
          </div>
        </div>
      </div>

      {filteredForecasts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌾</div>
          <div className="empty-state-title">Прогнози відсутні</div>
          <div className="empty-state-text">
            Для вибраних фільтрів прогнозів поки немає.
          </div>
        </div>
      ) : (
        <div className="forecast-list">
          {filteredForecasts.map((forecast) => {
            const plot = getForecastPlot(forecast);
            const weather = getLatestWeather(forecast);
            const moistureRecord = getLatestMoisture(forecast);
            const confidence = resolveForecastConfidence(forecast);
            const expectedYield = getYieldValue(forecast.expectedYield);

            const moistureStatus = getMoistureStatus(
              moistureRecord?.value,
              forecast.crop?.optimalMoistureMin,
              forecast.crop?.optimalMoistureMax
            );

            return (
              <div className="forecast-card" key={forecast.id}>
                <div className="forecast-card-header">
                  <div>
                    <div className="forecast-crop">
                      {forecast.crop?.id ? (
                        <Link
                          to={`/crops/${forecast.crop.id}`}
                          className="forecast-link"
                        >
                          {forecast.crop.name}
                        </Link>
                      ) : (
                        "Культура не вказана"
                      )}
                    </div>

                    <div className="forecast-plot">
                      {plot?.id ? (
                        <>
                          Ділянка:{" "}
                          <Link
                            to={`/plots/${plot.id}`}
                            className="forecast-sub-link"
                          >
                            {plot.name}
                          </Link>
                        </>
                      ) : (
                        "Ділянка не вказана"
                      )}
                      {plot?.region ? ` · ${plot.region}` : ""}
                    </div>
                  </div>

                  <span
                    className={`forecast-confidence ${getConfidenceClass(
                      confidence
                    )}`}
                  >
                    {getConfidenceLabel(confidence)} впевненість
                  </span>
                </div>

                <div className="forecast-main-grid">
                  <div className="forecast-yield-box">
                    <span>Очікувана врожайність</span>
                    <strong>{expectedYield.toFixed(1)}</strong>
                    <small>орієнтовне значення</small>
                  </div>

                  <div className="forecast-info-card">
                    <span>Рівень впевненості</span>
                    <strong>{(confidence * 100).toFixed(0)}%</strong>
                    <div className="forecast-progress">
                      <div
                        style={{
                          width: `${Math.min(confidence * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="forecast-info-card">
                    <span>Ділянка</span>
                    <strong>{plot?.name || "не вказано"}</strong>
                    <small>
                      {plot?.area ? `${plot.area} га` : "площа не вказана"}
                    </small>
                  </div>

                  <div className="forecast-info-card">
                    <span>Тип ґрунту</span>
                    <strong>{plot?.soilType || "не визначено"}</strong>
                    <small>{plot?.region || "регіон не вказано"}</small>
                  </div>
                </div>

                <div className="forecast-conditions-grid">
                  <div className="forecast-condition-card">
                    <div className="condition-icon">💧</div>
                    <div>
                      <span>Вологість ґрунту</span>
                      <strong>
                        {moistureRecord
                          ? `${formatNumber(moistureRecord.value, 0)}%`
                          : "—"}
                      </strong>
                      <small>{moistureStatus}</small>
                    </div>
                  </div>

                  <div className="forecast-condition-card">
                    <div className="condition-icon">🌡️</div>
                    <div>
                      <span>Температура</span>
                      <strong>
                        {weather
                          ? `${formatNumber(weather.temperature, 1)}°C`
                          : "—"}
                      </strong>
                      <small>останні погодні дані</small>
                    </div>
                  </div>

                  <div className="forecast-condition-card">
                    <div className="condition-icon">🌧️</div>
                    <div>
                      <span>Опади</span>
                      <strong>
                        {weather
                          ? `${formatNumber(weather.rainfall, 1)} мм`
                          : "—"}
                      </strong>
                      <small>за даними погоди</small>
                    </div>
                  </div>

                  <div className="forecast-condition-card">
                    <div className="condition-icon">💨</div>
                    <div>
                      <span>Вітер</span>
                      <strong>
                        {weather
                          ? `${formatNumber(weather.windSpeed, 1)} м/с`
                          : "—"}
                      </strong>
                      <small>
                        {weather
                          ? `оновлено ${formatDate(weather.recordedAt)}`
                          : "дані відсутні"}
                      </small>
                    </div>
                  </div>
                </div>

                <div className="forecast-explanation">
                  {forecast.notes ||
                    forecast.explanation ||
                    "Розрахунок виконано на основі площі, типу ґрунту, рівня вологості, погодних умов та базових параметрів культури."}
                </div>

                <div className="forecast-advice">
                  <strong>Рекомендація:</strong>{" "}
                  {getForecastAdvice(forecast, confidence)}
                </div>

                <div className="forecast-date">
                  Дата розрахунку: {formatDate(forecast.createdAt)}
                </div>

                <div className="forecast-card-actions">
                  {forecast.crop?.id && (
                    <Link
                      to={`/crops/${forecast.crop.id}`}
                      className="card-button primary"
                    >
                      Перейти до культури
                    </Link>
                  )}

                  {plot?.id && (
                    <Link to={`/plots/${plot.id}`} className="card-button">
                      Перейти до ділянки
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ForecastsPage;
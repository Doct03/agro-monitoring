import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createIoTSensor,
  createTestIoTReading,
  disableIoTSensor,
  getCropById,
  getIoTSensors,
} from "../api/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const getIoTEndpoint = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return `${apiUrl.replace(/\/$/, "")}/iot/moisture`;
};

const CropDetailsPage = () => {
  const { id } = useParams();

  const [crop, setCrop] = useState<any>(null);
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [iotLoading, setIotLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [iotMessage, setIotMessage] = useState("");

  const cropId = Number(id);

  const loadCrop = async () => {
    try {
      setLoading(true);
      setMessage("");

      const [cropData, sensorsData] = await Promise.all([
        getCropById(cropId),
        getIoTSensors(),
      ]);

      setCrop({
        ...cropData,
        moistureRecords: cropData.moistureRecords || [],
        recommendations: cropData.recommendations || [],
        yieldForecasts: cropData.yieldForecasts || cropData.forecasts || [],
        plot: cropData.plot
          ? {
              ...cropData.plot,
              weatherRecords: cropData.plot.weatherRecords || [],
            }
          : null,
      });

      setSensors(
        (sensorsData || []).filter(
          (sensor: any) => Number(sensor.cropId) === cropId
        )
      );
    } catch (error: any) {
      console.error("Crop details load error:", error);
      setMessage(
        error?.response?.data?.message ||
          "Не вдалося завантажити детальну інформацію про культуру."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadCrop();
    }
  }, [id]);

  const moistureRecords = crop?.moistureRecords || [];
  const recommendations = crop?.recommendations || [];
  const yieldForecasts = crop?.yieldForecasts || crop?.forecasts || [];

  const activeSensor = sensors.find((sensor) => sensor.isActive) || null;

  const moistureChartData = useMemo(() => {
    return [...moistureRecords].reverse().map((item: any) => ({
      time: formatDateTime(item.recordedAt),
      moisture: Number(item.value),
    }));
  }, [moistureRecords]);

  const latestMoisture =
    moistureRecords.length > 0 ? moistureRecords[0] : null;

  const latestForecast =
    yieldForecasts.length > 0 ? yieldForecasts[0] : null;

  const handleCreatePhysicalSensor = async () => {
    if (!crop) return;

    try {
      setIotLoading(true);
      setIotMessage("");

      await createIoTSensor({
        cropId: crop.id,
        name: `Фізичний датчик вологості: ${crop.name}`,
        mode: "physical",
      });

      await loadCrop();

      setIotMessage(
  "Фізичний датчик зареєстровано. Скопіюйте endpoint і API key у налаштування пристрою. Статус зміниться після першого отриманого показника."
);
    } catch (error: any) {
      console.error("Create physical IoT sensor error:", error);
      setIotMessage(
        error?.response?.data?.message || "Не вдалося створити IoT-датчик."
      );
    } finally {
      setIotLoading(false);
    }
  };

  const handleCreateSimulatedSensor = async () => {
    if (!crop) return;

    try {
      setIotLoading(true);
      setIotMessage("");

      await createIoTSensor({
        cropId: crop.id,
        name: `Віртуальний датчик вологості: ${crop.name}`,
        mode: "simulated",
      });

      await loadCrop();

      setIotMessage(
        "Віртуальний IoT-датчик створено. Його можна використовувати для демонстрації без фізичного пристрою."
      );
    } catch (error: any) {
      console.error("Create simulated IoT sensor error:", error);
      setIotMessage(
        error?.response?.data?.message || "Не вдалося створити IoT-датчик."
      );
    } finally {
      setIotLoading(false);
    }
  };

  const handleDisableSensor = async (sensorId: number) => {
    try {
      setIotLoading(true);
      setIotMessage("");

      await disableIoTSensor(sensorId);
      await loadCrop();

      setIotMessage("IoT-датчик вимкнено.");
    } catch (error: any) {
      console.error("Disable IoT sensor error:", error);
      setIotMessage(
        error?.response?.data?.message || "Не вдалося вимкнути IoT-датчик."
      );
    } finally {
      setIotLoading(false);
    }
  };

  const handleTestReading = async (sensorId: number) => {
    try {
      setIotLoading(true);
      setIotMessage("");

      await createTestIoTReading(sensorId);
      await loadCrop();

      setIotMessage(
        "Тестове значення вологості надіслано. Графік вологості оновлено."
      );
    } catch (error: any) {
      console.error("Test IoT reading error:", error);
      setIotMessage(
        error?.response?.data?.message ||
          "Не вдалося надіслати тестове значення."
      );
    } finally {
      setIotLoading(false);
    }
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIotMessage(successMessage);
    } catch {
      setIotMessage("Не вдалося скопіювати значення.");
    }
  };

  if (loading) {
    return <p>Завантаження...</p>;
  }

  if (message) {
    return (
      <div>
        <h1 className="page-title">Детальна інформація про культуру</h1>
        <div
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            padding: "12px 16px",
            borderRadius: 12,
            fontWeight: 700,
            marginTop: 16,
          }}
        >
          {message}
        </div>
      </div>
    );
  }

  if (!crop) {
    return <p>Культуру не знайдено</p>;
  }

  return (
    <div className="details-page crop-details-page">
      <div className="details-hero crop-hero">
  <div>
    <div className="details-kicker">Детальна інформація про культуру</div>
    <h1>{crop.name}</h1>

    <div className="details-meta">
      <span>🌱 {crop.growthStage || "стадія не вказана"}</span>
      <span>📍 {crop.plot?.name || "ділянка не вказана"}</span>
      <span>🌍 {crop.plot?.region || "регіон не вказано"}</span>
    </div>
  </div>

  <div className="details-hero-badge">
    <span>Оптимальна вологість</span>
    <strong>
      {crop.optimalMoistureMin !== null &&
      crop.optimalMoistureMin !== undefined &&
      crop.optimalMoistureMax !== null &&
      crop.optimalMoistureMax !== undefined
        ? `${crop.optimalMoistureMin}% – ${crop.optimalMoistureMax}%`
        : "не вказано"}
    </strong>
  </div>
</div>

      <div className="details-card">
        <h2>{crop.name}</h2>
        <p>Дата посадки: {formatDate(crop.plantingDate)}</p>
        <p>Стадія росту: {crop.growthStage || "не вказано"}</p>
        <p>
          Очікувана дата збору:{" "}
          {crop.expectedHarvestDate
            ? formatDate(crop.expectedHarvestDate)
            : "не вказано"}
        </p>
        <p>Ділянка: {crop.plot?.name || "не вказано"}</p>
        <p>Регіон: {crop.plot?.region || "не вказано"}</p>
        <p>Тип ґрунту: {crop.plot?.soilType || "не вказано"}</p>
      </div>

      <div className="details-card">
        <h3>Агропараметри культури</h3>
        <p>
          Базова урожайність:{" "}
          {crop.baseYield !== null && crop.baseYield !== undefined
            ? crop.baseYield
            : "не вказано"}
        </p>
        <p>
          Оптимальна вологість:{" "}
          {crop.optimalMoistureMin !== null &&
          crop.optimalMoistureMin !== undefined &&
          crop.optimalMoistureMax !== null &&
          crop.optimalMoistureMax !== undefined
            ? `${crop.optimalMoistureMin}% – ${crop.optimalMoistureMax}%`
            : "не вказано"}
        </p>
        <p>
          Остання зафіксована вологість:{" "}
          {latestMoisture ? `${latestMoisture.value}%` : "дані відсутні"}
        </p>
      </div>

      <div className="details-card">
        <div className="iot-header">
          <div>
            <h3>IoT-датчик вологості ґрунту</h3>
            <p>
              Підключіть фізичний датчик або використайте віртуальний режим для
              демонстрації. Обидва варіанти надсилають показники в один API.
            </p>
          </div>

         <div className="iot-status">
  {!activeSensor
    ? "Не зареєстровано"
    : activeSensor.lastSeenAt
    ? "Підключений"
    : "Очікує перше підключення"}
</div>
        </div>

        {iotMessage && (
          <div className="iot-message">
            {iotMessage}
          </div>
        )}

        {!activeSensor ? (
          <div className="iot-empty">
            <div>
              <strong>Датчик для цієї культури ще не створено.</strong>
              <p>
                Для реального пристрою створіть фізичний датчик і скопіюйте API
                key у прошивку або налаштування пристрою.
              </p>
            </div>

            <div className="iot-actions">
              <button
                className="primary-button"
                type="button"
                onClick={handleCreatePhysicalSensor}
                disabled={iotLoading}
              >
                Зареєструвати фізичний датчик
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={handleCreateSimulatedSensor}
                disabled={iotLoading}
              >
                Створити віртуальний датчик
              </button>
            </div>
          </div>
        ) : (
          <div className="iot-box">
            <div className="iot-info-grid">
              <div>
                <span>Назва</span>
                <strong>{activeSensor.name}</strong>
              </div>

              <div>
                <span>Режим</span>
                <strong>
                  {activeSensor.mode === "physical"
                    ? "Фізичний датчик"
                    : "Віртуальний датчик"}
                </strong>
              </div>

              <div>
                <span>Остання активність</span>
                <strong>{formatDateTime(activeSensor.lastSeenAt)}</strong>
              </div>

              <div>
                <span>Статус</span>
                <strong>
  {!activeSensor.isActive
    ? "Вимкнений"
    : activeSensor.lastSeenAt
    ? "Підключений"
    : "Очікує даних від пристрою"}
</strong>
              </div>
            </div>

            <div className="iot-connect-block">
              <label>Endpoint для пристрою</label>

              <div className="iot-copy-row">
                <code>{getIoTEndpoint()}</code>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    copyText(getIoTEndpoint(), "Endpoint скопійовано.")
                  }
                >
                  Копіювати
                </button>
              </div>
            </div>

            <div className="iot-connect-block">
              <label>API key датчика</label>

              <div className="iot-copy-row">
                <code>{activeSensor.apiKey}</code>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    copyText(activeSensor.apiKey, "API key скопійовано.")
                  }
                >
                  Копіювати
                </button>
              </div>
            </div>

            <div className="iot-payload">
              <div>
                <strong>Формат даних для фізичного пристрою</strong>
                <p>
                  Датчик має надсилати POST-запит у форматі JSON. Обов’язкові
                  поля: <code>sensorKey</code> і <code>value</code>.
                </p>
              </div>

              <pre>{`{
  "sensorKey": "${activeSensor.apiKey}",
  "value": 43.7,
  "battery": 86,
  "temperature": 22.1
}`}</pre>
            </div>

            <div className="iot-actions">
              {activeSensor.mode === "simulated" && (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => handleTestReading(activeSensor.id)}
                  disabled={iotLoading}
                >
                  Надіслати тестове значення
                </button>
              )}

              <button
                className="secondary-button"
                type="button"
                onClick={() => handleDisableSensor(activeSensor.id)}
                disabled={iotLoading}
              >
                Вимкнути датчик
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="details-card">
        <h3>Історія вологості</h3>

        {moistureChartData.length === 0 ? (
          <p>Дані вологості відсутні</p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moistureChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="moisture"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="details-card">
        <h3>Останні рекомендації</h3>

        {recommendations.length === 0 ? (
          <p>Рекомендації відсутні</p>
        ) : (
          recommendations.slice(0, 5).map((item: any) => (
            <div key={item.id} style={{ marginBottom: 12 }}>
              <strong>{item.recommendationType}</strong>
              <p>{item.message}</p>
              {item.explanation && <p>{item.explanation}</p>}
              {item.advice && <p>{item.advice}</p>}
              <small>{formatDateTime(item.createdAt)}</small>
            </div>
          ))
        )}
      </div>

      <div className="details-card">
        <h3>Прогноз урожайності</h3>

        {latestForecast ? (
          <div>
            <p>
              <strong>Останній прогноз:</strong>{" "}
              {latestForecast.expectedYield}
            </p>
            <p>
              Рівень впевненості:{" "}
              {latestForecast.confidenceLevel ?? "не вказано"}
            </p>
            <p>{latestForecast.notes || "Пояснення відсутнє"}</p>
            <small>{formatDateTime(latestForecast.createdAt)}</small>
          </div>
        ) : (
          <p>Прогнози відсутні</p>
        )}

        {yieldForecasts.length > 1 && (
          <div style={{ marginTop: 16 }}>
            <h4>Попередні прогнози</h4>

            {yieldForecasts.slice(1, 5).map((item: any) => (
              <div key={item.id} style={{ marginBottom: 10 }}>
                <strong>{item.expectedYield}</strong>
                <p>{item.notes || "Пояснення відсутнє"}</p>
                <small>{formatDateTime(item.createdAt)}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropDetailsPage;
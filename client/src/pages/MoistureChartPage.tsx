import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { getCrops, getMoistureHistory } from "../api/api";

type Crop = {
  id: number;
  name: string;
  optimalMoistureMin?: number | null;
  optimalMoistureMax?: number | null;
  plot?: {
    id: number;
    name: string;
    region?: string | null;
    soilType?: string | null;
  } | null;
};

type MoistureRecord = {
  id: number;
  cropId: number;
  value: number;
  source?: string | null;
  recordedAt: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "не вказано";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "не вказано";
  }

  return date.toLocaleString();
};

const getNumberValue = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getMoistureStatus = (
  value: number | null,
  min?: number | null,
  max?: number | null
) => {
  if (value === null) {
    return {
      label: "Дані відсутні",
      className: "moisture-status-muted",
      text: "Для цієї культури ще немає записів вологості ґрунту.",
    };
  }

  if (min !== null && min !== undefined && value < min) {
    return {
      label: "Нижче оптимуму",
      className: "moisture-status-low",
      text: "Рівень вологості нижчий за оптимальний. Варто перевірити потребу в поливі.",
    };
  }

  if (max !== null && max !== undefined && value > max) {
    return {
      label: "Вище оптимуму",
      className: "moisture-status-high",
      text: "Рівень вологості вищий за оптимальний. Надмірний полив може негативно впливати на культуру.",
    };
  }

  return {
    label: "У межах норми",
    className: "moisture-status-normal",
    text: "Поточний рівень вологості знаходиться в межах оптимального діапазону для культури.",
  };
};

const MoistureChartPage = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [records, setRecords] = useState<MoistureRecord[]>([]);
  const [selectedCropId, setSelectedCropId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const selectedCrop = useMemo(() => {
    return crops.find((crop) => String(crop.id) === selectedCropId) || null;
  }, [crops, selectedCropId]);

  const selectedRecords = useMemo(() => {
    if (!selectedCropId) return [];

    return records
      .filter((record) => String(record.cropId) === selectedCropId)
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      );
  }, [records, selectedCropId]);

  const chartData = useMemo(() => {
    return selectedRecords.map((record) => ({
      date: formatDate(record.recordedAt),
      shortDate: new Date(record.recordedAt).toLocaleDateString(),
      moisture: getNumberValue(record.value),
      source: record.source || "невідомо",
    }));
  }, [selectedRecords]);

  const metrics = useMemo(() => {
    if (selectedRecords.length === 0) {
      return {
        latest: null as number | null,
        min: null as number | null,
        max: null as number | null,
        average: null as number | null,
        latestDate: null as string | null,
      };
    }

    const values = selectedRecords.map((record) => getNumberValue(record.value));

    const latestRecord = selectedRecords[selectedRecords.length - 1];

    return {
      latest: getNumberValue(latestRecord.value),
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      latestDate: latestRecord.recordedAt,
    };
  }, [selectedRecords]);

  const status = getMoistureStatus(
    metrics.latest,
    selectedCrop?.optimalMoistureMin,
    selectedCrop?.optimalMoistureMax
  );

  useEffect(() => {
  const loadCrops = async () => {
    try {
      const cropsData = await getCrops();

      setCrops(cropsData);

      if (cropsData.length > 0) {
        setSelectedCropId(String(cropsData[0].id));
      }
    } catch (error) {
      console.error("Crops load error:", error);
      setMessage("Не вдалося завантажити культури.");
    } finally {
      setLoading(false);
    }
  };

  loadCrops();
}, []);

useEffect(() => {
  const loadMoistureHistory = async () => {
    if (!selectedCropId) {
      setRecords([]);
      return;
    }

    try {
      setMessage("");

      const history = await getMoistureHistory(Number(selectedCropId));

      const normalizedHistory = history.map((record: any) => ({
        ...record,
        cropId: record.cropId ?? Number(selectedCropId),
      }));

      setRecords(normalizedHistory);
    } catch (error) {
      console.error("Moisture history load error:", error);
      setRecords([]);
      setMessage(
        "Не вдалося завантажити історію вологості для вибраної культури."
      );
    }
  };

  loadMoistureHistory();
}, [selectedCropId]);

  if (loading) {
    return <p>Завантаження графіка вологості...</p>;
  }

  return (
    <div>
      <div className="resource-header">
        <div>
          <h1 className="page-title">Графік вологості ґрунту</h1>
          <p className="page-subtitle">
            Аналіз динаміки вологості ґрунту для вибраної культури.
          </p>
        </div>
      </div>

      {message && (
        <div
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            padding: "12px 16px",
            borderRadius: 12,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          {message}
        </div>
      )}

      <div className="moisture-toolbar panel-card">
        <div className="moisture-select-group">
          <label>Культура</label>
          <select
            value={selectedCropId}
            onChange={(event) => setSelectedCropId(event.target.value)}
          >
            {crops.length === 0 ? (
              <option value="">Культури відсутні</option>
            ) : (
              crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="moisture-crop-info">
          <div>
            <span>Ділянка</span>
            <strong>{selectedCrop?.plot?.name || "не вказано"}</strong>
          </div>

          <div>
            <span>Тип ґрунту</span>
            <strong>{selectedCrop?.plot?.soilType || "не визначено"}</strong>
          </div>

          <div>
            <span>Оптимальний діапазон</span>
            <strong>
              {selectedCrop?.optimalMoistureMin !== null &&
              selectedCrop?.optimalMoistureMin !== undefined &&
              selectedCrop?.optimalMoistureMax !== null &&
              selectedCrop?.optimalMoistureMax !== undefined
                ? `${selectedCrop.optimalMoistureMin}%–${selectedCrop.optimalMoistureMax}%`
                : "не вказано"}
            </strong>
          </div>
        </div>
      </div>

      <div className="moisture-metrics">
        <div className="stat-card">
          <div className="stat-icon">💧</div>
          <div>
            <div className="stat-label">Остання вологість</div>
            <div className="stat-value">
              {metrics.latest !== null ? `${metrics.latest.toFixed(0)}%` : "—"}
            </div>
            <div className="stat-note">
              {metrics.latestDate
                ? `оновлено ${formatDate(metrics.latestDate)}`
                : "даних немає"}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↧</div>
          <div>
            <div className="stat-label">Мінімальне значення</div>
            <div className="stat-value">
              {metrics.min !== null ? `${metrics.min.toFixed(0)}%` : "—"}
            </div>
            <div className="stat-note">за вибраною культурою</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↥</div>
          <div>
            <div className="stat-label">Максимальне значення</div>
            <div className="stat-value">
              {metrics.max !== null ? `${metrics.max.toFixed(0)}%` : "—"}
            </div>
            <div className="stat-note">за вибраною культурою</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">≈</div>
          <div>
            <div className="stat-label">Середня вологість</div>
            <div className="stat-value">
              {metrics.average !== null ? `${metrics.average.toFixed(0)}%` : "—"}
            </div>
            <div className="stat-note">орієнтовне значення</div>
          </div>
        </div>
      </div>

      <div className="moisture-status-card panel-card">
        <div>
          <span className={`moisture-status-pill ${status.className}`}>
            {status.label}
          </span>
          <h3>Оцінка стану вологості</h3>
          <p>{status.text}</p>
        </div>
      </div>

      <div className="moisture-chart-card panel-card">
        <div className="panel-header">
          <h3 className="panel-title">Динаміка вологості</h3>
          <span style={{ color: "#64748b", fontSize: 14 }}>
            Записів: {selectedRecords.length}
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="empty-state" style={{ boxShadow: "none" }}>
            <div className="empty-state-icon">💧</div>
            <div className="empty-state-title">Дані відсутні</div>
            <div className="empty-state-text">
              Для вибраної культури ще немає записів вологості ґрунту.
            </div>
          </div>
        ) : (
          <div className="moisture-chart-wrapper">
            <ResponsiveContainer width="100%" height={360}>
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 24, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortDate" />
                <YAxis domain={[0, 100]} unit="%" />

                {selectedCrop?.optimalMoistureMin !== null &&
                  selectedCrop?.optimalMoistureMin !== undefined &&
                  selectedCrop?.optimalMoistureMax !== null &&
                  selectedCrop?.optimalMoistureMax !== undefined && (
                    <ReferenceArea
                      y1={selectedCrop.optimalMoistureMin}
                      y2={selectedCrop.optimalMoistureMax}
                      strokeOpacity={0.2}
                      fillOpacity={0.08}
                    />
                  )}

                <Tooltip
                  formatter={(value) => [`${value}%`, "Вологість"]}
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.date || "";
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="moisture"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoistureChartPage;
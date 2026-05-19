import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCrops } from "../api/api";

type Crop = {
  id: number;
  name: string;
  plantingDate?: string | null;
  expectedHarvestDate?: string | null;
  growthStage?: string | null;
  optimalMoistureMin?: number | null;
  optimalMoistureMax?: number | null;
  baseYield?: number | null;
  plot?: {
    id: number;
    name: string;
    region?: string | null;
    soilType?: string | null;
  } | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "не вказано";
  return new Date(value).toLocaleDateString();
};

const getCropIcon = (name: string) => {
  const lower = name.toLowerCase();

  if (lower.includes("пшени")) return "🌾";
  if (lower.includes("кукуруд")) return "🌽";
  if (lower.includes("соняш")) return "🌻";
  if (lower.includes("капуст")) return "🥬";
  if (lower.includes("томат") || lower.includes("помід")) return "🍅";
  if (lower.includes("картоп")) return "🥔";
  if (lower.includes("лимон")) return "🍋";
  if (lower.includes("авокадо")) return "🥑";

  return "🌱";
};

const CropsPage = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCrops = async () => {
      try {
        const data = await getCrops();
        setCrops(data);
      } catch (error) {
        console.error("Crops load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCrops();
  }, []);

  if (loading) {
    return <p>Завантаження культур...</p>;
  }

  return (
    <div>
      <div className="resource-header">
        <div>
          <h1 className="page-title">Культури</h1>
          <p className="page-subtitle">
            Перелік культур, що вирощуються на ділянках та використовуються в моніторингу.
          </p>
        </div>

        <div className="resource-actions">
          <Link
            to="/crops/create"
            className="primary-button"
            style={{ textDecoration: "none" }}
          >
            + Додати культуру
          </Link>
        </div>
      </div>

      {crops.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <div className="empty-state-title">Культури відсутні</div>
          <div className="empty-state-text">
            Додайте першу культуру, щоб система могла аналізувати її стан,
            формувати рекомендації та прогнози врожайності.
          </div>

          <Link
            to="/crops/create"
            className="primary-button"
            style={{ textDecoration: "none" }}
          >
            Додати культуру
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {crops.map((crop) => (
            <div className="crop-card" key={crop.id}>
              <div className="crop-card-top">
                <div style={{ display: "flex", gap: 14 }}>
                  <div className="crop-icon">{getCropIcon(crop.name)}</div>

                  <div>
                    <h3 className="crop-title">{crop.name}</h3>
                    <div className="crop-subtitle">
                      {crop.plot?.name
                        ? `Ділянка: ${crop.plot.name}`
                        : "Ділянка не вказана"}
                    </div>
                  </div>
                </div>

                <span className="crop-status">Активна</span>
              </div>

              <div className="crop-info">
                <div className="crop-info-row">
                  <span className="crop-info-label">Дата посадки</span>
                  <span className="crop-info-value">
                    {formatDate(crop.plantingDate)}
                  </span>
                </div>

                <div className="crop-info-row">
                  <span className="crop-info-label">Очікуваний збір</span>
                  <span className="crop-info-value">
                    {formatDate(crop.expectedHarvestDate)}
                  </span>
                </div>

                <div className="crop-info-row">
                  <span className="crop-info-label">Стадія росту</span>
                  <span className="crop-info-value">
                    {crop.growthStage || "не вказано"}
                  </span>
                </div>

                <div className="crop-info-row">
                  <span className="crop-info-label">Оптимальна вологість</span>
                  <span className="crop-info-value">
                    {crop.optimalMoistureMin !== null &&
                    crop.optimalMoistureMin !== undefined &&
                    crop.optimalMoistureMax !== null &&
                    crop.optimalMoistureMax !== undefined ? (
                      <span className="moisture-range">
                        {crop.optimalMoistureMin}%–{crop.optimalMoistureMax}%
                      </span>
                    ) : (
                      "не вказано"
                    )}
                  </span>
                </div>

                <div className="crop-info-row">
                  <span className="crop-info-label">Базова врожайність</span>
                  <span className="crop-info-value">
                    {crop.baseYield !== null && crop.baseYield !== undefined
                      ? `${crop.baseYield}`
                      : "не вказано"}
                  </span>
                </div>

                <div className="crop-info-row">
                  <span className="crop-info-label">Ґрунт ділянки</span>
                  <span className="crop-info-value">
                    {crop.plot?.soilType || "не визначено"}
                  </span>
                </div>
              </div>

              <div className="crop-card-footer">
                <Link to={`/crops/${crop.id}`} className="card-button primary">
                  Детальніше
                </Link>

                <Link to="/moisture/create" className="card-button">
                  Додати вологість
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CropsPage;
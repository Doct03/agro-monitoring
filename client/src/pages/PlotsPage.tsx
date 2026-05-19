import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPlots } from "../api/api";

type Plot = {
  id: number;
  name: string;
  region: string;
  area: number;
  soilType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  crops?: {
    id: number;
    name: string;
  }[];
};

const formatCoordinate = (value?: number | null) => {
  if (value === null || value === undefined) return "не визначено";
  return value.toFixed(4);
};

const PlotsPage = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlots = async () => {
      try {
        const data = await getPlots();
        setPlots(data);
      } catch (error) {
        console.error("Plots load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlots();
  }, []);

  if (loading) {
    return <p>Завантаження ділянок...</p>;
  }

  return (
    <div>
      <div className="resource-header">
        <div>
          <h1 className="page-title">Ділянки</h1>
          <p className="page-subtitle">
            Перелік земельних ділянок, що використовуються для агро-моніторингу.
          </p>
        </div>

        <div className="resource-actions">
          <Link to="/plots/create" className="primary-button" style={{ textDecoration: "none" }}>
            + Додати ділянку
          </Link>
        </div>
      </div>

      {plots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <div className="empty-state-title">Ділянки відсутні</div>
          <div className="empty-state-text">
            Додайте першу ділянку, щоб система могла виконувати моніторинг,
            отримувати погодні дані та формувати рекомендації.
          </div>

          <Link to="/plots/create" className="primary-button" style={{ textDecoration: "none" }}>
            Додати ділянку
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {plots.map((plot) => (
            <div className="plot-card" key={plot.id}>
              <div className="plot-card-top">
                <div style={{ display: "flex", gap: 14 }}>
                  <div className="plot-icon">▧</div>

                  <div>
                    <h3 className="plot-title">{plot.name}</h3>
                    <div className="plot-subtitle">
                      {plot.region || "Регіон не вказано"}
                    </div>
                  </div>
                </div>

                <span className="plot-status">Активна</span>
              </div>

              <div className="plot-info">
                <div className="plot-info-row">
                  <span className="plot-info-label">Площа</span>
                  <span className="plot-info-value">{plot.area} га</span>
                </div>

                <div className="plot-info-row">
                  <span className="plot-info-label">Тип ґрунту</span>
                  <span className="plot-info-value">
                    {plot.soilType || "не визначено"}
                  </span>
                </div>

                <div className="plot-info-row">
                  <span className="plot-info-label">Кількість культур</span>
                  <span className="plot-info-value">
                    {plot.crops?.length ?? 0}
                  </span>
                </div>

                <div className="plot-info-row">
                  <span className="plot-info-label">Координати</span>
                  <span className="plot-info-value">
                    {formatCoordinate(plot.latitude)}, {formatCoordinate(plot.longitude)}
                  </span>
                </div>
              </div>

              <div className="plot-card-footer">
                <Link to={`/plots/${plot.id}`} className="card-button primary">
                  Детальніше
                </Link>

                <Link to="/crops/create" className="card-button">
                  Додати культуру
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlotsPage;
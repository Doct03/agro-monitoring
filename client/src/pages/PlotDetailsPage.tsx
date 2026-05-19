import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlotById } from "../api/api";

const PlotDetailsPage = () => {
  const { id } = useParams();
  const [plot, setPlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlot = async () => {
      try {
        const data = await getPlotById(Number(id));
        setPlot(data);
      } catch (error) {
        console.error("Plot details load error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPlot();
    }
  }, [id]);

  if (loading) {
    return <p>Завантаження...</p>;
  }

  if (!plot) {
    return <p>Ділянку не знайдено</p>;
  }

  const latestWeather = plot.weatherRecords?.[0];

  return (
    <div style={{color:"black"}}>
      <h1 style={{color:"black"}}>Детальна інформація про ділянку</h1>

      <div
        style={{
          background: "white",
          color: "black",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2>{plot.name}</h2>
        <p>Площа: {plot.area} га</p>
        <p>Регіон: {plot.region}</p>
        <p>Тип ґрунту: {plot.soilType || "не вказано"}</p>
        <p>Координати: {plot.latitude}, {plot.longitude}</p>
      </div>

      <div
        style={{
          background: "white",
          padding: 20,
          color: "black",
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3>Останні погодні дані</h3>
        {latestWeather ? (
          <>
            <p>Температура: {latestWeather.temperature} °C</p>
            <p>Вологість повітря: {latestWeather.humidity} %</p>
            <p>Опади: {latestWeather.rainfall} мм</p>
            <p>Швидкість вітру: {latestWeather.windSpeed ?? 0} м/с</p>
            <p>Оновлено: {new Date(latestWeather.recordedAt).toLocaleString()}</p>
          </>
        ) : (
          <p>Погодні дані відсутні</p>
        )}
      </div>

      <div
        style={{
          background: "white",
          color: "black",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3>Культури на ділянці</h3>
        {plot.crops.length === 0 ? (
          <p>Культури відсутні</p>
        ) : (
          plot.crops.map((crop: any) => (
            <div key={crop.id} style={{ marginBottom: 12 }}>
              <strong>{crop.name}</strong>
              <p>Дата посадки: {new Date(crop.plantingDate).toLocaleDateString()}</p>
              <Link
                to={`/crops/${crop.id}`}
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Перейти до культури
              </Link>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3 style={{color:"black"}}>Останні рекомендації</h3>
        {plot.recommendations.length === 0 ? (
          <p style={{color:"black"}}>Рекомендації відсутні</p>
        ) : (
          plot.recommendations.slice(0, 5).map((item: any) => (
            <div key={item.id} style={{ marginBottom: 12 }}>
              <strong>{item.recommendationType}</strong>
              <p>{item.message}</p>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlotDetailsPage;
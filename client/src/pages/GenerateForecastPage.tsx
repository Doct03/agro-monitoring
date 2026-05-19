import { useEffect, useState } from "react";
import { generateForecast, getCrops } from "../api/api";
import type { Crop } from "../types";

const GenerateForecastPage = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropId, setCropId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadCrops = async () => {
      try {
        const data = await getCrops();
        setCrops(data);
      } catch (error) {
        console.error("Crops load error:", error);
      }
    };

    loadCrops();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      await generateForecast(Number(cropId));
      setMessage("Прогноз урожайності успішно сформовано");
    } catch (error) {
      console.error(error);
      setMessage("Помилка при формуванні прогнозу");
    }
  };

  return (
    <div style={{color:"black"}}>
      <h1>Сформувати прогноз урожайності</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: 20,
          borderRadius: 12,
          maxWidth: 500,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Культура</label>
          <select
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
          >
            <option value="">Оберіть культуру</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
          }}
        >
          Сформувати прогноз
        </button>

        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </form>
    </div>
  );
};

export default GenerateForecastPage;
import { useState } from "react";
import { createPlot, fillMissingData, detectCoordinates } from "../api/api";

const CreatePlotPage = () => {
  const [form, setForm] = useState({
    name: "",
    area: "",
    region: "",
    city: "",
    soilType: "",
  });

  const [hiddenCoords, setHiddenCoords] = useState({
    latitude: "",
    longitude: "",
  });

  const [message, setMessage] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [geoMessage, setGeoMessage] = useState("");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const autoResolveLocationAndSoil = async () => {
    if (!form.region && !form.city) return;

    try {
      setIsResolvingLocation(true);
      setGeoMessage("");
      setAiMessage("");

      const geoResponse = await detectCoordinates({
        region: form.region,
        city: form.city,
      });

      const latitude = String(geoResponse.latitude);
      const longitude = String(geoResponse.longitude);

      setHiddenCoords({
        latitude,
        longitude,
      });

      setGeoMessage(
        `Локацію визначено автоматично: ${geoResponse.displayName}.`
      );

      const soilResponse = await fillMissingData({
        region: form.region,
        latitude: Number(latitude),
        longitude: Number(longitude),
        missingFields: ["soilType"],
      });

      const suggestion = soilResponse.suggestions?.find(
        (item: any) => item.field === "soilType"
      );

      if (suggestion) {
        setForm((prev) => ({
          ...prev,
          soilType: suggestion.suggestedValue,
        }));

        setAiMessage(
          `Тип ґрунту визначено автоматично: ${suggestion.suggestedValue}.`
        );
      }
    } catch (error) {
      console.error(error);
      setGeoMessage("Не вдалося автоматично визначити місце або тип ґрунту.");
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleLocationBlur = async () => {
    if (!form.region && !form.city) return;
    await autoResolveLocationAndSoil();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      let latitude = hiddenCoords.latitude;
      let longitude = hiddenCoords.longitude;

      if (!latitude || !longitude) {
        const geoResponse = await detectCoordinates({
          region: form.region,
          city: form.city,
        });

        latitude = String(geoResponse.latitude);
        longitude = String(geoResponse.longitude);

        setHiddenCoords({
          latitude,
          longitude,
        });
      }

      await createPlot({
        name: form.name,
        area: Number(form.area),
        region: form.region,
        latitude: Number(latitude),
        longitude: Number(longitude),
        soilType: form.soilType,
      });

      setMessage("Ділянку успішно створено");
      setForm({
        name: "",
        area: "",
        region: "",
        city: "",
        soilType: "",
      });
      setHiddenCoords({
        latitude: "",
        longitude: "",
      });
      setAiMessage("");
      setGeoMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Помилка при створенні ділянки");
    }
  };

  return (
    <div style={{color:"black"}}>
      <h1>Додати ділянку</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: 20,
          borderRadius: 12,
          maxWidth: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Назва ділянки</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Площа</label>
          <input
            name="area"
            value={form.area}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Регіон</label>
          <input
            name="region"
            value={form.region}
            onChange={handleChange}
            onBlur={handleLocationBlur}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            Місто / населений пункт
          </label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            onBlur={handleLocationBlur}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        {isResolvingLocation && (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 8,
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
            }}
          >
            Виконується автоматичне визначення локації та типу ґрунту...
          </div>
        )}

        {geoMessage && (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 8,
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
            }}
          >
            {geoMessage}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Тип ґрунту</label>
          <input
            name="soilType"
            value={form.soilType}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        {aiMessage && (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 8,
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
            }}
          >
            {aiMessage}
          </div>
        )}

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
          Зберегти
        </button>

        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </form>
    </div>
  );
};

export default CreatePlotPage;
import { useState } from "react";
import { createMoistureRecord } from "../api/api";

const CreateMoisturePage = () => {
  const [form, setForm] = useState({
    cropId: "1",
    value: "",
    source: "manual",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      await createMoistureRecord({
        cropId: Number(form.cropId),
        value: Number(form.value),
        source: form.source,
      });

      setMessage("Показник вологості успішно додано");
      setForm({
        cropId: "1",
        value: "",
        source: "manual",
      });
    } catch (error) {
      console.error(error);
      setMessage("Помилка при додаванні вологості");
    }
  };

  return (
    <div>
      <h1 style={{color: "black"}}>Додати показник вологостіі</h1>

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
          <label style={{ display: "block", marginBottom: 6 }}>ID культури</label>
          <input
            name="cropId"
            value={form.cropId}
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
          <label style={{ display: "block", marginBottom: 6 }}>Вологість (%)</label>
          <input
            name="value"
            value={form.value}
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
          <label style={{ display: "block", marginBottom: 6 }}>Джерело</label>
          <input
            name="source"
            value={form.source}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
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
          Зберегти
        </button>

        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </form>
    </div>
  );
};

export default CreateMoisturePage;
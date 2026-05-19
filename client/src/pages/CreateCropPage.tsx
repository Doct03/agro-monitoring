import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createCrop, detectCropReference, getPlots } from "../api/api";
import type { Plot } from "../types";

const initialForm = {
  name: "",
  plantingDate: "",
  growthStage: "",
  expectedHarvestDate: "",
  plotId: "",
  optimalMoistureMin: "",
  optimalMoistureMax: "",
  baseYield: "",
};

const CreateCropPage = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [form, setForm] = useState(initialForm);

  const [message, setMessage] = useState("");
  const [helperMessage, setHelperMessage] = useState("");
  const [isCustomCrop, setIsCustomCrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const loadPlots = async () => {
      try {
        const data = await getPlots();
        setPlots(data);

        if (data.length > 0) {
          setForm((prev) => ({
            ...prev,
            plotId: prev.plotId || String(data[0].id),
          }));
        }
      } catch (error) {
        console.error("Plots load error:", error);
        setMessage("Не вдалося завантажити ділянки.");
      }
    };

    loadPlots();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const tryDetectCrop = async () => {
    if (!form.name.trim()) {
      return;
    }

    try {
      setDetecting(true);
      setHelperMessage("");

      const selectedPlot = plots.find((plot) => plot.id === Number(form.plotId));

      const result = await detectCropReference({
        name: form.name.trim(),
        plantingDate: form.plantingDate || undefined,
        region: selectedPlot?.region,
        soilType: selectedPlot?.soilType || undefined,
      });

      if (result.found) {
        setIsCustomCrop(false);
        setHelperMessage(
          "Культуру знайдено у довіднику. Параметри заповнено автоматично."
        );

        setForm((prev) => ({
          ...prev,
          name: result.crop.canonicalName || prev.name,
          expectedHarvestDate: result.crop.expectedHarvestDate
            ? result.crop.expectedHarvestDate.slice(0, 10)
            : prev.expectedHarvestDate,
          optimalMoistureMin: String(result.crop.optimalMoistureMin ?? ""),
          optimalMoistureMax: String(result.crop.optimalMoistureMax ?? ""),
          baseYield: String(result.crop.baseYield ?? ""),
        }));

        return;
      }

  setIsCustomCrop(true);

const suggestionReason = String(result.reason || "").trim();

const isTechnicalFallbackReason =
  suggestionReason.toLowerCase().includes("fallback") ||
  suggestionReason.toLowerCase().includes("algorithmic");

setHelperMessage(
  [
    "Культуру не знайдено у довіднику. Система автоматично запропонувала орієнтовні параметри, які можна змінити вручну.",
    suggestionReason && !isTechnicalFallbackReason
      ? `Пояснення: ${suggestionReason}`
      : "",
  ]
    .filter(Boolean)
    .join(" ")
);

      setForm((prev) => ({
        ...prev,
        expectedHarvestDate: result.fallback?.expectedHarvestDate
          ? result.fallback.expectedHarvestDate.slice(0, 10)
          : prev.expectedHarvestDate,
        optimalMoistureMin: String(
          result.fallback?.optimalMoistureMin ?? prev.optimalMoistureMin
        ),
        optimalMoistureMax: String(
          result.fallback?.optimalMoistureMax ?? prev.optimalMoistureMax
        ),
        baseYield: String(result.fallback?.baseYield ?? prev.baseYield),
      }));
    } catch (error: any) {
      console.error("Crop detect error:", error);
      setHelperMessage(
        error?.response?.data?.message ||
          "Не вдалося перевірити культуру у довіднику."
      );
    } finally {
      setDetecting(false);
    }
  };

  const handleCropBlur = async () => {
    await tryDetectCrop();
  };

  const handlePlantingDateBlur = async () => {
    if (form.name.trim()) {
      await tryDetectCrop();
    }
  };

  const handlePlotChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;

    setForm((prev) => ({
      ...prev,
      plotId: value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Введіть назву культури.";
    }

    if (!form.plantingDate) {
      return "Вкажіть дату посадки.";
    }

    if (!form.plotId) {
      return "Оберіть ділянку для культури.";
    }

    if (form.optimalMoistureMin && form.optimalMoistureMax) {
      const min = Number(form.optimalMoistureMin);
      const max = Number(form.optimalMoistureMax);

      if (Number.isFinite(min) && Number.isFinite(max) && min >= max) {
        return "Мінімальна вологість має бути меншою за максимальну.";
      }
    }

    return "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");

    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setLoading(true);

      await createCrop({
        name: form.name.trim(),
        plantingDate: form.plantingDate,
        growthStage: form.growthStage || undefined,
        expectedHarvestDate: form.expectedHarvestDate || undefined,
        plotId: Number(form.plotId),
        optimalMoistureMin: form.optimalMoistureMin
          ? Number(form.optimalMoistureMin)
          : undefined,
        optimalMoistureMax: form.optimalMoistureMax
          ? Number(form.optimalMoistureMax)
          : undefined,
        baseYield: form.baseYield ? Number(form.baseYield) : undefined,
      });

      setMessage("Культуру успішно створено.");

      setForm({
        ...initialForm,
        plotId: plots[0]?.id ? String(plots[0].id) : "",
      });

      setHelperMessage("");
      setIsCustomCrop(false);
    } catch (error: any) {
      console.error("Create crop error:", error);
      setMessage(
        error?.response?.data?.message || "Помилка при створенні культури."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="resource-header">
        <div>
          <h1 className="page-title">Додати культуру</h1>
          <p className="page-subtitle">
            Створення культури з автоматичним заповненням параметрів із
            довідника або за допомогою AI.
          </p>
        </div>
      </div>

      {plots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">▧</div>
          <div className="empty-state-title">Ділянки відсутні</div>
          <div className="empty-state-text">
            Спочатку потрібно створити земельну ділянку, а потім додавати до неї
            культури.
          </div>

          <Link
            to="/plots/create"
            className="primary-button"
            style={{ textDecoration: "none", marginTop: 16 }}
          >
            + Додати ділянку
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="resource-form panel-card">
          {message && (
            <div
              style={{
                background: message.includes("успішно") ? "#ecfdf5" : "#fef2f2",
                color: message.includes("успішно") ? "#166534" : "#991b1b",
                border: message.includes("успішно")
                  ? "1px solid #bbf7d0"
                  : "1px solid #fecaca",
                padding: "12px 16px",
                borderRadius: 12,
                fontWeight: 700,
                marginBottom: 18,
              }}
            >
              {message}
            </div>
          )}

          <div className="form-grid">
            <label className="form-field">
              <span>Назва культури</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleCropBlur}
                placeholder="Наприклад: капуста, кабачок, виноград"
              />
            </label>

            <label className="form-field">
              <span>Дата посадки</span>
              <input
                type="date"
                name="plantingDate"
                value={form.plantingDate}
                onChange={handleChange}
                onBlur={handlePlantingDateBlur}
              />
            </label>

            <label className="form-field">
              <span>Ділянка</span>
              <select
                name="plotId"
                value={form.plotId}
                onChange={handlePlotChange}
              >
                <option value="">Оберіть ділянку</option>
                {plots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.name} {plot.region ? `(${plot.region})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Стадія росту</span>
              <input
                type="text"
                name="growthStage"
                value={form.growthStage}
                onChange={handleChange}
                placeholder="Наприклад: проростання, вегетація, цвітіння"
              />
            </label>

            <label className="form-field">
              <span>Орієнтовна дата збору</span>
              <input
                type="date"
                name="expectedHarvestDate"
                value={form.expectedHarvestDate}
                onChange={handleChange}
              />
            </label>

            <label className="form-field">
              <span>Базова урожайність</span>
              <input
                type="number"
                name="baseYield"
                value={form.baseYield}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="кг/м²"
              />
            </label>

            <label className="form-field">
              <span>Мінімальна оптимальна вологість</span>
              <input
                type="number"
                name="optimalMoistureMin"
                value={form.optimalMoistureMin}
                onChange={handleChange}
                min="0"
                max="100"
                placeholder="%"
              />
            </label>

            <label className="form-field">
              <span>Максимальна оптимальна вологість</span>
              <input
                type="number"
                name="optimalMoistureMax"
                value={form.optimalMoistureMax}
                onChange={handleChange}
                min="0"
                max="100"
                placeholder="%"
              />
            </label>
          </div>

          {helperMessage && (
            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 14,
                background: isCustomCrop ? "#fff7ed" : "#ecfdf5",
                color: isCustomCrop ? "#9a3412" : "#166534",
                border: isCustomCrop
                  ? "1px solid #fed7aa"
                  : "1px solid #bbf7d0",
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              {detecting ? "Перевірка культури..." : helperMessage}
            </div>
          )}

          <small
            style={{
              display: "block",
              marginTop: 14,
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            {isCustomCrop
              ? "Для користувацької культури параметри можуть бути запропоновані AI, але їх можна змінити вручну."
              : "Для довідкової культури значення підставляються автоматично, але їх можна змінити."}
          </small>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 22,
              alignItems: "center",
            }}
          >
            <button
              type="submit"
              className="primary-button"
              disabled={loading || detecting}
            >
              {loading ? "Збереження..." : "Зберегти"}
            </button>

            <Link
              to="/crops"
              className="secondary-button"
              style={{ textDecoration: "none" }}
            >
              Скасувати
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateCropPage;
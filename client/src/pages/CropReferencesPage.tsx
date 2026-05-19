import { useEffect, useState } from "react";
import {
  createCropReference,
  createCropReferenceWithAI,
  getCropReferences,
} from "../api/api";

type CropReference = {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  optimalMoistureMin?: number | null;
  optimalMoistureMax?: number | null;
  baseYield?: number | null;
  yieldUnit?: string | null;
  growingDays?: number | null;
  imageUrl?: string | null;
};

const initialForm = {
  name: "",
  description: "",
  category: "",
  optimalMoistureMin: "",
  optimalMoistureMax: "",
  baseYield: "",
  yieldUnit: "т/га",
  growingDays: "",
  imageUrl: "",
};

const CropReferencesPage = () => {
  const [items, setItems] = useState<CropReference[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadReferences = async () => {
    try {
      const data = await getCropReferences();
      setItems(data);
    } catch (error) {
      console.error("Crop references load error:", error);
      setMessage("Не вдалося завантажити довідник культур.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      await createCropReference(form);

      setForm(initialForm);
      setMessage("Культуру додано до довідника.");
      await loadReferences();
    } catch (error) {
      console.error("Create crop reference error:", error);
      setMessage("Не вдалося додати культуру до довідника.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateWithAI = async () => {
    if (!form.name.trim()) {
      setMessage("Введіть назву культури.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const result = await createCropReferenceWithAI({
        name: form.name,
      });

      setForm(initialForm);
      setMessage(result.message || "Культуру додано через ШІ.");
      await loadReferences();
    } catch (error) {
      console.error("AI crop reference create error:", error);
      setMessage("Не вдалося додати культуру через ШІ.");
    } finally {
      setSaving(false);
    }
  };

  {/*const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Видалити культуру з довідника?");

    if (!confirmed) return;

    try {
      await deleteCropReference(id);
      setMessage("Культуру видалено з довідника.");
      await loadReferences();
    } catch (error) {
      console.error("Delete crop reference error:", error);
      setMessage("Не вдалося видалити культуру.");
    }
  };*/}

  if (loading) {
    return <p>Завантаження довідника...</p>;
  }

  return (
    <div>
      <div className="resource-header">
        <div>
          <h1 className="page-title">Довідник культур</h1>
          <p className="page-subtitle">
            База культур із параметрами, які використовуються для автоматичного
            заповнення даних, рекомендацій та прогнозів.
          </p>
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

      <div className="reference-layout">
        <form className="reference-form panel-card" onSubmit={handleCreate}>
          <div className="panel-header">
            <h3 className="panel-title">Додати культуру</h3>
          </div>

          <div className="reference-form-body">
            <label>
              Назва культури
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Наприклад: Капуста"
                required
              />
            </label>

            <label>
              Категорія
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Овочева культура"
              />
            </label>

            <label>
              Опис
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Короткий опис культури"
                rows={4}
              />
            </label>

            <div className="form-two-columns">
              <label>
                Вологість мін. %
                <input
                  name="optimalMoistureMin"
                  type="number"
                  value={form.optimalMoistureMin}
                  onChange={handleChange}
                />
              </label>

              <label>
                Вологість макс. %
                <input
                  name="optimalMoistureMax"
                  type="number"
                  value={form.optimalMoistureMax}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="form-two-columns">
              <label>
                Базова врожайність
                <input
                  name="baseYield"
                  type="number"
                  value={form.baseYield}
                  onChange={handleChange}
                />
              </label>

              <label>
                Одиниця
                <input
                  name="yieldUnit"
                  value={form.yieldUnit}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label>
              Тривалість вирощування, днів
              <input
                name="growingDays"
                type="number"
                value={form.growingDays}
                onChange={handleChange}
              />
            </label>

            <label>
              Посилання на зображення
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>

            <div style={{ display: "grid", gap: 10 }}>
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? "Збереження..." : "Додати вручну"}
              </button>

              <button
                className="card-button primary"
                type="button"
                onClick={handleCreateWithAI}
                disabled={saving}
              >
                {saving ? "Обробка..." : "Згенерувати через ШІ та додати"}
              </button>
            </div>
          </div>
        </form>

        <div className="reference-list">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <div className="empty-state-title">Довідник порожній</div>
              <div className="empty-state-text">
                Додайте перші культури вручну або згенеруйте параметри через ШІ.
              </div>
            </div>
          ) : (
            <div className="card-grid">
              {items.map((item) => (
                <div className="reference-card" key={item.id}>
                  <div className="reference-card-top">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="reference-image"
                      />
                    ) : (
                      <div className="reference-placeholder">🌱</div>
                    )}

                    <div>
                      <h3 className="reference-title">{item.name}</h3>
                      <div className="reference-category">
                        {item.category || "Категорія не вказана"}
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="reference-description">{item.description}</p>
                  )}

                  <div className="reference-meta">
                    <div>
                      <span>Вологість</span>
                      <strong>
                        {item.optimalMoistureMin ?? "?"}%–
                        {item.optimalMoistureMax ?? "?"}%
                      </strong>
                    </div>

                    <div>
                      <span>Врожайність</span>
                      <strong>
                        {item.baseYield ?? "?"} {item.yieldUnit || ""}
                      </strong>
                    </div>

                    <div>
                      <span>Вегетація</span>
                      <strong>
                        {item.growingDays ? `${item.growingDays} днів` : "?"}
                      </strong>
                    </div>
                  </div>

                  {/*<div className="reference-actions">
                    <button
                      className="card-button"
                      onClick={() => handleDelete(item.id)}
                    >
                      Видалити
                    </button>
                  </div>*/}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropReferencesPage;
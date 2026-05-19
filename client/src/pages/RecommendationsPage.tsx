import { useEffect, useState } from "react";
import { getRecommendations, getRecommendationHint } from "../api/api";

type Recommendation = {
  id: number;
  message: string;
  recommendationType: string;
  irrigationVolume?: number | null;
  createdAt: string;
  cropId: number;
  plotId: number;
  crop?: {
    id: number;
    name: string;
  } | null;
  plot?: {
    id: number;
    name: string;
    region: string;
    soilType?: string | null;
  } | null;
};

type RecommendationHint = {
  title: string;
  explanation: string;
  advice: string;
  priority: string;
};

const getTypeLabel = (type: string) => {
  if (type === "irrigation") return "Полив потрібен";
  if (type === "no_action") return "Додаткових дій не потрібно";
  if (type === "delay_irrigation") return "Полив варто відкласти";
  if (type === "protection") return "Потрібні захисні дії";
  return type;
};

const getTypeStyles = (type: string) => {
  if (type === "irrigation") {
    return {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    };
  }

  if (type === "delay_irrigation") {
    return {
      background: "#fffbeb",
      color: "#b45309",
      border: "1px solid #fde68a",
    };
  }

  if (type === "no_action") {
    return {
      background: "#f0fdf4",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }

  return {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #cbd5e1",
  };
};

const getPriorityStyles = (priority?: string) => {
  if (priority === "high") {
    return {
      background: "#fef2f2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
      label: "Високий пріоритет",
    };
  }

  if (priority === "medium") {
    return {
      background: "#fffbeb",
      color: "#b45309",
      border: "1px solid #fde68a",
      label: "Середній пріоритет",
    };
  }

  return {
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    label: "Низький пріоритет",
  };
};

const RecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiHints, setAiHints] = useState<Record<number, RecommendationHint>>({});
  const [loadingHintId, setLoadingHintId] = useState<number | null>(null);
  const [hintErrors, setHintErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const data = await getRecommendations();
        setRecommendations(data);
      } catch (error) {
        console.error("Recommendations load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const handleGenerateHint = async (recommendationId: number) => {
    try {
      setLoadingHintId(recommendationId);

      setHintErrors((prev) => {
        const copy = { ...prev };
        delete copy[recommendationId];
        return copy;
      });

      const hint = await getRecommendationHint(recommendationId);

      setAiHints((prev) => ({
        ...prev,
        [recommendationId]: hint,
      }));
    } catch (error) {
      console.error("AI hint generation error:", error);

      setHintErrors((prev) => ({
        ...prev,
        [recommendationId]: "Не вдалося згенерувати підказку.",
      }));
    } finally {
      setLoadingHintId(null);
    }
  };

  if (loading) {
    return <p>Завантаження рекомендацій...</p>;
  }

  return (
    <div style={{color:"black"}}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 42, marginBottom: 8 }}>Рекомендації</h1>
        <p style={{ color: "#475569", fontSize: 16 }}>
          Актуальні рекомендації для догляду за культурами на основі моніторингу.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: 24,
            borderRadius: 18,
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ marginBottom: 10 }}>Рекомендації відсутні</h3>
          <p style={{ color: "#475569", margin: 0 }}>
            Поки що система не сформувала жодної рекомендації. Запусти моніторинг,
            щоб отримати нові записи.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          {recommendations.map((item) => {
            const typeStyle = getTypeStyles(item.recommendationType);
            const hint = aiHints[item.id];
            const hintError = hintErrors[item.id];
            const priorityStyle = getPriorityStyles(hint?.priority);

            return (
              
              <div
                key={item.id}
                style={{
                  background: "white",
                  padding: 24,
                  borderRadius: 18,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
              <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 14,
                    color: "#475569",
                    fontSize: 15,
                  }}
                >
                  <span>
                    <strong>Культура:</strong> {item.crop?.name || "невідомо"}
                  </span>
                  <span>
                    <strong>Ділянка:</strong> {item.plot?.name || "невідомо"}
                  </span>
                  {item.plot?.region && (
                    <span>
                      <strong>Регіон:</strong> {item.plot.region}
                    </span>
                  )}
                  {item.plot?.soilType && (
                    <span>
                      <strong>Ґрунт:</strong> {item.plot.soilType}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 24 }}>
                    {item.message || getTypeLabel(item.recommendationType)}
                  </h3>

                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      ...typeStyle,
                    }}
                  >
                    {getTypeLabel(item.recommendationType)}
                  </span>

                  {item.irrigationVolume !== null &&
                    item.irrigationVolume !== undefined && (
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 600,
                          background: "#f8fafc",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        Обʼєм поливу: {item.irrigationVolume}
                      </span>
                    )}
                </div>

                <div style={{ color: "#64748b", fontSize: 14, marginBottom: 14 }}>
                  Дата: {new Date(item.createdAt).toLocaleString()}
                </div>

                <button
                  onClick={() => handleGenerateHint(item.id)}
                  disabled={loadingHintId === item.id}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "none",
                    background:
                      loadingHintId === item.id ? "#a78bfa" : "#7c3aed",
                    color: "white",
                    cursor: loadingHintId === item.id ? "default" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {loadingHintId === item.id
                    ? "Генерація..."
                    : hint
                    ? "Оновити підказку"
                    : "Згенерувати підказку"}
                </button>

                {hintError && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      borderRadius: 12,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#b91c1c",
                    }}
                  >
                    {hintError}
                  </div>
                )}

                {hint && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 16,
                      borderRadius: 14,
                      background: "#faf5ff",
                      border: "1px solid #e9d5ff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 18 }}>
                        {hint.title}
                      </div>

                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 600,
                          ...priorityStyle,
                        }}
                      >
                        {priorityStyle.label}
                      </span>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 6,
                          color: "#0f172a",
                        }}
                      >
                        Пояснення
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: "#334155",
                          lineHeight: 1.6,
                        }}
                      >
                        {hint.explanation}
                      </p>
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 6,
                          color: "#0f172a",
                        }}
                      >
                        Порада
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: "#334155",
                          lineHeight: 1.6,
                        }}
                      >
                        {hint.advice}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
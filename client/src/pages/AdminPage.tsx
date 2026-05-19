import { useEffect, useState } from "react";
import { getAdminOverview, getAdminUsers } from "../api/api";

type AdminOverview = {
  usersCount: number;
  plotsCount: number;
  cropsCount: number;
  recommendationsCount: number;
  forecastsCount: number;
  sensorsCount: number;
  notificationsCount: number;
  ai: {
    provider: string;
    mistralModel?: string | null;
    groqModel?: string | null;
    cache?: {
      totalRecords?: number;
      totalHits?: number;
      expiredRecords?: number;
      byOperation?: Array<{
        operation: string;
        count: number;
      }>;
    };
  };
};

type AdminUser = {
  id: number;
  name: string;
  email: string;
  region?: string | null;
  role: string;
  createdAt: string;
  _count?: {
    plots: number;
    notifications: number;
  };
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "не вказано";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "не вказано";
  }

  return date.toLocaleString();
};

const AdminPage = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setMessage("");

      const [overviewData, usersData] = await Promise.all([
        getAdminOverview(),
        getAdminUsers(),
      ]);

      setOverview(overviewData);
      setUsers(usersData);
    } catch (error: any) {
      console.error("Admin data load error:", error);
      setMessage(
        error?.response?.data?.message ||
          "Не вдалося завантажити адмін-панель."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (loading) {
    return <p>Завантаження адмін-панелі...</p>;
  }

  if (message) {
    return (
      <div>
        <h1 className="page-title">Адмін-панель</h1>

        <div
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            padding: "12px 16px",
            borderRadius: 12,
            fontWeight: 700,
            marginTop: 16,
          }}
        >
          {message}
        </div>
      </div>
    );
  }

  if (!overview) {
    return <p>Дані адмін-панелі відсутні.</p>;
  }

  const statCards = [
    {
      label: "Користувачі",
      value: overview.usersCount,
      icon: "👤",
      note: "зареєстровано в системі",
    },
    {
      label: "Ділянки",
      value: overview.plotsCount,
      icon: "▧",
      note: "створено користувачами",
    },
    {
      label: "Культури",
      value: overview.cropsCount,
      icon: "♧",
      note: "додано до моніторингу",
    },
    {
      label: "Рекомендації",
      value: overview.recommendationsCount,
      icon: "◌",
      note: "згенеровано системою",
    },
    {
      label: "Прогнози",
      value: overview.forecastsCount,
      icon: "⌁",
      note: "сформовано прогнозів",
    },
    {
      label: "IoT-датчики",
      value: overview.sensorsCount,
      icon: "📡",
      note: "зареєстровано датчиків",
    },
    {
      label: "Повідомлення",
      value: overview.notificationsCount,
      icon: "🔔",
      note: "створено системою",
    },
    {
      label: "AI cache",
      value: overview.ai.cache?.totalRecords ?? 0,
      icon: "⚡",
      note: "збережено AI-відповідей",
    },
  ];

  return (
    <div>
      <div className="resource-header">
        <div>
          <h1 className="page-title">Адмін-панель</h1>
          <p className="page-subtitle">
            Загальна статистика системи, AI-кешу, користувачів та IoT-модуля.
          </p>
        </div>

        <button className="secondary-button" type="button" onClick={loadAdminData}>
          Оновити
        </button>
      </div>

      <div className="admin-stats-grid">
        {statCards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-icon">{card.icon}</div>
            <div>
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-note">{card.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <div className="panel-card">
          <div className="panel-header">
            <h3 className="panel-title">AI-рушій</h3>
          </div>

          <div className="admin-info-list">
            <div>
              <span>Активний provider</span>
              <strong>{overview.ai.provider}</strong>
            </div>

            <div>
              <span>Mistral model</span>
              <strong>{overview.ai.mistralModel || "не вказано"}</strong>
            </div>

            <div>
              <span>Groq model</span>
              <strong>{overview.ai.groqModel || "не вказано"}</strong>
            </div>

            <div>
              <span>Cache records</span>
              <strong>{overview.ai.cache?.totalRecords ?? 0}</strong>
            </div>

            <div>
              <span>Cache hits</span>
              <strong>{overview.ai.cache?.totalHits ?? 0}</strong>
            </div>

            <div>
              <span>Expired records</span>
              <strong>{overview.ai.cache?.expiredRecords ?? 0}</strong>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3 className="panel-title">AI cache за операціями</h3>
          </div>

          {overview.ai.cache?.byOperation &&
          overview.ai.cache.byOperation.length > 0 ? (
            <div className="admin-operation-list">
              {overview.ai.cache.byOperation.map((item) => (
                <div className="admin-operation-item" key={item.operation}>
                  <span>{item.operation}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#64748b" }}>Дані AI-кешу поки відсутні.</p>
          )}
        </div>
      </div>

      <div className="panel-card" style={{ marginTop: 20 }}>
        <div className="panel-header">
          <h3 className="panel-title">Користувачі</h3>
          <span style={{ color: "#64748b", fontSize: 14 }}>
            {users.length} записів
          </span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ім’я</th>
                <th>Email</th>
                <th>Регіон</th>
                <th>Роль</th>
                <th>Ділянки</th>
                <th>Повідомлення</th>
                <th>Створено</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8}>Користувачів поки немає.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.region || "—"}</td>
                    <td>
                      <span
                        className={
                          user.role === "ADMIN"
                            ? "admin-role admin-role-admin"
                            : "admin-role"
                        }
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>{user._count?.plots ?? 0}</td>
                    <td>{user._count?.notifications ?? 0}</td>
                    <td>{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
import { useEffect, useMemo, useState } from "react";
import {
  getCrops,
  getForecasts,
  getPlots,
  getRecommendations,
} from "../api/api";

type NotificationItem = {
  id: string;
  title: string;
  text: string;
  time?: string;
  type: "info" | "warning" | "success";
};

const READ_STORAGE_KEY = "agro_monitor_read_notifications";

const formatDate = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString();
};

const getSavedReadIds = () => {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveReadIds = (ids: string[]) => {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [plotsCount, setPlotsCount] = useState(0);
  const [cropsCount, setCropsCount] = useState(0);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>(getSavedReadIds);

  const loadNotificationsData = async () => {
    try {
      const [plotsData, cropsData, recommendationsData, forecastsData] =
        await Promise.all([
          getPlots(),
          getCrops(),
          getRecommendations(),
          getForecasts(),
        ]);

      setPlotsCount(plotsData.length);
      setCropsCount(cropsData.length);
      setRecommendations(recommendationsData);
      setForecasts(forecastsData);
    } catch (error) {
      console.error("Notifications load error:", error);
    }
  };

  useEffect(() => {
    loadNotificationsData();
  }, []);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    if (plotsCount === 0) {
      items.push({
        id: "empty-plots",
        title: "Ділянки відсутні",
        text: "Додайте першу земельну ділянку для початку моніторингу.",
        type: "warning",
      });
    }

    if (plotsCount > 0 && cropsCount === 0) {
      items.push({
        id: "empty-crops",
        title: "Культури відсутні",
        text: "Додайте культуру на ділянку, щоб отримувати рекомендації.",
        type: "warning",
      });
    }

    recommendations.slice(0, 3).forEach((item) => {
      items.push({
        id: `recommendation-${item.id}`,
        title:
          item.recommendationType === "irrigation"
            ? "Потрібен полив"
            : "Нова рекомендація",
        text: item.crop?.name
          ? `${item.crop.name}: ${item.message}`
          : item.message || "Система сформувала рекомендацію.",
        time: formatDate(item.createdAt),
        type: item.recommendationType === "irrigation" ? "warning" : "info",
      });
    });

    forecasts.slice(0, 2).forEach((item) => {
      items.push({
        id: `forecast-${item.id}`,
        title: "Сформовано прогноз урожайності",
        text: item.crop?.name
          ? `${item.crop.name}: очікувана врожайність ${item.expectedYield}`
          : `Очікувана врожайність: ${item.expectedYield}`,
        time: formatDate(item.createdAt),
        type: "success",
      });
    });

    return items.slice(0, 6);
  }, [plotsCount, cropsCount, recommendations, forecasts]);

  const unreadNotifications = notifications.filter(
    (item) => !readIds.includes(item.id)
  );

  const unreadCount = unreadNotifications.length;

  const markAllAsRead = () => {
    const allIds = notifications.map((item) => item.id);
    const mergedIds = Array.from(new Set([...readIds, ...allIds]));

    setReadIds(mergedIds);
    saveReadIds(mergedIds);
  };

  const handleToggle = () => {
    const willOpen = !open;

    setOpen(willOpen);

    if (willOpen) {
      markAllAsRead();
    }
  };

  return (
    <div className="notification-wrapper">
      <button
        className="notification"
        type="button"
        onClick={handleToggle}
        aria-label="Повідомлення"
      >
        🔔

        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div>
              <strong>Повідомлення</strong>
              <span>
                {unreadCount > 0
                  ? `${unreadCount} непрочитаних`
                  : "Немає непрочитаних"}
              </span>
            </div>

            <button type="button" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="notification-dropdown-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                Нових повідомлень поки немає.
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.includes(item.id);

                return (
                  <div
                    className={`notification-item notification-${item.type} ${
                      isRead ? "notification-read" : ""
                    }`}
                    key={item.id}
                  >
                    <div className="notification-item-dot" />

                    <div>
                      <div className="notification-item-title">
                        {item.title}
                      </div>
                      <div className="notification-item-text">{item.text}</div>
                      {item.time && (
                        <div className="notification-item-time">
                          {item.time}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
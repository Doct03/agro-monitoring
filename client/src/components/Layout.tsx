import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const navGroups = [
  {
    title: "Основне",
    items: [
      { to: "/", label: "Панель", icon: "▦" },
      { to: "/plots", label: "Ділянки", icon: "▧" },
      { to: "/crops", label: "Культури", icon: "♧" },
      { to: "/crop-references", label: "Довідник культур", icon: "☷" },
      { to: "/recommendations", label: "Рекомендації", icon: "◌" },
      { to: "/forecasts", label: "Прогнози", icon: "⌁" },
    ],
  },
  {
    title: "Аналітика",
    items: [
      { to: "/moisture-chart", label: "Графік вологості", icon: "♢" },
      { to: "/weather-chart", label: "Графік погоди", icon: "☁" },
    ],
  },
  {
    title: "Дії",
    items: [
      { to: "/plots/create", label: "Додати ділянку", icon: "+" },
      { to: "/crops/create", label: "Додати культуру", icon: "+" },
    ],
  },
];

const Layout = () => {
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">☘</div>
          <div>
            Agro <span>Monitor</span>
          </div>
        </div>

        {navGroups.map((group) => (
          <div className="sidebar-section" key={group.title}>
            <div className="sidebar-section-title">{group.title}</div>

            <nav className="sidebar-nav">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    isActive ? "sidebar-link active" : "sidebar-link"
                  }
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        {isAdmin && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Адміністрування</div>

            <nav className="sidebar-nav">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive ? "sidebar-link active" : "sidebar-link"
                }
              >
                <span className="sidebar-link-icon">⚙</span>
                <span>Адмін-панель</span>
              </NavLink>
            </nav>
          </div>
        )}

        <div className="sidebar-tip">
          <div className="sidebar-tip-icon">🌱</div>
          <div className="sidebar-tip-title">Порада дня</div>
          <div className="sidebar-tip-text">
            Регулярно перевіряйте вологість ґрунту для кращого врожаю.
          </div>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="user-box">
            <NotificationBell />

            <div className="user-avatar">
              {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="user-name">{user?.name || "Користувач"}</div>
              <div className="user-role">{user?.email}</div>
            </div>

            <button className="secondary-button" type="button" onClick={logout}>
              Вийти
            </button>
          </div>
        </header>

        <section className="page-content">
          <div className="page-shell">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Layout;
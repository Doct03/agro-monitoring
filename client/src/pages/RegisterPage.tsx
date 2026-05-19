import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    region: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await register(form);
      navigate("/");
    } catch (error: any) {
      setError(error?.response?.data?.message || "Не вдалося зареєструватися.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌱 Agro Monitor</div>

        <h1>Реєстрація</h1>
        <p>Створіть обліковий запис для роботи із системою.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Ім’я
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
          </label>

          <label>
            Регіон
            <input
              value={form.region}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, region: event.target.value }))
              }
              placeholder="Наприклад: Київська область"
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              required
              minLength={6}
            />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Реєстрація..." : "Зареєструватися"}
          </button>
        </form>

        <div className="auth-switch">
          Уже є акаунт? <Link to="/login">Увійти</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
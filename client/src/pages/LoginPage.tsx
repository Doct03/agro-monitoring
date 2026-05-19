import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(form);
      navigate("/");
    } catch (error: any) {
      setError(error?.response?.data?.message || "Не вдалося увійти.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌱 Agro Monitor</div>

        <h1>Вхід</h1>
        <p>Увійдіть в обліковий запис для роботи із системою.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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
            Пароль
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Вхід..." : "Увійти"}
          </button>
        </form>

        <div className="auth-switch">
          Немає акаунта? <Link to="/register">Зареєструватися</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
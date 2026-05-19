import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import PlotsPage from "./pages/PlotsPage";
import CropsPage from "./pages/CropsPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import ForecastsPage from "./pages/ForecastsPage";
import MoistureChartPage from "./pages/MoistureChartPage";
import WeatherChartPage from "./pages/WeatherChartPage";
import CreatePlotPage from "./pages/CreatePlotPage";
import CreateCropPage from "./pages/CreateCropPage";
import CreateMoisturePage from "./pages/CreateMoisturePage";
//import GenerateForecastPage from "./pages/GenerateForecastPage";
import CropDetailsPage from "./pages/CropDetailsPage";
import PlotDetailsPage from "./pages/PlotDetailsPage";
import CropReferencesPage from "./pages/CropReferencesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";


function App() {
  return (
    <BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="plots" element={<PlotsPage />} />
        <Route path="crops" element={<CropsPage />} />
        <Route path="crop-references" element={<CropReferencesPage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="forecasts" element={<ForecastsPage />} />
        <Route path="moisture-chart" element={<MoistureChartPage />} />
        <Route path="weather-chart" element={<WeatherChartPage />} />
        <Route path="plots/create" element={<CreatePlotPage />} />
        <Route path="crops/create" element={<CreateCropPage />} />
        <Route path="moisture/create" element={<CreateMoisturePage />} />
        <Route path="crops/:id" element={<CropDetailsPage />} />
        <Route path="plots/:id" element={<PlotDetailsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
  );
}

export default App;


/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
*/
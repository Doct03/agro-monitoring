import { Router } from "express";
import {
  updatePlotWeather,
  getPlotWeatherHistory,
} from "../controllers/weather.controller";

const router = Router();

router.post("/:plotId/update", updatePlotWeather);
router.get("/:plotId/history", getPlotWeatherHistory);

export default router;

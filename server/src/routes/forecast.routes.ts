import { Router } from "express";
import {
  getForecasts,
  generateForecastsForAllCrops,
} from "../controllers/forecast.controller";

const router = Router();

router.get("/", getForecasts);
router.post("/generate-all", generateForecastsForAllCrops);

export default router;
import { Router } from "express";
import { createPlot, getPlots, getPlotById } from "../controllers/plot.controller";

const router = Router();

router.post("/", createPlot);
router.get("/", getPlots);
router.get("/:id", getPlotById);

export default router;
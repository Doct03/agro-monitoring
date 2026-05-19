import { Router } from "express";
import { runMonitoringNow } from "../controllers/system.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/run-monitoring", authMiddleware, runMonitoringNow);

export default router;
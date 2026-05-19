import { Router } from "express";
import {
  createIoTSensor,
  createTestIoTReading,
  disableIoTSensor,
  getIoTSensors,
  receiveMoistureFromSensor,
} from "../controllers/iot.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/sensors", authMiddleware, getIoTSensors);
router.post("/sensors", authMiddleware, createIoTSensor);
router.patch("/sensors/:id/disable", authMiddleware, disableIoTSensor);
router.post("/sensors/:id/test-reading", authMiddleware, createTestIoTReading);

router.post("/moisture", receiveMoistureFromSensor);

export default router;
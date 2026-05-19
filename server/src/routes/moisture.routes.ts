import { Router } from "express";
import {
  createMoistureRecord,
  getCropMoistureHistory,
} from "../controllers/moisture.controller";

const router = Router();

router.post("/", createMoistureRecord);
router.get("/:cropId/history", getCropMoistureHistory);

export default router;

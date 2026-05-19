import { Router } from "express";
import {
  generateRecommendationForCrop,
  getRecommendations,
  previewRecommendationForCrop,
} from "../controllers/recommendation.controller";

const router = Router();

router.get("/", getRecommendations);
router.get("/:cropId/preview", previewRecommendationForCrop);
router.post("/:cropId/generate", generateRecommendationForCrop);

export default router;
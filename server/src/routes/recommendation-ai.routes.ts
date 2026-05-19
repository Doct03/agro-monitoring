import { Router } from "express";
import { generateRecommendationHint } from "../controllers/recommendation-ai.controller";

const router = Router();

router.get("/:id/hint", generateRecommendationHint);

export default router;
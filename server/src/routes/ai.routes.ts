import { Router } from "express";
import { fillMissingData } from "../controllers/ai.controller";

const router = Router();

router.post("/fill-missing", fillMissingData);

export default router;
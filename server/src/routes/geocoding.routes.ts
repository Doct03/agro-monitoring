import { Router } from "express";
import { detectCoordinates } from "../controllers/geocoding.controller";

const router = Router();

router.post("/detect-coordinates", detectCoordinates);

export default router;
import { Router } from "express";
import { createCrop, getCropById, getCrops } from "../controllers/crop.controller";

const router = Router();

router.get("/", getCrops);
router.get("/:id", getCropById);
router.post("/", createCrop);

export default router;
import { Router } from "express";
import {
  getCropCatalogController,
  detectCropReferenceController,
  createCropReferenceWithAI,
  getCropReferences,
  createCropReference,
  deleteCropReference,
  findCropReferenceByName,
} from "../controllers/crop-reference.controller";

const router = Router();

router.get("/", getCropReferences);
router.get("/catalog", getCropCatalogController);
router.get("/search", findCropReferenceByName);

router.post("/detect", detectCropReferenceController);
router.post("/ai-create", createCropReferenceWithAI);
router.post("/", createCropReference);

router.delete("/:id", deleteCropReference);

export default router;
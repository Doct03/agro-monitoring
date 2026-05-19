import { Router } from "express";
import {
  getAdminOverview,
  getAdminUsers,
} from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/overview", getAdminOverview);
router.get("/users", getAdminUsers);

export default router;
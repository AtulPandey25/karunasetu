import { Router } from "express";
import { DonorController } from "../controllers/DonorController";
import { requireAdminKey } from "../middleware/adminAuth";

const router = Router();
const donorController = new DonorController();

router.get("/", (req, res) => donorController.getAll(req, res));

router.post(
  "/admin",
  requireAdminKey,
  donorController.getUploadMiddleware(),
  (req, res) => donorController.create(req, res)
);

router.delete("/admin/:id", requireAdminKey, (req, res) =>
  donorController.delete(req, res)
);

router.post("/admin/reorder", requireAdminKey, (req, res) =>
  donorController.reorder(req, res)
);

export default router;

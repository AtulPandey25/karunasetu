import { Router } from "express";
import { GalleryController } from "../controllers/GalleryController";
import { requireAdminKey } from "../middleware/adminAuth";

const router = Router();
const galleryController = new GalleryController();

router.get("/", (req, res) => galleryController.getAll(req, res));

router.get("/featured", (req, res) => galleryController.getFeatured(req, res));

router.patch("/admin/:id", requireAdminKey, (req, res) =>
  galleryController.toggleFeatured(req, res)
);

router.post(
  "/admin",
  requireAdminKey,
  galleryController.getUploadMiddleware(),
  (req, res) => galleryController.upload(req, res)
);

router.delete("/admin/:id", requireAdminKey, (req, res) =>
  galleryController.delete(req, res)
);

export default router;

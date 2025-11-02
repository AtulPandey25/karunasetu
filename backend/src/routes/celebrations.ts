import { Router } from "express";
import { CelebrationController } from "../controllers/CelebrationController";
import { ProductController } from "../controllers/ProductController";
import { requireAdminKey } from "../middleware/adminAuth";

const router = Router();
const celebrationController = new CelebrationController();
const productController = new ProductController();

// Public routes
router.get("/", (req, res) => celebrationController.getAll(req, res));
router.get("/:id", (req, res) => celebrationController.getById(req, res));
router.get("/:id/products", (req, res) =>
  productController.getByCategory(req, res)
);

// Admin routes - Celebrations
router.post(
  "/admin",
  requireAdminKey,
  celebrationController.getUploadMiddleware(),
  (req, res) => celebrationController.create(req, res)
);

router.patch(
  "/admin/:id",
  requireAdminKey,
  celebrationController.getUploadMiddleware(),
  (req, res) => celebrationController.update(req, res)
);

router.delete("/admin/:id", requireAdminKey, (req, res) =>
  celebrationController.delete(req, res)
);

router.post("/admin/reorder", requireAdminKey, (req, res) =>
  celebrationController.reorder(req, res)
);

// Admin routes - Products
router.post(
  "/products/admin",
  requireAdminKey,
  productController.getUploadMiddleware(),
  (req, res) => productController.create(req, res)
);

router.patch(
  "/products/admin/:id",
  requireAdminKey,
  productController.getUploadMiddleware(),
  (req, res) => productController.update(req, res)
);

router.delete("/products/admin/:id", requireAdminKey, (req, res) =>
  productController.delete(req, res)
);

router.post("/products/admin/reorder", requireAdminKey, (req, res) =>
  productController.reorder(req, res)
);

export default router;

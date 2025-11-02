import { Router } from "express";
import { MemberController } from "../controllers/MemberController";
import { requireAdminKey } from "../middleware/adminAuth";

const router = Router();
const memberController = new MemberController();

router.get("/", (req, res) => memberController.getAll(req, res));

router.post(
  "/admin",
  requireAdminKey,
  memberController.getUploadMiddleware(),
  (req, res) => memberController.create(req, res)
);

router.delete("/admin/:id", requireAdminKey, (req, res) =>
  memberController.delete(req, res)
);

router.post("/admin/reorder", requireAdminKey, (req, res) =>
  memberController.reorder(req, res)
);

export default router;

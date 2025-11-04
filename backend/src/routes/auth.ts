import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import multer from "multer";

const router = Router();
router.use(multer().none());
const authController = new AuthController();

router.post("/login", (req, res) => authController.login(req, res));

export default router;

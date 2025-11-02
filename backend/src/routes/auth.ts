import { Router, json } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();
router.use(json());
const authController = new AuthController();

router.post("/login", (req, res) => authController.login(req, res));

export default router;

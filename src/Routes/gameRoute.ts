import { Router } from "express";
import { home } from "../controllers/gameController.ts";

const router = Router();

router.get('/',home);

export default router;
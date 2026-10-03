import { Router } from "express";
import { home } from "../Controllers/gameController.ts";

const router = Router();

router.get('/',home);

export default router;
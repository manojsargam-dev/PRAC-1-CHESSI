import { Router } from "express";
import { home } from "../Controller/gameController.ts";

const router = Router();

router.get('/',home);

export default router;
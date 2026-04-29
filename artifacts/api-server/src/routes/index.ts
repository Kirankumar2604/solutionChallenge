import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import predictionsRouter from "./predictions.js";
import fairnessRouter from "./fairness.js";
import settingsRouter from "./settings.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(predictionsRouter);
router.use(fairnessRouter);
router.use(settingsRouter);

export default router;

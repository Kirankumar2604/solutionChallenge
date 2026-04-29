import { Router, type IRouter } from "express";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { getOrCreateSettings, updateSettings } from "../lib/store.js";
import { serializeSettings } from "../lib/serializers.js";

const router: IRouter = Router();

router.get("/settings", async (_req, res) => {
  const s = await getOrCreateSettings();
  res.json(serializeSettings(s));
});

router.put("/settings", async (req, res) => {
  const patch = UpdateSettingsBody.parse(req.body);
  const updated = await updateSettings(patch);
  res.json(serializeSettings(updated));
});

export default router;

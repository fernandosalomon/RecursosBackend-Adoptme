import { Router } from "express";
import adoptionsController from "../controllers/adoptions.controller.js";
import { validateMongoId } from "../middleware/validation.js";

const router = Router();

router.get("/", adoptionsController.getAllAdoptions);
router.get("/:aid", validateMongoId(["aid"]), adoptionsController.getAdoption);
router.post(
  "/:uid/:pid",
  validateMongoId(["uid", "pid"]),
  adoptionsController.createAdoption,
);

export default router;

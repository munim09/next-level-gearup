import { Router } from "express";
import { gearController } from "./gear.controller";

const router = Router();

router.get("", gearController.getAllGear);

router.get("/provider/:id", gearController.getProviderGear);

router.get("/:id", gearController.getGearDetails);

export const gearRoutes = router;

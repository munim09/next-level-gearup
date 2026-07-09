import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { gearController } from "../gear/gear.controller";
import { adminController } from "./admin.controller";

const router = Router();

router.post("/category", auth(Role.ADMIN), adminController.createCategory);

router.get("/users", auth(Role.ADMIN), adminController.getAllUsers);

router.patch("/users/:id", auth(Role.ADMIN), adminController.updateUserStatus);

router.get("/gear", auth(Role.ADMIN), gearController.getAllGear);

router.get("/rentals", auth(Role.ADMIN), adminController.getAllRentalOrders);

export const adminRoutes = router;

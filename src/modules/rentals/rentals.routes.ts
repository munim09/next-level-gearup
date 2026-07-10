import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { rentalController } from "./rentals.controller";

const router = Router();

router.post("/", auth(Role.CUSTOMER), rentalController.createRentalOrder);

router.get("/:id", auth(Role.CUSTOMER), rentalController.getRentalOrderDetails);

router.get("/", auth(Role.CUSTOMER), rentalController.getMyRentalOrders);

router.patch(
    "/cancel/:id",
    auth(Role.CUSTOMER),
    rentalController.cancelRentalOrder,
);

export const rentalsRoutes = router;

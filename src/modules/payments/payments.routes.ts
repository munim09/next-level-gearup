import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { paymentsController } from "./payments.controller";

const router = Router();

router.post(
    "/create/:id",
    auth(Role.CUSTOMER),
    paymentsController.createPayment,
);

router.post("/confirm/:status", paymentsController.verifyPayment);

router.get("/check/:tranId", paymentsController.checkPayment);

export const paymentsRoutes = router;

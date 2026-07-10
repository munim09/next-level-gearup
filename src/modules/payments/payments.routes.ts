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

router.get("/", auth(Role.CUSTOMER), paymentsController.getMyPayments);

router.get("/:id", auth(Role.CUSTOMER), paymentsController.getPaymentDetails);

export const paymentsRoutes = router;

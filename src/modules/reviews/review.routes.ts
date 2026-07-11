import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { reviewController } from "./review.controller";

const router = Router();

router.post("/:id", auth(Role.CUSTOMER), reviewController.createReview);

router.get("/:gearId", reviewController.getGearReviews);

export const reviewRoutes = router;

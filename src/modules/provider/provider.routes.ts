import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { providerController } from "./provider.controller";

const router = Router();

router.post(
    "/gear",
    auth(Role.PROVIDER),
    providerController.addGearToInventory,
);

router.put(
    "/gear/:id",
    auth(Role.PROVIDER),
    providerController.updateGearListing,
);

router.patch(
    "/gear/:id",
    auth(Role.PROVIDER),
    providerController.updateGearStock,
);

router.delete(
    "/gear/:id",
    auth(Role.PROVIDER),
    providerController.removeGearFromInventory,
);

router.get(
    "/orders",
    auth(Role.PROVIDER),
    providerController.getProviderOrders,
);

router.patch(
    "/orders/:id",
    auth(Role.PROVIDER),
    providerController.updateRentalOrderStatus,
);

export const providerRoutes = router;

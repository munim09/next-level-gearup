import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { providerService } from "./provider.service";

const addGearToInventory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const gear = await providerService.addGearToInventory(
            req.user?.id as string,
            req.body,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "Gear added successfully.",
            data: {
                gear,
            },
        });
    },
);

const updateGearListing = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const gear = await providerService.updateGearListing(
            req.user?.id as string,
            req.params.id as string,
            req.body,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Gear updated successfully.",
            data: {
                gear,
            },
        });
    },
);

const removeGearFromInventory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        await providerService.removeGearFromInventory(
            req.user?.id as string,
            req.params.id as string,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Gear removed successfully.",
            data: null,
        });
    },
);

const getProviderOrders = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await providerService.getProviderOrdersFromDB(
            req.user?.id as string,
            req.query,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Provider orders fetched successfully.",
            data: result.data,
            meta: result.meta,
        });
    },
);

const updateRentalOrderStatus = catchAsync(async (req, res) => {
    const order = await providerService.updateRentalOrderStatusIntoDB(
        req.user!.id,
        req.params.id as string,
        req.body,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental order status updated successfully.",
        data: {
            order,
        },
    });
});

const updateGearStock = catchAsync(async (req: Request, res: Response) => {
    const result = await providerService.updateGearStockIntoDB(
        req.user!.id,
        req.params.id as string,
        req.body,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Gear stock updated successfully.",
        data: result,
    });
});

export const providerController = {
    addGearToInventory,
    updateGearListing,
    removeGearFromInventory,
    getProviderOrders,
    updateRentalOrderStatus,
    updateGearStock,
};

import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { rentalService } from "./rentals.service";

const createRentalOrder = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const order = await rentalService.createRentalOrderIntoDB(
            req.user?.id as string,
            req.body,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "Rental order placed successfully.",
            data: {
                order,
            },
        });
    },
);

const getRentalOrderDetails = catchAsync(
    async (req: Request, res: Response) => {
        const order = await rentalService.getRentalOrderDetailsFromDB(
            req.user?.id as string,
            req.params.id as string,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Rental order fetched successfully.",
            data: {
                order,
            },
        });
    },
);

const getMyRentalOrders = catchAsync(async (req: Request, res: Response) => {
    const result = await rentalService.getMyRentalOrdersFromDB(
        req.user?.id as string,
        req.query,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental orders fetched successfully.",
        data: result.data,
        meta: result.meta,
    });
});

const cancelRentalOrder = catchAsync(async (req: Request, res: Response) => {
    const result = await rentalService.cancelRentalOrderIntoDB(
        req.user!.id,
        req.params.id as string,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental order cancelled successfully.",
        data: result,
    });
});

export const rentalController = {
    createRentalOrder,
    getRentalOrderDetails,
    getMyRentalOrders,
    cancelRentalOrder,
};

import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { gearService } from "./gear.service";

const getAllGear = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await gearService.getAllGearFromDB(req.query);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Gear fetched successfully.",
            data: result.data,
            meta: result.meta,
        });
    },
);

const getProviderGear = catchAsync(async (req: Request, res: Response) => {
    const result = await gearService.getProviderGearFromDB(
        req.params.id as string,
        req.query,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Provider gear fetched successfully.",
        data: result.data,
        meta: result.meta,
    });
});

const getGearDetails = catchAsync(async (req: Request, res: Response) => {
    const gear = await gearService.getGearDetailsFromDB(
        req.params.id as string,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Gear details fetched successfully.",
        data: {
            gear,
        },
    });
});

export const gearController = {
    getAllGear,
    getProviderGear,
    getGearDetails,
};

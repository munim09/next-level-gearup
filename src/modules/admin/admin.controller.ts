import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { adminService } from "./admin.service";

const createCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const category = await adminService.createCategoryIntoDB(req.body);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "Category created successfully.",
            data: {
                category,
            },
        });
    },
);

const getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await adminService.getAllUsersFromDB(req.query);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Users fetched successfully.",
            data: result.data,
            meta: result.meta,
        });
    },
);

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const user = await adminService.updateUserStatusIntoDB(
        req.params.id as string,
        req.body,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User status updated successfully.",
        data: {
            user,
        },
    });
});

const getAllRentalOrders = catchAsync(async (req: Request, res: Response) => {
    const result = await adminService.getAllRentalOrdersFromDB(req.query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental orders fetched successfully.",
        data: result.data,
        meta: result.meta,
    });
});

export const adminController = {
    createCategory,
    getAllUsers,
    updateUserStatus,
    getAllRentalOrders,
};

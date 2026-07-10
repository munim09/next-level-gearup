import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentsService } from "./payments.service";

const createPayment = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await paymentsService.initiatePaymentIntoDB(
            req.user?.id as string,
            req.params.id as string,
        );

        // console.log("result", result);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Payment initiated",
            data: result,
        });
    },
);

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
    const { status } = req.params;
    const { tranId } = req.query;

    const result = await paymentsService.verifyPaymentIntoDB(
        tranId as string,
        status as string,
        req.body,
    );
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment verified successfully.",
        data: result,
    });
});

const checkPayment = catchAsync(async (req: Request, res: Response) => {
    const { tranId } = req.params;

    const result = await paymentsService.validateTransactionByTranId(
        tranId as string,
    );
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment details from Payment Channel",
        data: result,
    });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
    const result = await paymentsService.getMyPaymentsFromDB(
        req.user!.id,
        req.query,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment history fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getPaymentDetails = catchAsync(async (req: Request, res: Response) => {
    const result = await paymentsService.getPaymentDetailsFromDB(
        req.user!.id as string,
        req.params.id as string,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment details fetched successfully.",
        data: result,
    });
});

export const paymentsController = {
    createPayment,
    verifyPayment,
    checkPayment,
    getMyPayments,
    getPaymentDetails,
};

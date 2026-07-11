import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { reviewService } from "./review.service";

const createReview = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await reviewService.createReviewIntoDB(
            req.user!.id,
            req.params.id as string,
            req.body,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Review submitted successfully.",
            data: result,
        });
    },
);

const getGearReviews = catchAsync(async (req, res) => {
    const result = await reviewService.getGearReviewsFromDB(
        req.params.gearId as string,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Gear reviews fetched successfully.",
        data: result,
    });
});

export const reviewController = { createReview, getGearReviews };

import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { authService } from "./auth.service";

const getMyProfile = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const profile = await authService.getMyProfileFromDB(
            req.user?.id as string,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User profile fetched successfully",
            data: { profile },
        });
    },
);

const registerUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const payload = req.body;

        const user = await authService.registerUserIntoDB(payload);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "User registered successfully",
            data: { user },
        });
    },
);

const loginUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const payload = req.body;

        const { accessToken, refreshToken } =
            await authService.loginUser(payload);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User logged in successfully",
            data: { accessToken, refreshToken },
        });
    },
);

const refreshToken = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { refreshToken } = req.body;
        // const refreshToken = req.cookies.refreshToken ;

        const { accessToken } = await authService.refreshToken(refreshToken);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24,
        });

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Token Refreshed Successfully",
            data: {
                accessToken,
            },
        });
    },
);

export const authController = {
    loginUser,
    refreshToken,
    registerUser,
    getMyProfile,
};

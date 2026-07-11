import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import httpStatus from "http-status";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import { adminRoutes } from "./modules/admin/admin.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { gearRoutes } from "./modules/gear/gear.routes";
import { gearService } from "./modules/gear/gear.service";
import { paymentsRoutes } from "./modules/payments/payments.routes";
import { providerRoutes } from "./modules/provider/provider.routes";
import { rentalsRoutes } from "./modules/rentals/rentals.routes";
import { reviewRoutes } from "./modules/reviews/review.routes";
import { catchAsync } from "./utils/catchAsync";
import { sendResponse } from "./utils/sendResponse";

const app: Application = express();

// app.use("/api/subscription/webhook", express.raw({ type: 'application/json' }))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: `${process.env.APP_URL}`,
        credentials: true,
    }),
);

app.get("/", async (req: Request, res: Response) => {
    res.send("Hello, World!");
});

app.use("/api/auth", authRoutes);

app.use("/api/provider", providerRoutes);

app.use("/api/rentals", rentalsRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/payments", paymentsRoutes);

app.use("/api/gear", gearRoutes);

app.use("/api/reviews", reviewRoutes);

app.use(
    "/api/categories",
    catchAsync(async (req: Request, res: Response) => {
        const categories = await gearService.getAllCategoriesFromDB();

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Categories fetched successfully.",
            data: {
                categories,
            },
        });
    }),
);

app.use(notFound);

app.use(globalErrorHandler);

export default app;

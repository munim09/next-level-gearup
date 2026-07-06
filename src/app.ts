import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import { authRoutes } from "./modules/auth/auth.routes";

const app: Application = express();

// app.use("/api/subscription/webhook", express.raw({ type: 'application/json' }))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: `${config.app_url}:${config.port}`,
        credentials: true,
    }),
);

app.get("/", async (req: Request, res: Response) => {
    res.send("Hello, World!");
});

app.use("/api/auth", authRoutes);

app.use(notFound);

app.use(globalErrorHandler);

export default app;

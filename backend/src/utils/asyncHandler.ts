import { Request, Response, NextFunction } from "express";
import ApiError from "./ApiError";

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            if (err instanceof ApiError) {
                return err.send(res);
            }
            console.log("Unhandled error:", err);
            const statusCode = err.statusCode || 500;
            const message = err.message || "Internal Server Error";
            new ApiError(
                statusCode,
                message,
                err.errors || []
            ).send(res);
        });
    };
};

export default asyncHandler;

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler";
import { STATUS_CODE } from "../constant/statuscode.const";
import ApiError from "../utils/ApiError";
import User from "../models/user.model";


interface JwtPayload {
    userId: string;
    role: string;
}

export const authMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Unauthorized request");
    }

    const decodedtoken = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    const user = await User.findById(decodedtoken?.userId);
    if (!user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Invalid access token");
    }
    req.user = {
        userId: user.id,
        role: user.role
    };
    next();
});


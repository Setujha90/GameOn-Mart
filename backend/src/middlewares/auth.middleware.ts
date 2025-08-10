import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler";
import { STATUS_CODE } from "../constant/statuscode.const";
import ApiError from "../utils/ApiError";
import User from "../models/user.model";

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}


interface JwtPayload {
    userId: string;
    role: string;
}

export const authMiddleware = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
   // console.log(req.cookies, req.headers.cookie)
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
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

export const isAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?.userId);
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }

    if (user.role !== 'admin') {
        throw new ApiError(STATUS_CODE.FORBIDDEN, "Access denied");
    }

    next();
});

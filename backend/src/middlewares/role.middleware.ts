import {Request, Response , NextFunction} from "express";
import ApiError from "../utils/ApiError";
import { STATUS_CODE } from "../constant/statuscode.const";

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) {
            throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Unauthorized request");
        }
        if (!roles.includes(user?.role)) {
            throw new ApiError(STATUS_CODE.FORBIDDEN, "Forbidden");
        }
        next();
    };
};

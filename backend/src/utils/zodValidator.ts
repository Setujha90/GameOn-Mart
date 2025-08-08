import z, { ZodError } from "zod";
import ApiError from "./ApiError";
import { STATUS_CODE } from "../constant/statuscode.const";


export const zodValidator = <T extends z.ZodTypeAny>(schema: T, data: z.infer<T>) => {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessages = error.issues.map((err: z.ZodIssue) => ({
                field: err.path.join('.'),
                message: err.message
            }));
            
            throw new ApiError(
                STATUS_CODE.BAD_REQUEST,
                "Validation failed",
                errorMessages
            );
        }

        throw new ApiError(
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred while validating data."
        )
    }
}
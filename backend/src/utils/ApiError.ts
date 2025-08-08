import { Response } from "express";

class ApiError extends Error {
    public statusCode: number;
    public errors ?: any[];

    constructor(statusCode: number, message: string, errors?: any[]) {
        super(message); 
        this.statusCode = statusCode; 
        this.errors = errors; 
        Error.captureStackTrace(this, this.constructor);
    }

    send(res: Response) {
        console.error(this.stack, this.errors);
        res.status(this.statusCode).json({
            success: false,
            message: this.message,
            errors: this.errors || [],
        });
        return;
    }
}

export default ApiError;
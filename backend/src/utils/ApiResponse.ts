import { Response } from "express";

export default class ApiResponse<T> {
    public success: boolean;
    public statusCode: number;
    public message: string;
    public data?: T;

    constructor(statusCode: number, message: string, data?: T) {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    send(res: Response) {
        res.status(this.statusCode).json({
            success: this.success,
            message: this.message,
            data: this.data,
        });
        return;
    }
}

import mongoose, { Document, Schema } from 'mongoose';

export enum OTPAction {
    LOGIN = "login",
    REGISTER = "register",
    RESET_PASSWORD = "reset_password",
    UPDATE_PASSWORD = "update_password"
}

export interface IOtp extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
    action: OTPAction;
}

const otpSchema: Schema = new Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
        },
        otp: {
            type: String,
            required: [true, 'OTP is required'],
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        action: {
            type: String,
            enum: Object.values(OTPAction),
            required: [true, 'OTP action is required'],
        },
    },
    { timestamps: true }
);

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);

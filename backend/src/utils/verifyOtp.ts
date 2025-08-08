
import { Otp, OTPAction } from "../models/otp.model";
import ApiError from "./ApiError";
import bcrypt from "bcryptjs";
import { STATUS_CODE } from "../constant/statuscode.const";

export const verifyOtp = async (email: string, otp: string, action: OTPAction) => {
    const existingOtp = await Otp.findOne({ email, action });

    if (!existingOtp) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "No OTP found or OTP expired.");
    }

    if (existingOtp.expiresAt < new Date()) {
        await existingOtp.deleteOne();
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "OTP has expired. Please request a new one.");
    }

    const isOtpValid = await bcrypt.compare(otp, existingOtp.otp);
    if (!isOtpValid) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid OTP.");
    }

   // await existingOtp.deleteOne(); 

    return true;
};

import { OTPAction, Otp } from "../models/otp.model";
import sendEmail from "./sendEmail";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { NextFunction, Request, Response } from "express";

export async function sendOtp(email: string, action: OTPAction) {
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.findOneAndDelete({ email, action });

    await Otp.create({ email, otp: hashedOtp, expiresAt, action });

    await sendEmail(email,
        "Your OTP Code",
        `<h3>Welcome to GameOn Mart</h3><p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
    );

    return otp;
}

export async function sendRegisterOtpMiddleware(req:Request, res: Response, next: NextFunction) {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("User already exists with this email.");
    }
    next()
}
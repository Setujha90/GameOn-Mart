import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { Otp } from "../models/otp.model";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import { zodValidator } from "../utils/zodValidator";
import { sendOtpSchema, registerSchema, sendOtpForLoginSchema, loginVerifySchema }
    from "../zodSchema/auth.schema";
import { sendOtp as sendOtpUtil } from "../utils/sendOtp";
import { OTPAction } from "../models/otp.model";
import { STATUS_CODE } from "../constant/statuscode.const";
import { verifyOtp } from "../utils/verifyOtp";
import User, { IUser } from "../models/user.model";
import bcrypt from "bcryptjs";
import { uploadToCloudinary } from "../utils/cloudinary";
import { hashPassword, comparePassword } from "../utils/hashpass";
import { generateTokens } from "../utils/jwt";


//*Send Otp to email for registration
export const sendOtpForRegistration = asyncHandler(async (req: Request, res: Response) => {

    const { email } = zodValidator(sendOtpSchema, req.body);
    await sendOtpUtil(email, OTPAction.REGISTER);
    return new ApiResponse(STATUS_CODE.OK, "OTP sent successfully", { email }).send(res);
})

//* Register User
export const verifyAndRegisterUser = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, username, email, password, otp } = zodValidator(registerSchema, req.body);
    const localPath = req.file?.path;
    if (!localPath) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Avatar is required");
    }

    await verifyOtp(email, otp, OTPAction.REGISTER);


    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(STATUS_CODE.CONFLICT, "User already exists with this email.");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const avatar = await uploadToCloudinary(localPath);
    if (!avatar) {
        throw new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR, "Failed to upload avatar");
    }

    const user = await User.create({
        fullName,
        username,
        email,
        avatar,
        password: hashedPassword,
        isVerified: true,
    });


    return new ApiResponse(STATUS_CODE.CREATED, "User registered successfully", {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
    }).send(res);
});

// SendOtp for login
export const sendOtpForLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = zodValidator(sendOtpForLoginSchema, req.body);
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }

    const pass = await hashPassword(password);
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Invalid credentials");
    }

    await sendOtpUtil(email, OTPAction.LOGIN);
    return new ApiResponse(STATUS_CODE.OK, "OTP sent successfully for login", { email }).send(res);
});

//Verify Otp and Login
export const verifyOtpAndLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = zodValidator(loginVerifySchema, req.body);
    await verifyOtp(email, otp, OTPAction.LOGIN);

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }

    const tokens = generateTokens({ userId: (user as any)._id.toString(), role: user.role });
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000,
    })
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, 
    })


    return new ApiResponse(STATUS_CODE.OK, "Login successful", {
        email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    }).send(res);
});

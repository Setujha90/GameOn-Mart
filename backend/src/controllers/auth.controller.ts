import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import { zodValidator } from "../utils/zodValidator";
import { sendOtpSchema, registerSchema, sendOtpForLoginSchema, loginVerifySchema, sendOtpForResetPasswordSchema, resetPasswordSchema, updatePasswordSchema}
    from "../zodSchema/auth.schema";
import { sendOtp, sendOtp as sendOtpUtil } from "../utils/sendOtp";
import { OTPAction } from "../models/otp.model";
import { STATUS_CODE } from "../constant/statuscode.const";
import { verifyOtp } from "../utils/verifyOtp";
import User, { IUser } from "../models/user.model";
import bcrypt from "bcryptjs";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary";
import { hashPassword, comparePassword } from "../utils/hashpass";
import { generateTokens } from "../utils/jwt";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import jwt from "jsonwebtoken";


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

//* SendOtp for login
export const sendOtpForLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = zodValidator(sendOtpForLoginSchema, req.body);
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }

   // const pass = await hashPassword(password);
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Invalid credentials");
    }

    await sendOtpUtil(email, OTPAction.LOGIN);
    return new ApiResponse(STATUS_CODE.OK, "OTP sent successfully for login", { email }).send(res);
});

//*Verify Otp and Login
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
        maxAge: 45* 60 * 1000,
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

//*Get Logged in User
export const getLoggedinUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Unauthorized request");
    }
    return new ApiResponse(STATUS_CODE.OK, "User retrieved successfully", {
        user
    }).send(res);
});

//*Logout 
export const logoutController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await User.findByIdAndUpdate(req.user?.userId, { refreshToken: null });
    
    res
        .clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })
        .clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
    return new ApiResponse(STATUS_CODE.OK, "Logout successful").send(res);
});

//*RefreshAccessToken
export const refreshAccessToken = asyncHandler(async(req: Request, res: Response)=> {
    const incomingtoken = req.cookies?.refreshToken || req.body?.refreshToken;
    if(!incomingtoken){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Refresh token missing");
    }
    
    let decodedtoken : any
    try {
        decodedtoken =jwt.verify(incomingtoken, process.env.JWT_REFRESH_SECRET as string);
    } catch (error) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Invalid refresh token");
        
    }

    const user = await User.findById(decodedtoken.userId);
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }

    if (user.refreshToken !== incomingtoken) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "RefreshToken mismatch");
    }

    const tokens = generateTokens({ userId: (user as any)._id.toString(), role: user.role });
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 45 * 60 * 1000,
    });
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return new ApiResponse(STATUS_CODE.OK, "Access token refreshed successfully", {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    }).send(res);
});

export const sendOtpForResetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = zodValidator(sendOtpForResetPasswordSchema, req.body);
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }
    await sendOtpUtil(email, OTPAction.RESET_PASSWORD);
    return new ApiResponse(STATUS_CODE.OK, "OTP sent for password reset").send(res);
});

export const ResetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = zodValidator(resetPasswordSchema, req.body);
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }
    const isValidOtp = await verifyOtp(email, otp, OTPAction.RESET_PASSWORD);
    if (!isValidOtp) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Invalid OTP");
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashPassword;
    await user.save({ validateBeforeSave: false });
    return new ApiResponse(STATUS_CODE.OK, "Password reset successful").send(res);
});

export const updatePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { oldPassword, newPassword } = zodValidator(updatePasswordSchema, req.body);
    const user = await User.findById(req.user?.userId);
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }
    //const oldPasswordHash = await bcrypt.hash(oldPassword, 10);
    const isMatch = await comparePassword(oldPassword,user.password);
    if (!isMatch) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Old password is incorrect");
    }

    if (oldPassword === newPassword) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "New password must be different from old password");
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save({ validateBeforeSave: false });
    return new ApiResponse(STATUS_CODE.OK, "Password updated successfully").send(res);
});

export const updateUserAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user?.userId);
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }

    if (user.avatar?.public_id) {
        await deleteFromCloudinary(user.avatar.public_id);
    }

    const localPath = req.file?.path;
    if (!localPath) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Avatar is required");
    }


    const avatar = await uploadToCloudinary(localPath);
    user.avatar = avatar;
    await user.save({ validateBeforeSave: false });

    return new ApiResponse(STATUS_CODE.OK, "User avatar updated successfully", {
        avatar: user.avatar
    }).send(res);
});

export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user?.userId);
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }

    if(user.avatar?.public_id) {
        await deleteFromCloudinary(user.avatar.public_id);
    }

    await User.findByIdAndDelete(req.user?.userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return new ApiResponse(STATUS_CODE.OK, "User deleted successfully").send(res);
});

export const requestSeller = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user?.userId);
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }

    if (user.isSeller) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "User is already a seller");
    }

    if (user.isSellerRequest) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Seller request already sent");
    }

    user.isSellerRequest = true;
    await user.save({ validateBeforeSave: false });

    return new ApiResponse(STATUS_CODE.OK, "Seller request sent successfully",
        user.id
    ).send(res);
});

export const approvesSellerRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "User not found");
    }

    if (!user.isSellerRequest) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "No seller request found");
    }

    user.isSeller = true;
    user.role = 'seller';
    user.isSellerRequest = false;
    await user.save({ validateBeforeSave: false });

    return new ApiResponse(STATUS_CODE.OK, "Seller request approved successfully").send(res);
});

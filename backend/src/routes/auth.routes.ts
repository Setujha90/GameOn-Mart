import { Router } from "express";
import {sendOtpForLogin, sendOtpForRegistration,verifyAndRegisterUser, verifyOtpAndLogin, logoutController, getLoggedinUser, refreshAccessToken, sendOtpForResetPassword,ResetPassword,updatePassword, updateUserAvatar, deleteUser, requestSeller, approvesSellerRequest } from "../controllers/auth.controller";
import { sendRegisterOtpMiddleware } from "../utils/sendOtp";
import asyncHandler from "../utils/asyncHandler";
import { upload } from "../middlewares/multer.middleware";
import { authMiddleware, isAdmin } from "../middlewares/auth.middleware";

const authRouter = Router();


authRouter.post("/send-otp", asyncHandler(sendRegisterOtpMiddleware),sendOtpForRegistration);
authRouter.post("/register",upload.single("avatar"), verifyAndRegisterUser);
authRouter.post("/login/send-otp", sendOtpForLogin);
authRouter.post("/login",verifyOtpAndLogin);
authRouter.get("/me", authMiddleware, getLoggedinUser)
authRouter.post("/logout",authMiddleware, logoutController);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.post("/reset-password/send-otp",sendOtpForResetPassword);
authRouter.post("/reset-password", ResetPassword);
authRouter.post("/update-password", authMiddleware, updatePassword);
authRouter.post("/update-avatar", authMiddleware, upload.single("avatar"), updateUserAvatar);
authRouter.delete("/delete", authMiddleware, deleteUser);
authRouter.post("/request-seller", authMiddleware, requestSeller);
authRouter.post("/admin/approve-seller/:userId", authMiddleware, isAdmin, approvesSellerRequest);

export default authRouter;
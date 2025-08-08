import { Router } from "express";
import {sendOtpForLogin, sendOtpForRegistration,verifyAndRegisterUser, verifyOtpAndLogin, logoutController, getLoggedinUser } from "../controllers/auth.controller";
import { sendRegisterOtpMiddleware } from "../utils/sendOtp";
import asyncHandler from "../utils/asyncHandler";
import { upload } from "../middlewares/multer.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const authRouter = Router();


authRouter.post("/send-otp", asyncHandler(sendRegisterOtpMiddleware),sendOtpForRegistration);
authRouter.post("/register",upload.single("avatar"), verifyAndRegisterUser);
authRouter.post("/login/send-otp", sendOtpForLogin);
authRouter.post("/login",verifyOtpAndLogin);
authRouter.get("/me", authMiddleware, getLoggedinUser)
authRouter.post("/logout",authMiddleware, logoutController);


export default authRouter;
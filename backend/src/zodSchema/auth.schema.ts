import z from "zod";

export const sendOtpSchema = z.object({
    email: z
        .email({ message: "Please enter correct email" }),
})


export const registerSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    otp: z.string().length(6, "OTP must be 6 digits"),
});


export const sendOtpForLoginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const loginVerifySchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
});
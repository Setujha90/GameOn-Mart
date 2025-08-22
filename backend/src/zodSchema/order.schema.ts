import { z } from "zod";
import mongoose from "mongoose";

export const createOrderSchema = z.object({
    iscart: z.boolean({ message: "iscart is required and must be a boolean" }),

    productId: z
        .string()
        .optional()
        .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
            message: "Invalid product ID",
        }),

    quantity: z
        .number({
            message: "quantity must be a number",
        })
        .int({ message: "quantity must be an integer" })
        .min(1, { message: "quantity must be at least 1" })
        .optional(),

    paymentMode: z.enum(["COD", "CreditCard", "DebitCard", "UPI", "NetBanking"], {
        message: "paymentMode is required and must be one of the following: COD, CreditCard, DebitCard, UPI, NetBanking",
    }),

    shippingAddress: z.object({
        fullName: z.string().min(1, "Full name is required"),
        phone: z
            .string()
            .regex(/^\d{10,15}$/, "Phone must be between 10 to 15 digits"),
        address: z.string().min(1, "Address is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        postalCode: z.string().regex(/^\d{4,10}$/, "Invalid postal code"),
        country: z.string().min(1, "Country is required"),
    }),
}).refine(
    (data) => {
        if (!data.iscart) {
            return !!data.productId && !!data.quantity;
        }
        return true;
    },
    {
        message: "productId and quantity are required when iscart is false",
        path: ["productId", "quantity"],
    }
);
